CREATE TYPE "public"."pedido_status" AS ENUM('pendente', 'aprovado', 'recusado');--> statement-breakpoint
CREATE TYPE "public"."pedido_tipo" AS ENUM('editar', 'excluir');--> statement-breakpoint
CREATE TABLE "pedidos_edicao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"carro_id" uuid,
	"membro_id" uuid NOT NULL,
	"tipo" "pedido_tipo" NOT NULL,
	"mudancas" jsonb,
	"status" "pedido_status" DEFAULT 'pendente' NOT NULL,
	"decidido_por" uuid,
	"decidido_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pedidos_edicao" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pedidos_edicao" ADD CONSTRAINT "pedidos_edicao_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_edicao" ADD CONSTRAINT "pedidos_edicao_carro_id_carros_id_fk" FOREIGN KEY ("carro_id") REFERENCES "public"."carros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_edicao" ADD CONSTRAINT "pedidos_edicao_membro_id_membros_id_fk" FOREIGN KEY ("membro_id") REFERENCES "public"."membros"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_edicao" ADD CONSTRAINT "pedidos_edicao_decidido_por_membros_id_fk" FOREIGN KEY ("decidido_por") REFERENCES "public"."membros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pedidos_loja_status_idx" ON "pedidos_edicao" USING btree ("loja_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pedidos_um_pendente_por_carro_uq" ON "pedidos_edicao" USING btree ("carro_id") WHERE "pedidos_edicao"."status" = 'pendente';