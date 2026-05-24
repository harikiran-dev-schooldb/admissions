/*
  Warnings:

  - You are about to drop the column `enquiryNo` on the `FeeRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FeeRecord" DROP CONSTRAINT "FeeRecord_enquiryNo_fkey";

-- AlterTable
ALTER TABLE "FeeRecord" DROP COLUMN "enquiryNo";
