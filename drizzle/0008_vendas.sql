CREATE TABLE "vendas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"carro_id" uuid,
	"carro" text NOT NULL,
	"membro_id" uuid,
	"valor_centavos" integer NOT NULL,
	"comissao_centavos" integer,
	"vendida_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendas_carro_id_unique" UNIQUE("carro_id")
);
--> statement-breakpoint
ALTER TABLE "vendas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_carro_id_carros_id_fk" FOREIGN KEY ("carro_id") REFERENCES "public"."carros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_membro_id_membros_id_fk" FOREIGN KEY ("membro_id") REFERENCES "public"."membros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendas_loja_vendida_idx" ON "vendas" USING btree ("loja_id","vendida_em");