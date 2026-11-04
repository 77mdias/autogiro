# Mapa de fluxos

> Documento de origem, escrito antes do código com o nome provisório **Garagem Link** (o produto é o **AutoGiro**). O que já está pronto, o que mudou e por quê: [estado.md](estado.md).

Este documento descreve as trilhas de navegação do usuário através de notações textuais baseadas na lógica de estados e interações de telas.

## 1. Fluxo do Garagista (Área Privada)

> [ Registro / Login ]
> │
> ▼
> [ Tela de Onboarding ] ───► Configura Nome da Loja + WhatsApp
> │
> ▼
> [ Dashboard Principal / Listagem de Estoque ]
> ├───► [ Botão Novo Carro ] ───► [ Formulário de Cadastro ] ───► Salvar (Retorna à lista)
> ├───► [ Card do Carro ] ───► [ Tela de Edição ] ───► Atualizar / Excluir / Mudar Status
> ├───► [ Ícone de Compartilhar ] ───► Copia Link Público do Carro para Área de Transferência
> │
> ▼
> [ Aba Interessados / Leads ]
> ├───► Visualiza Dados da Simulação + Carro Desejado
> ├───► Clique em "Ver CNH" ───► Abre Visualizador Seguro (Link Temporário)
> └───► Clique em "Chamar no WhatsApp" ───► Abre Deep Link para WhatsApp do Cliente

## 2. Fluxo do Cliente Final (Área Pública)

> [ Link de Compartilhamento da Vitrine ou Carro ] (Acessado via Smartphone)
> │
> ├───► Se acessar a Vitrine Geral (`/loja/slug`)
> │ └───► Lista todos os carros daquela loja (Disponíveis e Vendidos)
> │ └───► Clique em um Card ───► Direciona para a Página do Carro
> │
> └───► Se acessar diretamente a Página do Carro (`/carro/id`)
> ├───► Visualiza Carrossel de Fotos e Ficha Técnica
> ├───► Botão "Falar no WhatsApp" ───► Dispara App com texto pronto referenciando o carro
> └───► Botão "Simular Financiamento" ───► Abre Janela/Formulário de Cadastro

## 3. Fluxo de Envio e Recepção de Proposta de Financiamento

> [ Formulário de Simulação ] (Preenchido pelo Cliente)
> │
> ├───► Preenche Nome, WhatsApp, Entrada e Valor Financiar
> ├───► Seleciona Número de Parcelas
> ├───► Realiza Upload da Foto/PDF da CNH
> ├───► Marca Checkbox "Autorizo o uso dos meus dados"
> │
> ▼
> [ Clique em Enviar Proposta ]
> │
> ├───► Sistema valida campos e tamanho de arquivo
> ├───► Faz upload do anexo para diretório privado no Storage
> ├───► Grava registro atrelado ao ID da loja no Banco de Dados
> │
> ▼
> [ Tela de Sucesso Pública ] ───► Exibe mensagem amigável informando que o lojista entrará em contato.
> │
> └─► (No mesmo instante, o registro aparece na "Aba Interessados" do Painel do Garagista)

## 4. Fluxo de Regras de Faturamento e Bloqueios (Gateway Asaas)

> [ Assinatura Vencida / Não Paga ]
> │
> ▼
> [ Asaas envia Webhook: `PAYMENT_OVERDUE` ]
> │
> ▼
> [ API processa e atualiza status da Loja para `inadimplente` ]
> │
> ▼
> [ Próximo acesso do Garagista ]
> ├───► Bloqueio de acesso ao Painel de Cadastro e Visualização de Leads
> └───► Redirecionamento para a tela de cobrança com Link de Pagamento atualizado (Pix/Cartão)
>
> [ Pagamento Efetuado pelo Usuário ]
> │
> ▼
> [ Asaas envia Webhook: `PAYMENT_RECEIVED` ]
> │
> ▼
> [ API valida a idempotência do evento, limpa o bloqueio e altera status da loja para `ativa` ]
> │
> ▼
> [ Acesso total do Garagista restabelecido automaticamente ]
