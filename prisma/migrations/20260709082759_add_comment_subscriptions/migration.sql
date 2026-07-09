-- CreateTable
CREATE TABLE "comment_subscriptions" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "confirm_token" TEXT,
    "unsub_token" TEXT NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "last_notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comment_subscriptions_confirm_token_key" ON "comment_subscriptions"("confirm_token");

-- CreateIndex
CREATE UNIQUE INDEX "comment_subscriptions_unsub_token_key" ON "comment_subscriptions"("unsub_token");

-- CreateIndex
CREATE INDEX "comment_subscriptions_comment_id_idx" ON "comment_subscriptions"("comment_id");

-- AddForeignKey
ALTER TABLE "comment_subscriptions" ADD CONSTRAINT "comment_subscriptions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
