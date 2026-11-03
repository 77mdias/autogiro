# Documentação do AutoGiro

PWA mobile-first para garagistas: estoque, vitrine pública por loja e simulações de financiamento com CNH. A loja paga R$ 149/mês pelo Asaas, com 7 dias grátis.

| Arquivo | O que tem |
|---|---|
| [arquitetura.md](arquitetura.md) | Como o app é organizado: rotas, dados, autenticação, multi-tenant, plano, arquivos |
| [stack.md](stack.md) | Softwares, plataformas, serviços e bibliotecas, com o porquê de cada um |
| [decisoes.md](decisoes.md) | Registro das decisões de produto e técnicas, com data e motivo |
| [pagamentos-asaas.md](pagamentos-asaas.md) | Plano, fases de venda, checkout, webhook, eventos e operação |
| [desenvolvimento.md](desenvolvimento.md) | Setup, variáveis de ambiente, ngrok, migrações, scripts e armadilhas conhecidas |
| [deploy.md](deploy.md) | Vercel: fluxo branch → PR → CI → main, migrações automáticas no deploy, configuração de produção |
| [segredos.md](segredos.md) | Segredos no Criptenv, Docker sem `.env`, como configurar e usar, e o que melhorar no Criptenv |
| [testes.md](testes.md) | Testes automáticos, cartões de teste, contas do Sandbox e o que já foi validado |

Outros documentos na raiz: `README.md` (resumo e setup), `DESIGN.md` (sistema visual travado), `AGENTS.md` (aviso sobre o Next 16 para agentes).
