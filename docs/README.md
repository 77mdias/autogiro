# Documentação do AutoGiro

PWA mobile-first para garagistas: estoque, vitrine pública por loja e simulações de financiamento com CNH. A loja paga pelo Asaas uma mensalidade pelo tamanho da equipe (R$ 39 a R$ 169), com 15 dias grátis.

## Produto

| Arquivo | O que tem |
|---|---|
| [produto/estado.md](produto/estado.md) | **Comece aqui.** O que está pronto, o que difere da especificação e por quê, o que falta |
| [produto/prd.md](produto/prd.md) | Requisitos de produto (personas, funcionalidades, não funcionais) |
| [produto/srs.md](produto/srs.md) | Requisitos de software (multi-tenant, cobrança, modelo de dados, LGPD) |
| [produto/fluxos.md](produto/fluxos.md) | Mapa dos fluxos do garagista, do comprador, da simulação e da cobrança |
| [produto/telas-equipe.md](produto/telas-equipe.md) | Plano das telas da equipe (vendedores, clientes, vendas e comissões) |
| [produto/briefing.md](produto/briefing.md) | Briefing original de passagem do projeto |

## Como funciona

| Arquivo | O que tem |
|---|---|
| [arquitetura.md](arquitetura.md) | Rotas, código, dados, autenticação, multi-tenant, plano, arquivos, renderização |
| [stack.md](stack.md) | Serviços, plataformas e bibliotecas, com o porquê de cada um |
| [pagamentos-asaas.md](pagamentos-asaas.md) | Plano, fases de venda, checkout, webhook e operação |
| [../DESIGN.md](../DESIGN.md) | Sistema visual travado (tokens, cores, controles) |

## Como trabalhar

| Arquivo | O que tem |
|---|---|
| [desenvolvimento.md](desenvolvimento.md) | Rodar no Docker, scripts, variáveis, ngrok, migrações e armadilhas conhecidas |
| [testes.md](testes.md) | Testes automáticos, conta de teste, cartões do Sandbox, o que já foi validado |
| [segredos.md](segredos.md) | Criptenv: como os segredos chegam ao app, configuração e limites |
| [deploy.md](deploy.md) | Vercel: fluxo branch → PR → CI → main, migrações no deploy, cron, produção |

## Histórico

| Arquivo | O que tem |
|---|---|
| [decisoes.md](decisoes.md) | Decisões de produto e técnicas, com data e motivo (mais recentes primeiro) |

## Manter em dia

A documentação muda no mesmo PR que o código. Ao mexer em:

| Mudou | Atualize |
|---|---|
| Funcionalidade entregue, adiada ou cortada | `produto/estado.md` |
| Rota, tabela, regra de acesso | `arquitetura.md` |
| Escolha com alternativa descartada | `decisoes.md` (entrada nova no topo) |
| Variável de ambiente | `.env.example` (comentário na linha de cima, nunca na mesma linha), o Criptenv e `desenvolvimento.md` se mudar entre ambientes |
| Serviço ou biblioteca | `stack.md` |
| Algo validado de ponta a ponta | `testes.md` |
| Passo de produção | `deploy.md` |
