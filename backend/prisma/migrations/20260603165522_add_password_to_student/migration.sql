/*
  Warnings:

  - Added the required column `password` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "degreeStatus" DROP NOT NULL,
ALTER COLUMN "degree" DROP NOT NULL,
ALTER COLUMN "specialization" DROP NOT NULL;
