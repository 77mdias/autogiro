ALTER TABLE "carros" ADD COLUMN "cadastrado_por" uuid;--> statement-breakpoint
ALTER TABLE "simulacoes_financiamento" ADD COLUMN "responsavel_id" uuid;--> statement-breakpoint
ALTER TABLE "carros" ADD CONSTRAINT "carros_cadastrado_por_membros_id_fk" FOREIGN KEY ("cadastrado_por") REFERENCES "public"."membros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulacoes_financiamento" ADD CONSTRAINT "simulacoes_financiamento_responsavel_id_membros_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."membros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "simulacoes_responsavel_idx" ON "simulacoes_financiamento" USING btree ("responsavel_id","status");--> statement-breakpoint
-- Tudo que já existe fica com o gestor da loja.
UPDATE "carros" SET "cadastrado_por" = (SELECT "id" FROM "membros" m WHERE m."loja_id" = "carros"."loja_id" AND m."papel" = 'gestor' ORDER BY m."created_at" LIMIT 1) WHERE "cadastrado_por" IS NULL;--> statement-breakpoint
UPDATE "simulacoes_financiamento" SET "responsavel_id" = (SELECT "id" FROM "membros" m WHERE m."loja_id" = "simulacoes_financiamento"."loja_id" AND m."papel" = 'gestor' ORDER BY m."created_at" LIMIT 1) WHERE "responsavel_id" IS NULL;
