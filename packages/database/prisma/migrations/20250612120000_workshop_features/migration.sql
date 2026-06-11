-- AlterTable: jobs, products, stock, debts, expenses, incomes

CREATE TYPE "JobServiceType" AS ENUM ('transmission', 'normal_service');
CREATE TYPE "ProductCategory" AS ENUM ('transmission', 'service_part');
CREATE TYPE "DebtStatusOverride" AS ENUM ('open', 'partial', 'paid', 'overdue');

ALTER TABLE "jobs" ADD COLUMN "service_type" "JobServiceType" NOT NULL DEFAULT 'normal_service';
ALTER TABLE "jobs" ADD COLUMN "plate_number" TEXT;

ALTER TABLE "products" ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'service_part';

ALTER TABLE "stock_transactions" ADD COLUMN "job_id" TEXT;
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "debts" ADD COLUMN "status_override" "DebtStatusOverride";

ALTER TABLE "expenses" ADD COLUMN "invoice_file_name" TEXT;
ALTER TABLE "incomes" ADD COLUMN "invoice_file_name" TEXT;
