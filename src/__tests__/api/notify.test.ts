import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateMagicToken, generateApiKey, hashToken } from "@/lib/tokens";

// Mock the email transport so tests never hit the network and we can assert
// exactly who would be emailed.
vi.mock("@/lib/email", () => ({
  sendCommentNotificationEmail: vi.fn().mockResolvedValue(undefined),
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

import { sendCommentNotificationEmail } from "@/lib/email";
import { notifyOwnerOfComment } from "@/lib/notify";

const sendMock = vi.mocked(sendCommentNotificationEmail);

async function createOwnedDoc(email = "owner@example.com") {
  const user = await prisma.user.create({ data: { email } });
  const doc = await prisma.doc.create({
    data: {
      slug: generateSlug(),
      title: "Owned Doc",
      content: "# Hi",
      visibility: "public",
      magicToken: hashToken(generateMagicToken()),
      apiKey: hashToken(generateApiKey()),
      userId: user.id,
    },
  });
  return { user, doc };
}

describe("notifyOwnerOfComment", () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it("emails the account owner when a non-owner comments", async () => {
    const { doc } = await createOwnedDoc("owner@example.com");

    await notifyOwnerOfComment(doc, { postedByOwner: false });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      "owner@example.com",
      expect.objectContaining({
        docTitle: "Owned Doc",
        docUrl: expect.stringContaining(`/share/${doc.slug}`),
      })
    );

    const fresh = await prisma.doc.findUnique({ where: { id: doc.id } });
    expect(fresh?.commentNotifiedAt).not.toBeNull();
  });

  it("does not email when the doc has no account owner", async () => {
    const doc = await prisma.doc.create({
      data: {
        slug: generateSlug(),
        title: "Ownerless",
        content: "# Hi",
        visibility: "public",
        magicToken: hashToken(generateMagicToken()),
        apiKey: hashToken(generateApiKey()),
      },
    });

    await notifyOwnerOfComment(doc, { postedByOwner: false });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("does not email the owner about their own comment", async () => {
    const { doc } = await createOwnedDoc();

    await notifyOwnerOfComment(doc, { postedByOwner: true });

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("debounces: a burst of comments produces at most one email per window", async () => {
    const { doc } = await createOwnedDoc();

    await notifyOwnerOfComment(doc, { postedByOwner: false });
    await notifyOwnerOfComment(doc, { postedByOwner: false });
    await notifyOwnerOfComment(doc, { postedByOwner: false });

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("releases the debounce window when the send fails, so the next comment retries", async () => {
    const { doc } = await createOwnedDoc();

    sendMock.mockRejectedValueOnce(new Error("plunk down"));
    await notifyOwnerOfComment(doc, { postedByOwner: false });

    // Failed send must not burn the window: timestamp reverted to null.
    const afterFailure = await prisma.doc.findUnique({ where: { id: doc.id } });
    expect(afterFailure?.commentNotifiedAt).toBeNull();

    // Next comment (send now succeeds) should actually notify.
    await notifyOwnerOfComment(doc, { postedByOwner: false });
    expect(sendMock).toHaveBeenCalledTimes(2);
    const afterSuccess = await prisma.doc.findUnique({ where: { id: doc.id } });
    expect(afterSuccess?.commentNotifiedAt).not.toBeNull();
  });

  it("emails again once the debounce window has elapsed", async () => {
    const { doc } = await createOwnedDoc();

    await notifyOwnerOfComment(doc, { postedByOwner: false });
    expect(sendMock).toHaveBeenCalledTimes(1);

    // Simulate the last notification being older than the debounce window.
    await prisma.doc.update({
      where: { id: doc.id },
      data: { commentNotifiedAt: new Date(Date.now() - 60 * 60 * 1000) },
    });

    await notifyOwnerOfComment(doc, { postedByOwner: false });
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
