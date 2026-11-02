ALTER TABLE "lojas" ADD COLUMN "asaas_checkout_id" text;--> statement-breakpoint
ALTER TABLE "lojas" ADD COLUMN "asaas_subscription_id" text;--> statement-breakpoint
ALTER TABLE "lojas" ADD COLUMN "trial_ate" timestamp with time zone DEFAULT now() + interval '7 days' NOT NULL;--> statement-breakpoint
ALTER TABLE "lojas" ADD CONSTRAINT "lojas_asaas_subscription_id_unique" UNIQUE("asaas_subscription_id");