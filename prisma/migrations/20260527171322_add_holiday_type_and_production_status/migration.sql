-- AlterTable
ALTER TABLE `Product` ADD COLUMN `holidayType` ENUM('NEWS', 'BOND') NULL;

-- AlterTable
-- Existing rows are treated as already printed (their stock has already been added),
-- so we default to PRINTED and stamp printedAt to createdAt for the backfill.
ALTER TABLE `Production`
    ADD COLUMN `status` ENUM('EXPECTED', 'PRINTED') NOT NULL DEFAULT 'PRINTED',
    ADD COLUMN `printedAt` DATETIME(3) NULL;

UPDATE `Production` SET `printedAt` = `createdAt` WHERE `printedAt` IS NULL;
