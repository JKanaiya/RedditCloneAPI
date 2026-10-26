-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "subRedditId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subRedditId" INTEGER;

-- CreateTable
CREATE TABLE "SubReddit" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "SubReddit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_subreddits" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_subreddits_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_subreddits_B_index" ON "_subreddits"("B");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_subRedditId_fkey" FOREIGN KEY ("subRedditId") REFERENCES "SubReddit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_subreddits" ADD CONSTRAINT "_subreddits_A_fkey" FOREIGN KEY ("A") REFERENCES "SubReddit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_subreddits" ADD CONSTRAINT "_subreddits_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
