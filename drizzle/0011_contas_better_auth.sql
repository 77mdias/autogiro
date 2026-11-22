CREATE TABLE "logins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "logins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessoes_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "sessoes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "verificacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verificacoes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "senha_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "nome" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "email_verificado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "imagem" text;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "logins" ADD CONSTRAINT "logins_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "logins_user_id_idx" ON "logins" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "logins_provider_account_uq" ON "logins" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "sessoes_user_id_idx" ON "sessoes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verificacoes_identifier_idx" ON "verificacoes" USING btree ("identifier");--> statement-breakpoint
-- Dados (escrito à mão): as contas de e-mail do Auth.js passam para o Better Auth sem trocar de id, então
-- membros.auth_user_id e lojas.auth_user_id continuam valendo. O hash scrypt é o mesmo formato (lib/senha.ts).
-- As contas do Google ainda estão como `sub` em auth_user_id: viram usuário no primeiro login (lib/auth.ts).
UPDATE "usuarios" SET "email_verificado" = "email_confirmado_em" IS NOT NULL, "updated_at" = "created_at";--> statement-breakpoint
INSERT INTO "logins" ("account_id", "provider_id", "user_id", "password", "created_at", "updated_at")
SELECT "id"::text, 'credential', "id", "senha_hash", "created_at", now() FROM "usuarios" WHERE "senha_hash" IS NOT NULL
ON CONFLICT ("provider_id", "account_id") DO NOTHING;
