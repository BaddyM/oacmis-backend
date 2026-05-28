-- AlterTable
ALTER TABLE `Product`
    ADD COLUMN `examTerm` ENUM('TERM_1', 'TERM_2', 'TERM_3') NULL,
    ADD COLUMN `examPeriod` ENUM('BEGINNING', 'MID', 'END') NULL;
