# Briefing de Desenvolvimento: Garagem Link

Documento de passagem do projeto. Reúne tudo o que foi definido até agora e o que falta construir.

## 1. O que é

Aplicativo web para donos de garagem de carros cadastrarem o estoque de forma rápida, pelo celular, e compartilharem com o cliente um link com fotos, preço e dados do veículo. O cliente pode chamar a loja no WhatsApp ou pedir uma simulação de financiamento anexando a CNH.

- **Público:** Donos de garagem pequenos, que acham os sistemas grandes complicados e caros.
- **Diferencial:** Simplicidade. Cadastrar um carro em cerca de 1 minuto, sem treinamento.

## 2. Funcionalidades

### Garagista (Dono da loja)

- **Cadastro de carro:** Fotos, marca, modelo, ano, km, preço, câmbio, combustível, cor e observações.
- **Gerenciamento:** Editar, marcar como vendido (ou voltar a disponível) e excluir.
- **Compartilhamento:** Copiar ou compartilhar o link de cada carro.
- **Dados da loja:** Nome e WhatsApp.
- **Aba Interessados:** Lista de pedidos de simulação, com botão para ver a CNH, chamar no WhatsApp e excluir.

### Cliente (Sem login)

- **Vitrine:** Visualização de todos os carros da loja. Os vendidos aparecem marcados.
- **Página do carro:** Galeria de fotos, preço, dados, observações e botão "Falar no WhatsApp" com mensagem pronta citando o carro.
- **Simular financiamento:** Nome, WhatsApp, valor de entrada, valor que quer financiar, parcelas (24, 36, 48 ou 60), anexo da CNH (foto ou PDF) e caixa de autorização de uso dos dados.

> **Nota:** A ideia é manter tudo simples e prático. Foi decidido não acrescentar mais campos (CPF, renda, carro na troca) por enquanto.

## 3. Modelo de Negócio

- Assinatura mensal de R$ 149,00, sem limite de carros.
- Teste grátis de 7 dias (prazo ainda a confirmar), sem cartão.
- Venda inicial manual para os primeiros 5 a 10 garagistas, com link de pagamento e liberação manual. Depois, cobrança automática.

## 4. O que Falta Construir

1. Hospedagem online com domínio.
2. Login e contas: cada garagista com sua loja, e dados totalmente separados entre lojas.
3. Banco de dados para lojas, carros e pedidos.
4. Armazenamento de arquivos (fotos e CNH) fora do banco, com acesso restrito.
5. Links públicos reais que abrem no celular do cliente (hoje só funcionam no aparelho de quem testa).
6. Cobrança mensal automática (item 6).
7. Painel do administrador (item 7).
8. PWA: o garagista adiciona à tela inicial do celular, sem loja de aplicativos.

## 5. Pagamento (Parte do Desenvolvedor)

Sugestão: **Asaas**, que aceita Pix, boleto e cartão com cobrança recorrente. Conferir taxas atuais antes de fechar.

- Criar o cliente e a assinatura de R$ 149/mês na API. O Asaas gera as cobranças sozinho a cada período.
- Receber webhooks das cobranças. Eventos principais: `PAYMENT_CREATED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`.
- Pago libera o acesso. Atrasado bloqueia ou limita o acesso. Pagou depois, volta sozinho.
- Tratar webhooks com idempotência, para o mesmo aviso não ser processado duas vezes.
- Começar no Sandbox do Asaas e só depois ir para produção.
- A chave da API fica em variável de ambiente, nunca no código nem em chat.

## 6. Painel do Administrador

Área só do dono do negócio, com:

- Lojas ativas, em teste, inadimplentes e canceladas;
- Receita mensal;
- Carros e pedidos por loja, para ver quem usa de verdade e quem pode cancelar.

## 7. Segurança e LGPD

A CNH é dado pessoal sensível. Requisitos mínimos:

- Armazenamento privado e criptografado, com acesso só do dono da loja que recebeu o pedido;
- Caixa de autorização no formulário (já prevista);
- Exclusão manual pelo garagista e, de preferência, exclusão automática após um prazo;
- Política de privacidade simples publicada no site;
- Limites de tamanho e tipo de arquivo no envio.

## 8. Fases Sugeridas

1. App no ar com login, banco, fotos e links públicos.
2. Teste grátis com 3 a 5 garagistas e ajustes com o feedback deles.
3. Cobrança automática com Asaas e bloqueio por inadimplência.
4. Painel do administrador.

## 9. Decisões em Aberto

- Nome definitivo do produto (provisório: Garagem Link).
- Duração do teste grátis (proposto: 7 dias).
- WhatsApp de contato para a página de vendas (hoje com espaço reservado).
- Qual gateway de pagamento usar de fato.
- Prazo de exclusão automática da CNH.

## 10. Prompt para o Claude Code

Se for usar o Claude Code para acelerar, pode começar assim:

> Monte o app Garagem Link como PWA mobile-first, com login para garagistas e banco de dados. Cada garagista tem sua loja, carros e pedidos de simulação, separados dos demais. Use o protótipo em HTML (link no briefing) como referência de telas e textos. Armazene fotos e CNH em storage privado. Páginas públicas de carro e vitrine abrem sem login. Integre assinatura mensal de R$ 149 com o Asaas (sandbox primeiro), com 7 dias grátis e bloqueio por atraso via webhook. Guarde a chave em variável de ambiente.
