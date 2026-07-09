import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

// Mock the email transport so tests never hit the network and we can assert
// exactly which emails would be sent.
vi.mock("@/lib/email", () => ({
  sendReplyConfirmationEmail: vi.fn().mockResolvedValue(undefined),
  sendReplyNotificationEmail: vi.fn().mockResolvedValue(undefined),
}));

import {
  sendReplyConfirmationEmail,
  sendReplyNotificationEmail,
} from "@/lib/email";
import { createReplySubscription, notifyReplySubscribers } from "@/lib/subscriptions";

const confirmMock = vi.mocked(sendReplyConfirmationEmail);
const notifyMock = vi.mocked(sendReplyNotificationEmail);

async function createDocWithTopComment() {
  const doc = await prisma.doc.create({
    data: {
      slug: generateSlug(),
      title: "Sub Doc",
      content: "# Hi",
      visibility: "public",
      magicToken: hashToken(generateMagicToken()),
      apiKey: hashToken(generateApiKey()),
    },
  });
  const comment = await prisma.comment.create({
    data: { docId: doc.id, body: "top-level", author: "alice" },
  });
  return { doc, comment };
}

describe("createReplySubscription (double opt-in)", () => {
  beforeEach(() => {
    confirmMock.mockClear();
    notifyMock.mockClear();
  });

  it("creates an unconfirmed subscription and sends a confirmation (not a notification)", async () => {
    const { doc, comment } = await createDocWithTopComment();

    const { pending } = await createReplySubscription({
      doc,
      targetCommentId: comment.id,
      email: "sub@example.com",
    });

    expect(pending).toBe(true);
    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).not.toHaveBeenCalled();

    const sub = await prisma.commentSubscription.findFirst({
      where: { commentId: comment.id, email: "sub@example.com" },
    });
    expect(sub).not.toBeNull();
    expect(sub?.confirmedAt).toBeNull();
    expect(sub?.confirmToken).not.toBeNull();
    expect(sub?.unsubToken).toBeTruthy();
  });

  it("ignores an invalid email", async () => {
    const { doc, comment } = await createDocWithTopComment();

    const { pending } = await createReplySubscription({
      doc,
      targetCommentId: comment.id,
      email: "not-an-email",
    });

    expect(pending).toBe(false);
    expect(confirmMock).not.toHaveBeenCalled();
    const count = await prisma.commentSubscription.count();
    expect(count).toBe(0);
  });

  it("does not send a second confirmation while one is pending for the same email + doc", async () => {
    const { doc, comment } = await createDocWithTopComment();

    await createReplySubscription({ doc, targetCommentId: comment.id, email: "sub@example.com" });
    const second = await createReplySubscription({
      doc,
      targetCommentId: comment.id,
      email: "SUB@example.com", // case-insensitive
    });

    expect(second.pending).toBe(true);
    expect(confirmMock).toHaveBeenCalledTimes(1); // no duplicate confirmation email
    const count = await prisma.commentSubscription.count();
    expect(count).toBe(1);
  });
});

describe("notifyReplySubscribers", () => {
  beforeEach(() => {
    confirmMock.mockClear();
    notifyMock.mockClear();
  });

  async function subscribeAndConfirm(commentId: string, email: string) {
    await prisma.commentSubscription.create({
      data: {
        commentId,
        email,
        unsubToken: `unsub-${email}`,
        confirmedAt: new Date(),
      },
    });
  }

  it("does NOT email an unconfirmed subscriber when a reply lands", async () => {
    const { doc, comment } = await createDocWithTopComment();
    await createReplySubscription({ doc, targetCommentId: comment.id, email: "sub@example.com" });

    await notifyReplySubscribers({ reply: { parentId: comment.id }, doc });

    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("emails a confirmed subscriber on reply, with an unsubscribe link", async () => {
    const { doc, comment } = await createDocWithTopComment();
    await subscribeAndConfirm(comment.id, "sub@example.com");

    await notifyReplySubscribers({ reply: { parentId: comment.id }, doc });

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith(
      "sub@example.com",
      expect.objectContaining({
        docTitle: "Sub Doc",
        unsubUrl: expect.stringContaining("unsub-sub@example.com"),
      })
    );
  });

  it("excludes the address that posted the reply", async () => {
    const { doc, comment } = await createDocWithTopComment();
    await subscribeAndConfirm(comment.id, "sub@example.com");

    await notifyReplySubscribers({
      reply: { parentId: comment.id },
      doc,
      excludeEmail: "SUB@example.com",
    });

    expect(notifyMock).not.toHaveBeenCalled();
  });

  it("debounces repeated replies to the same comment", async () => {
    const { doc, comment } = await createDocWithTopComment();
    await subscribeAndConfirm(comment.id, "sub@example.com");

    await notifyReplySubscribers({ reply: { parentId: comment.id }, doc });
    await notifyReplySubscribers({ reply: { parentId: comment.id }, doc });

    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it("is a no-op for a non-reply (no parentId)", async () => {
    const { doc } = await createDocWithTopComment();
    await notifyReplySubscribers({ reply: { parentId: null }, doc });
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
