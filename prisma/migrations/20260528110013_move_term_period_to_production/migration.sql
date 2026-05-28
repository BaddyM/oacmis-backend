-- AlterTable: Product no longer holds term/period
ALTER TABLE `Product`
    DROP COLUMN `examTerm`,
    DROP COLUMN `examPeriod`;

-- AlterTable: Production now captures term + period per batch (applies to all categories)
ALTER TABLE `Production`
    ADD COLUMN `term` ENUM('TERM_1', 'TERM_2', 'TERM_3') NULL,
    ADD COLUMN `period` ENUM('BEGINNING', 'MID', 'END') NULL;
