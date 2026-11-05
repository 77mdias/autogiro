# Plano: telas da equipe

Leva o painel de "uma loja, um dono" para "uma loja, um gestor e vendedores" (menu com Clientes da equipe, Vendas e comissões, Vendedores). Decisões do produto em 2026-11-05.

## Regras decididas

**Carros**
- O vendedor **cadastra** carro. Qualquer **edição** dele (dados, fotos, marcar vendido, excluir) vira um **pedido de aprovação**: o gestor recebe a notificação e aprova ou recusa; só então o carro muda.
- O gestor edita direto.

**Leads (clientes)**
- O lead é de **quem cadastrou o carro**. Simulação num carro do vendedor entra na carteira dele, como cliente particular, e ele faz a gestão.
- Carro cadastrado pelo gestor: o lead fica com o gestor, que pode **distribuir** para um vendedor.
- O gestor **vê** os clientes particulares dos vendedores, só leitura (não redistribui).
- O vendedor vê só a própria carteira.

**Vendas e comissões**
- Ao marcar vendido, o vendedor informa **só o valor da venda**.
- A comissão **não aparece para o vendedor**. O gestor vê e edita a comissão **em R$**; o sistema mostra a **% sobre a venda**.

**Preço** (o gestor não conta como vendedor)

| Vendedores ativos | Mensalidade |
|---|---|
| 0 (individual, um vendedor sozinho) | R$ 39 |
| 1 a 4 | R$ 99 |
| 5 a 10 | R$ 139 |
| 11 a 20 | R$ 169 |
| mais de 20 | não deixa convidar; fala com a AutoGiro |

- Teste grátis de **15 dias** (era 7).
- Lojas que hoje pagam R$ 149 passam para a faixa delas na próxima cobrança, com aviso antes.
- Mudou de faixa (convidou ou desativou vendedor): o valor da assinatura no Asaas muda a partir da próxima cobrança.

## Passos (um PR cada, com `estado.md` e `arquitetura.md` no mesmo PR)

1. **Feito.** Tabela `membros` (`gestor | vendedor`), o dono atual vira gestor na migração `0004_membros`, papel na sessão, só o gestor edita/exclui carro, altera a loja e assina.
2. **Feito.** **Dono do carro e do lead.** `carros.cadastrado_por` e `simulacoes_financiamento.responsavel_id` (membro); a simulação herda o dono do carro; Interessados filtra pela carteira do vendedor; gestor distribui os leads dele. Migração: tudo que existe fica com o gestor.
3. **Aprovação de edição.** Tabela `pedidos_edicao (loja_id, carro_id, membro_id, mudancas jsonb, status pendente|aprovado|recusado)`; tela de pedidos do gestor e contador no menu (o "1" de Clientes da equipe na referência). Fotos novas sobem para o R2 só na aprovação ou ficam marcadas como pendentes.
4. **Vendedores + convite.** Tela `/painel/vendedores`: convidar por link (token com sha256, como `tokens_email`), nome, desativar. Limite de 20. Ao desativar, os leads e carros do vendedor voltam para o gestor (senão ninguém pode agir sobre eles). Só entra depois dos passos 2 e 3, para nenhum vendedor ter mais acesso que o combinado.
5. **Vendas e comissões.** Tabela `vendas (loja_id, carro_id, membro_id, valor_centavos, comissao_centavos, vendida_em)`; marcar vendido pede o valor; `/painel/vendas` do gestor com comissão em R$ editável e a %; vendedor vê só as vendas dele, sem comissão.
6. **Preço por faixa.** `valorPlano(vendedores)` em `src/lib/plano.ts` com testes; `TRIAL_DIAS = 15`; checkout e venda assistida com o valor da faixa; atualizar a assinatura no Asaas ao mudar de faixa; MRR do administrador pela faixa de cada loja; landing e `pagamentos-asaas.md` com a tabela nova; aviso às lojas atuais.

## Telas

| Tela | Rota | Gestor | Vendedor |
|---|---|---|---|
| Estoque | `/painel/estoque` | tudo | cadastra; edição vira pedido |
| Clientes da equipe | `/painel/interessados` (renomear) | os dele (distribui) e os dos vendedores (só lê) | só os dele |
| Pedidos de edição | `/painel/pedidos` | aprova ou recusa | acompanha os dele |
| Vendedores | `/painel/vendedores` | convida, desativa | — |
| Vendas e comissões | `/painel/vendas` | vendas e comissões | vendas dele, sem comissão |
| Minha loja | `/painel/loja` | dados e assinatura | só vê a situação e o link |
