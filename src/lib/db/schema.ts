import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { MudancasCarro } from "../pedidos";

// Todas as tabelas com .enableRLS() sem policies: bloqueia o acesso via API REST do
// Supabase (anon/authenticated). O app acessa só pelo Drizzle com a role do servidor.

export const planoStatus = pgEnum("plano_status", ["trial", "ativo", "inadimplente", "cancelado"]);
export const carroStatus = pgEnum("carro_status", ["disponivel", "vendido"]);
export const papelMembro = pgEnum("papel_membro", ["gestor", "vendedor"]);
export const pedidoTipo = pgEnum("pedido_tipo", ["editar", "excluir"]);
export const pedidoStatus = pgEnum("pedido_status", ["pendente", "aprovado", "recusado"]);
export const simulacaoStatus = pgEnum("simulacao_status", ["novo", "em_contato", "aprovado", "recusado"]);

export const lojas = pgTable("lojas", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: text("auth_user_id").notNull().unique(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  whatsapp: text("whatsapp"),
  cidade: text("cidade"),
  asaasCustomerId: text("asaas_customer_id").unique(),
  asaasCheckoutId: text("asaas_checkout_id"),
  asaasSubscriptionId: text("asaas_subscription_id").unique(),
  planoStatus: planoStatus("plano_status").notNull().default("trial"),
  // 7 dias de teste grátis (TRIAL_DIAS em lib/plano.ts) contados da criação da loja
  trialAte: timestamp("trial_ate", { withTimezone: true }).notNull().default(sql`now() + interval '7 days'`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// Quem entra no painel de cada loja. O dono (lojas.auth_user_id) é o gestor; vendedores entram por convite.
// auth_user_id único: uma conta pertence a uma loja só. Desativar tira o acesso na hora (lib/auth consulta a cada request).
export const membros = pgTable(
  "membros",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lojaId: uuid("loja_id").notNull().references(() => lojas.id, { onDelete: "cascade" }),
    authUserId: text("auth_user_id").notNull().unique(),
    papel: papelMembro("papel").notNull(),
    nome: text("nome"),
    ativo: boolean("ativo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("membros_loja_id_idx").on(t.lojaId)],
).enableRLS();

export const carros = pgTable(
  "carros",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lojaId: uuid("loja_id").notNull().references(() => lojas.id, { onDelete: "cascade" }),
    marca: text("marca").notNull(),
    modelo: text("modelo").notNull(),
    versao: text("versao"),
    ano: integer("ano").notNull(),
    km: integer("km").notNull(),
    precoCentavos: integer("preco_centavos").notNull(),
    cor: text("cor"),
    cambio: text("cambio"),
    combustivel: text("combustivel"),
    descricao: text("descricao"),
    // Chaves de objeto no bucket público do R2
    fotos: jsonb("fotos").$type<string[]>().notNull().default([]),
    status: carroStatus("status").notNull().default("disponivel"),
    // Quem cadastrou; as simulações deste carro vão para ele (docs/produto/telas-equipe.md)
    cadastradoPor: uuid("cadastrado_por").references(() => membros.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("carros_loja_id_idx").on(t.lojaId, t.status)],
).enableRLS();

export const simulacoesFinanciamento = pgTable(
  "simulacoes_financiamento",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lojaId: uuid("loja_id").notNull().references(() => lojas.id, { onDelete: "cascade" }),
    carroId: uuid("carro_id").references(() => carros.id, { onDelete: "set null" }),
    nome: text("nome").notNull(),
    telefone: text("telefone").notNull(),
    valorEntradaCentavos: integer("valor_entrada_centavos").notNull().default(0),
    valorFinanciarCentavos: integer("valor_financiar_centavos").notNull(),
    parcelas: integer("parcelas").notNull(),
    // Momento do aceite LGPD para tratamento de dados sensíveis (CNH)
    consentimentoLgpdEm: timestamp("consentimento_lgpd_em", { withTimezone: true }).notNull(),
    // Chave do objeto no bucket PRIVADO do R2; nunca exposta publicamente
    cnhKey: text("cnh_key"),
    cnhUploadedAt: timestamp("cnh_uploaded_at", { withTimezone: true }),
    status: simulacaoStatus("status").notNull().default("novo"),
    // Dono do lead: quem cadastrou o carro, ou o gestor (que pode distribuir os dele)
    responsavelId: uuid("responsavel_id").references(() => membros.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("simulacoes_loja_id_idx").on(t.lojaId, t.createdAt),
    index("simulacoes_responsavel_idx").on(t.responsavelId, t.status),
    index("simulacoes_cnh_uploaded_at_idx").on(t.cnhUploadedAt),
  ],
).enableRLS();

// Edição ou exclusão de carro pedida por vendedor; só muda o carro quando o gestor aprova.
// Um pedido pendente por carro. As fotos novas já estão no R2 e só entram no carro na aprovação.
export const pedidosEdicao = pgTable(
  "pedidos_edicao",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lojaId: uuid("loja_id").notNull().references(() => lojas.id, { onDelete: "cascade" }),
    carroId: uuid("carro_id").references(() => carros.id, { onDelete: "set null" }),
    membroId: uuid("membro_id").notNull().references(() => membros.id, { onDelete: "cascade" }),
    tipo: pedidoTipo("tipo").notNull(),
    mudancas: jsonb("mudancas").$type<MudancasCarro>(),
    status: pedidoStatus("status").notNull().default("pendente"),
    decididoPor: uuid("decidido_por").references(() => membros.id, { onDelete: "set null" }),
    decididoEm: timestamp("decidido_em", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pedidos_loja_status_idx").on(t.lojaId, t.status, t.createdAt),
    uniqueIndex("pedidos_um_pendente_por_carro_uq").on(t.carroId).where(sql`${t.status} = 'pendente'`),
  ],
).enableRLS();

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    eventKey: text("event_key").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("webhook_events_provider_key_uq").on(t.provider, t.eventKey)],
).enableRLS();

// Contas de e-mail e senha. O id vira o `sub` do Auth.js e, como no Google, liga a loja por lojas.auth_user_id.
export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(), // sempre minúsculo
  senhaHash: text("senha_hash").notNull(),
  emailConfirmadoEm: timestamp("email_confirmado_em", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const tokenEmailTipo = pgEnum("token_email_tipo", ["confirmar", "redefinir"]);

// Guarda só o sha256 do token; o token em si vai apenas no link do e-mail.
export const tokensEmail = pgTable(
  "tokens_email",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
    tipo: tokenEmailTipo("tipo").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tokens_email_usuario_idx").on(t.usuarioId, t.tipo)],
).enableRLS();
