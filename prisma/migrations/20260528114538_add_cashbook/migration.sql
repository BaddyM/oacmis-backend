-- CreateTable
CREATE TABLE `CashAccount` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('CASH', 'BANK', 'MOBILE_MONEY', 'TILL') NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'UGX',
    `openingBalance` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CashAccount_branchId_idx`(`branchId`),
    INDEX `CashAccount_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LedgerEntry` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `source` ENUM(
        'SALE',
        'SALE_RETURN',
        'CREDIT_PAYMENT',
        'INVOICE_PAYMENT',
        'EXPENSE',
        'PURCHASE_PAYMENT',
        'SALARY_PAYMENT',
        'SALARY_ADVANCE',
        'COMMISSION_PAYOUT',
        'BRANCH_DEPOSIT',
        'TRANSFER',
        'ADJUSTMENT',
        'OPENING_BALANCE'
    ) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `counterpartyAccountId` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `branchId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `reconciledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LedgerEntry_accountId_occurredAt_idx`(`accountId`, `occurredAt`),
    INDEX `LedgerEntry_source_referenceId_idx`(`source`, `referenceId`),
    INDEX `LedgerEntry_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CashAccount` ADD CONSTRAINT `CashAccount_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LedgerEntry` ADD CONSTRAINT `LedgerEntry_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `CashAccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
