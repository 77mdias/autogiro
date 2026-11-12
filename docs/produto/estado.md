# Estado do produto

O que já funciona, onde o app difere da especificação de origem ([PRD](prd.md), [SRS](srs.md), [fluxos](fluxos.md), [briefing](briefing.md)) e o que falta. **Atualize este arquivo a cada entrega.**

Última revisão: 2026-11-06. No ar na Vercel, migrando de `autogiro.77mdevseven.tech` para `https://autogiro.wdias.tech` (passos 6 e 7 de [deploy.md](../deploy.md)).

## Pronto

| Área | O que tem | Onde ver |
|---|---|---|
| Conta | Login com Google ou e-mail e senha; confirmação por e-mail; "Esqueci a senha" | [arquitetura.md › Autenticação](../arquitetura.md#autenticação) |
| Loja | Onboarding (nome + WhatsApp), slug fixo, dados editáveis em Minha loja | `/onboarding`, `/painel/loja` |
| Estoque | Cadastrar, editar, marcar vendido, excluir, até 15 fotos, compartilhar o link do carro e da vitrine | `/painel/estoque` |
| Vitrine | Lista da loja com filtro (disponíveis, vendidos) e busca; vendidos aparecem marcados | `/loja/[slug]` |
| Carro | Galeria, ficha, WhatsApp com mensagem pronta e link do carro, Simular | `/loja/[slug]/carros/[id]` |
| Simulação | Nome, WhatsApp, entrada, valor a financiar, 24 a 60x, CNH opcional (foto ou PDF), aceite LGPD obrigatório | `/simular`, `POST /api/simulacoes` |
| Navegação | Barra lateral no desktop; no celular, gaveta com botões de menu e cadastrar carro embaixo | [decisoes.md](../decisoes.md) |
| Interessados | Lista das simulações, Ver CNH (link assinado de 5 min), chamar no WhatsApp, descartar | `/painel/interessados` |
| Plano | Mensalidade por vendedores ativos (R$ 59, 99, 139 ou 169), 15 dias grátis sem cartão; assinatura muda de valor ao mudar de faixa; venda assistida (fase 1) e checkout de cartão (fase 2); bloqueio por atraso via webhook | [pagamentos-asaas.md](../pagamentos-asaas.md) |
| Administrador | MRR, lojas por situação do plano, carros e simulações por loja | `/admin` ([arquitetura.md](../arquitetura.md#rotas)) |
| LGPD | CNH em bucket privado, link de 5 min só para a loja, cron apaga após 90 dias | [arquitetura.md › Arquivos](../arquitetura.md#arquivos-cloudflare-r2) |
| Plataforma | PWA, multi-tenant por `loja_id`, segredos no Criptenv, dev em Docker com hot reload, CI nos PRs, deploy na Vercel com migração automática | [deploy.md](../deploy.md) |
| Landing | Página simples para o garagista: como funciona, funções, vantagens, preço e perguntas | [decisoes.md](../decisoes.md) |

## Diferente da especificação (de propósito)

| Especificado | Como está | Por quê |
|---|---|---|
| SRS REQ-005: criar cliente e assinatura no Asaas ao fim do onboarding | A loja entra no teste grátis sem cartão; a assinatura nasce no checkout (fase 2) ou na venda assistida (fase 1) | Sem CPF/CNPJ no cadastro e teste sem cartão ([decisões](../decisoes.md)) |
| SRS REQ-008: eventos `PAYMENT_*` mudam o status | Só cobranças de **assinatura** mudam o plano; a loja liga pelo `checkoutSession` | Cobrança avulsa não pode ligar nem desligar loja ([pagamentos-asaas.md](../pagamentos-asaas.md)) |
| SRS REQ-006: rota `/api/v1/webhooks/asaas` | `/api/webhooks/asaas` | Só o nome; o token no header está implementado |
| SRS REQ-004: fotos convertidas para WebP | Reduzidas no navegador para JPEG, lado maior 1600 px | JPEG sai em qualquer navegador; WebP fica como melhoria |
| Rota pública `/carro/[id]` | `/loja/[slug]/carros/[id]` | O link carrega a loja (vitrine fora do ar quando o plano pausa) |
| Modelo `PedidosSimulacao`, status `teste/ativa/...` | `simulacoes_financiamento`, `plano_status` = `trial/ativo/inadimplente/cancelado` | Só nomes |
| PRD: vitrine com filtros **ou** ordenação por preço/ano | Filtro por situação e busca; sem ordenação | Atende ao "ou"; ordenação fica para quando houver pedido |

## Falta

**Antes de divulgar em escala**
- [ ] **Política de privacidade** publicada no site (o [briefing](briefing.md) pede; não existe página).
- [ ] **Prazo de guarda da CNH** definido com o jurídico. Hoje: só o arquivo é apagado, em 90 dias; o lead fica. O SRS (REQ-010) fala em apagar CNH **e** lead (ex.: 30 dias).
- [ ] **Limite de envios** (rate limit ou captcha, ex.: Cloudflare Turnstile) no `POST /api/simulacoes`, que é público.
- [ ] **Cron de produção**: Worker apontando para o domínio de produção com o `CRON_SECRET` de `production` ([deploy.md › Cron](../deploy.md#cron-limpeza-das-cnhs)).

**Validar em produção**
- [ ] Fluxo completo no ar: cadastro, onboarding, foto no R2 de produção, simulação com CNH, Ver CNH.
- [x] Webhook do Asaas de produção respondendo 200 (cobrança avulsa de teste, 2026-11-09).
- [ ] Autoatendimento com cartão em produção (`ASAAS_CHECKOUT=on`; tokenização já liberada em 2026-11-12) e primeira cobrança real.

**Próximas telas** ([plano](telas-equipe.md))
- [x] Passo 1: tabela `membros`, papel gestor/vendedor na sessão, travas de gestor nas actions.
- [x] Passo 2: carro e lead com dono; carteira do vendedor; gestor distribui os dele.
- [x] Passo 3: edição e exclusão do vendedor viram pedido; gestor aprova ou recusa em Pedidos.
- [x] Passo 4: tela Vendedores, convite por link, desativar devolve carros e clientes ao gestor, limite de 20.
- [x] Passo 5: venda ao marcar vendido (valor; gestor escolhe quem vendeu), Vendas e comissões por mês, comissão só para o gestor.
- [x] Passo 6: preço por faixa e 15 dias grátis.
- Carros marcados como vendidos antes do passo 5 não têm venda registrada (não havia valor nem vendedor para preencher).

**Melhorias conhecidas**
- [ ] `favicon.ico` responde 404 (o ícone do app existe em `src/app/icon.png`).
- [ ] Fotos em WebP (REQ-004).
- [ ] Testes de ponta a ponta automatizados (hoje a validação no navegador é manual, com a conta de teste).
- [ ] Domínio próprio `.com` (hoje subdomínio `autogiro.wdias.tech`).
