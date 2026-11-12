CREATE TABLE "testes_whatsapp" (
	"chave" text PRIMARY KEY NOT NULL,
	"loja_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "testes_whatsapp" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "testes_whatsapp" ADD CONSTRAINT "testes_whatsapp_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Lojas que já existem contam como teste usado; com número repetido, fica com a loja mais antiga.
INSERT INTO "testes_whatsapp" ("chave", "loja_id", "created_at")
SELECT DISTINCT ON (chave) chave, id, created_at
FROM (
	SELECT left(d, 2) || right(d, 8) AS chave, id, created_at
	FROM (SELECT regexp_replace(whatsapp, '\D', '', 'g') AS d, id, created_at FROM "lojas" WHERE whatsapp IS NOT NULL) l
	WHERE length(d) IN (10, 11)
) c
ORDER BY chave, created_at
ON CONFLICT DO NOTHING;
