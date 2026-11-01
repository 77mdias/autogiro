CREATE TYPE "public"."carro_status" AS ENUM('disponivel', 'vendido');--> statement-breakpoint
CREATE TYPE "public"."plano_status" AS ENUM('trial', 'ativo', 'inadimplente', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."simulacao_status" AS ENUM('novo', 'em_contato', 'aprovado', 'recusado');--> statement-breakpoint
CREATE TABLE "carros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"marca" text NOT NULL,
	"modelo" text NOT NULL,
	"versao" text,
	"ano" integer NOT NULL,
	"km" integer NOT NULL,
	"preco_centavos" integer NOT NULL,
	"cor" text,
	"cambio" text,
	"combustivel" text,
	"descricao" text,
	"fotos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "carro_status" DEFAULT 'disponivel' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carros" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lojas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"whatsapp" text,
	"cidade" text,
	"appmax_customer_id" text,
	"plano_status" "plano_status" DEFAULT 'trial' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lojas_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "lojas_slug_unique" UNIQUE("slug"),
	CONSTRAINT "lojas_appmax_customer_id_unique" UNIQUE("appmax_customer_id")
);
--> statement-breakpoint
ALTER TABLE "lojas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "simulacoes_financiamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"carro_id" uuid,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"valor_entrada_centavos" integer DEFAULT 0 NOT NULL,
	"valor_financiar_centavos" integer NOT NULL,
	"parcelas" integer NOT NULL,
	"consentimento_lgpd_em" timestamp with time zone NOT NULL,
	"cnh_key" text,
	"cnh_uploaded_at" timestamp with time zone,
	"status" "simulacao_status" DEFAULT 'novo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "simulacoes_financiamento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"event_key" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "carros" ADD CONSTRAINT "carros_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulacoes_financiamento" ADD CONSTRAINT "simulacoes_financiamento_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulacoes_financiamento" ADD CONSTRAINT "simulacoes_financiamento_carro_id_carros_id_fk" FOREIGN KEY ("carro_id") REFERENCES "public"."carros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "carros_loja_id_idx" ON "carros" USING btree ("loja_id","status");--> statement-breakpoint
CREATE INDEX "simulacoes_loja_id_idx" ON "simulacoes_financiamento" USING btree ("loja_id","created_at");--> statement-breakpoint
CREATE INDEX "simulacoes_cnh_uploaded_at_idx" ON "simulacoes_financiamento" USING btree ("cnh_uploaded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_key_uq" ON "webhook_events" USING btree ("provider","event_key");