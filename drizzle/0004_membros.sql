CREATE TYPE "public"."papel_membro" AS ENUM('gestor', 'vendedor');--> statement-breakpoint
CREATE TABLE "membros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"auth_user_id" text NOT NULL,
	"papel" "papel_membro" NOT NULL,
	"nome" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membros_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
ALTER TABLE "membros" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "membros" ADD CONSTRAINT "membros_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "membros_loja_id_idx" ON "membros" USING btree ("loja_id");--> statement-breakpoint
-- O dono de cada loja existente vira o gestor dela.
INSERT INTO "membros" ("loja_id", "auth_user_id", "papel") SELECT "id", "auth_user_id", 'gestor' FROM "lojas" ON CONFLICT ("auth_user_id") DO NOTHING;
