CREATE TABLE "convites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loja_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"token_hash" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"criado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "convites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "convites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "convites" ADD CONSTRAINT "convites_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convites" ADD CONSTRAINT "convites_criado_por_membros_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."membros"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "convites_loja_id_idx" ON "convites" USING btree ("loja_id");