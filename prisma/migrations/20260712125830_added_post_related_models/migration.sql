/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `file` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `file_alt` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `attachments` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `attachments` table. All the data in the column will be lost.
  - The `type` column on the `attachments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ucodes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `file_path` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'AUDIO', 'FILE');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'FRIENDS');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'FLAGGED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('NORMAL', 'EVENT', 'ARTICLE');

-- DropForeignKey
ALTER TABLE "ucodes" DROP CONSTRAINT "ucodes_user_id_fkey";

-- AlterTable
ALTER TABLE "attachments" DROP COLUMN "deleted_at",
DROP COLUMN "file",
DROP COLUMN "file_alt",
DROP COLUMN "name",
DROP COLUMN "size",
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_path" TEXT NOT NULL,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "post_id" TEXT,
ADD COLUMN     "size_bytes" BIGINT,
ALTER COLUMN "updated_at" DROP DEFAULT,
DROP COLUMN "type",
ADD COLUMN     "type" "AttachmentType";

-- DropTable
DROP TABLE "ucodes";

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "PostStatus" NOT NULL DEFAULT 'ACTIVE',
    "post_type" "PostType" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_likes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,

    CONSTRAINT "community_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "reply_to_user_id" TEXT,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VisibilityAllowedFriends" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_VisibilityAllowedFriends_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "community_posts_author_id_idx" ON "community_posts"("author_id");

-- CreateIndex
CREATE INDEX "community_likes_user_post_idx" ON "community_likes"("user_id", "post_id");

-- CreateIndex
CREATE INDEX "comment_user_post_deleted_at_idx" ON "community_comments"("user_id", "post_id", "deleted_at");

-- CreateIndex
CREATE INDEX "_VisibilityAllowedFriends_B_index" ON "_VisibilityAllowedFriends"("B");

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "community_comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_reply_to_user_id_fkey" FOREIGN KEY ("reply_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VisibilityAllowedFriends" ADD CONSTRAINT "_VisibilityAllowedFriends_A_fkey" FOREIGN KEY ("A") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VisibilityAllowedFriends" ADD CONSTRAINT "_VisibilityAllowedFriends_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
