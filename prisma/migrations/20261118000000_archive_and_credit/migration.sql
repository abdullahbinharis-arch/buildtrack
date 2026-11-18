-- AlterTable
ALTER TABLE "Project" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MaterialExpense" ADD COLUMN "paid" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MiscellaneousExpense" ADD COLUMN "paid" BOOLEAN NOT NULL DEFAULT true;
