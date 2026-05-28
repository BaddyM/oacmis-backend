-- AlterTable
ALTER TABLE `Production` ADD COLUMN `printedQuantity` INT NULL;

-- Backfill: historical printed rows have already entered stock based on `quantity`,
-- so seed printedQuantity from it for any row already marked PRINTED.
UPDATE `Production` SET `printedQuantity` = `quantity` WHERE `status` = 'PRINTED' AND `printedQuantity` IS NULL;
