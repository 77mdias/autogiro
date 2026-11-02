ALTER TABLE "lojas" RENAME COLUMN "appmax_customer_id" TO "asaas_customer_id";--> statement-breakpoint
ALTER TABLE "lojas" DROP CONSTRAINT "lojas_appmax_customer_id_unique";--> statement-breakpoint
ALTER TABLE "lojas" ADD CONSTRAINT "lojas_asaas_customer_id_unique" UNIQUE("asaas_customer_id");