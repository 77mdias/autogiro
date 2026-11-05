ALTER TABLE "lojas" ALTER COLUMN "trial_ate" SET DEFAULT now() + interval '15 days';--> statement-breakpoint
ALTER TABLE "lojas" ADD COLUMN "mensalidade_centavos" integer;--> statement-breakpoint
-- Assinaturas que já existem foram criadas no plano único de R$ 149.
UPDATE "lojas" SET "mensalidade_centavos" = 14900 WHERE "asaas_subscription_id" IS NOT NULL;
