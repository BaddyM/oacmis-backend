-- Wipe transactional + CMS data, keep: User, PasswordResetToken, LoginAccess, Branch, Settings.
-- FK checks disabled so order doesn't matter; re-enabled at the end.
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `AuditLog`;
TRUNCATE TABLE `PeriodLock`;
TRUNCATE TABLE `CommissionPayout`;
TRUNCATE TABLE `Customer`;
TRUNCATE TABLE `DailyReport`;
TRUNCATE TABLE `Product`;
TRUNCATE TABLE `Production`;
TRUNCATE TABLE `BranchStock`;
TRUNCATE TABLE `StockTransfer`;
TRUNCATE TABLE `BranchPayable`;
TRUNCATE TABLE `BranchDeposit`;
TRUNCATE TABLE `StockTakeItem`;
TRUNCATE TABLE `StockTakeItemHistory`;
TRUNCATE TABLE `Sale`;
TRUNCATE TABLE `SaleReturn`;
TRUNCATE TABLE `CreditSale`;
TRUNCATE TABLE `CreditPayment`;
TRUNCATE TABLE `Receipt`;
TRUNCATE TABLE `Expense`;
TRUNCATE TABLE `Notification`;
TRUNCATE TABLE `Staff`;
TRUNCATE TABLE `SalaryAdvance`;
TRUNCATE TABLE `Salary`;
TRUNCATE TABLE `Supplier`;
TRUNCATE TABLE `SupplierProduct`;
TRUNCATE TABLE `PurchaseOrder`;
TRUNCATE TABLE `PurchaseOrderPayment`;
TRUNCATE TABLE `Invoice`;
TRUNCATE TABLE `InvoiceItem`;
TRUNCATE TABLE `InvoicePayment`;
TRUNCATE TABLE `CustomerInvoice`;
TRUNCATE TABLE `BlogPost`;
TRUNCATE TABLE `Testimonial`;
TRUNCATE TABLE `Faq`;
TRUNCATE TABLE `CompanyValue`;
TRUNCATE TABLE `CompanyStat`;
TRUNCATE TABLE `OtherService`;
TRUNCATE TABLE `FeaturedPick`;
TRUNCATE TABLE `HowItWorksVideo`;
TRUNCATE TABLE `SiteSetting`;
TRUNCATE TABLE `WebsiteInquiry`;

SET FOREIGN_KEY_CHECKS = 1;
