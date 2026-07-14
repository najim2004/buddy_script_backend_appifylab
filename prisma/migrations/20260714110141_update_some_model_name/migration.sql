/*
  Warnings:

  - You are about to drop the `community_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_posts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_VisibilityAllowedFriends" DROP CONSTRAINT "_VisibilityAllowedFriends_A_fkey";

-- DropForeignKey
ALTER TABLE "attachments" DROP CONSTRAINT "attachments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "community_comments" DROP CONSTRAINT "community_comments_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "community_comments" DROP CONSTRAINT "community_comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "community_comments" DROP CONSTRAINT "community_comments_reply_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "community_comments" DROP CONSTRAINT "community_comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "community_likes" DROP CONSTRAINT "community_likes_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "community_likes" DROP CONSTRAINT "community_likes_post_id_fkey";

-- DropForeignKey
ALTER TABLE "community_likes" DROP CONSTRAINT "community_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "community_posts" DROP CONSTRAINT "community_posts_author_id_fkey";

-- DropTable
DROP TABLE "community_comments";

-- DropTable
DROP TABLE "community_likes";

-- DropTable
DROP TABLE "community_posts";

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "PostStatus" NOT NULL DEFAULT 'ACTIVE',
    "post_type" "PostType" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "reply_to_user_id" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "likes_user_post_idx" ON "likes"("user_id", "post_id");

-- CreateIndex
CREATE INDEX "comment_user_post_deleted_at_idx" ON "comments"("user_id", "post_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_reply_to_user_id_fkey" FOREIGN KEY ("reply_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VisibilityAllowedFriends" ADD CONSTRAINT "_VisibilityAllowedFriends_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
