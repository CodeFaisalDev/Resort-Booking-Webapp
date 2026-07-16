/*
  Warnings:

  - Added the required column `resort_id` to the `room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "room" ADD COLUMN     "resort_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "resort" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,

    CONSTRAINT "resort_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_resort_id_fkey" FOREIGN KEY ("resort_id") REFERENCES "resort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
