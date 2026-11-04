# SRS: requisitos de software

> Documento de origem, escrito antes do código com o nome provisório **Garagem Link** (o produto é o **AutoGiro**). O que já está pronto, o que mudou e por quê: [estado.md](estado.md).

## 1. Introdução

### 1.1 Propósito

Este documento especifica os requisitos técnicos, arquitetura de dados, restrições de segurança e integrações de engenharia para o desenvolvimento da plataforma Garagem Link.

### 1.2 Escopo do Sistema

O sistema consiste em uma aplicação web PWA unificada dividida em três camadas lógicas de acesso: Pública (Clientes), Privada Autenticada (Garagistas) e Administrativa (Dono do SaaS), integrada a um gateway de pagamento (Asaas) e uma camada de armazenamento de objetos em nuvem.

## 2. Arquitetura Técnica Sugerida

- **Frontend:** Framework moderno SPA/SSR (ex: Next.js, Nuxt, React ou Vue) rodando em arquitetura mobile-first adaptada para PWA (Manifest, Service Workers).
- **Backend / API:** Camada de serviços responsável pelas regras de negócio, autenticação (JWT ou Sessões) e consumo seguro de Webhooks.
- **Banco de Dados:** Relacional (PostgreSQL) ou NoSQL com forte suporte a relacionamentos, implementando chaves estrangeiras baseadas na entidade `Loja` para garantir o isolamento.
- **Armazenamento de Arquivos:** Object Storage (ex: AWS S3, Cloudflare R2 ou Supabase Storage).

## 3. Requisitos de Sistema e Casos de Uso Técnicos

### 3.1 Autenticação e Multi-Tenancy

- **REQ-001:** O sistema deve isolar os dados utilizando um identificador único de Loja (`tenant_id` ou `loja_id`) em todas as tabelas de negócio (Carros, Pedidos, Configurações).
- **REQ-002:** Toda requisição à rota de gerenciamento do Garagista deve validar a sessão ativa do usuário e garantir que ele possua permissões explícitas sobre o ID da loja solicitada.

### 3.2 Cadastro e Otimização de Imagens

- **REQ-003:** O sistema deve aceitar o upload de até X imagens por veículo.
- **REQ-004:** O backend/edge deve realizar a compressão e conversão automática das fotos para formatos otimizados (como WebP) para reduzir o consumo de banda na ponta do cliente final.

### 3.3 Motor de Cobrança e Webhooks (Integração Asaas)

- **REQ-005:** Ao finalizar o Onboarding do garagista, a API deve cadastrar a entidade correspondente como cliente no Asaas e assinar o plano recorrente de R$ 149,00.
- **REQ-006:** A rota de recepção de Webhooks (`/api/v1/webhooks/asaas`) deve implementar uma validação de Token de Segurança enviado no Header da requisição para mitigar ataques de spoofing.
- **REQ-007 (Idempotência):** A API deve registrar os IDs dos eventos processados do Asaas. Caso um evento com o mesmo ID (ex: `PAYMENT_RECEIVED`) seja recebido novamente, a operação deve ser ignorada para evitar duplicações no banco de dados.
- **REQ-008 (Ciclo de Vida de Acesso):**
  - `PAYMENT_CREATED`: Mantém ou estende o período de teste/espera.
  - `PAYMENT_RECEIVED`: Atualiza o status da loja para `ativa` e renova o período de expiração do acesso por 30 dias.
  - `PAYMENT_OVERDUE`: Altera o status da loja para `inadimplente` e bloqueia o acesso ao painel do garagista, exibindo tela de restrição/pagamento.

## 4. Especificação do Modelo de Dados (Esquema Conceitual)

### Tabela: `Lojas`

- `id`: UUID (PK)
- `nome_loja`: VARCHAR(255)
- `whatsapp`: VARCHAR(20)
- `status_assinatura`: ENUM ('teste', 'ativa', 'inadimplente', 'cancelada')
- `asaas_customer_id`: VARCHAR(100)
- `created_at`: TIMESTAMP

### Tabela: `Carros`

- `id`: UUID (PK)
- `loja_id`: UUID (FK -> Lojas.id)
- `marca`: VARCHAR(100)
- `modelo`: VARCHAR(100)
- `ano`: INT
- `km`: INT
- `preco`: DECIMAL(10,2)
- `cambio`: ENUM ('manual', 'automatico')
- `combustivel`: ENUM ('gasolina', 'etanol', 'flex', 'diesel', 'eletrico', 'hibrido')
- `cor`: VARCHAR(50)
- `observacoes`: TEXT
- `status`: ENUM ('disponivel', 'vendido')
- `fotos`: JSON / ARRAY (URLs das imagens)
- `created_at`: TIMESTAMP

### Tabela: `PedidosSimulacao`

- `id`: UUID (PK)
- `loja_id`: UUID (FK -> Lojas.id)
- `carro_id`: UUID (FK -> Carros.id)
- `nome_cliente`: VARCHAR(255)
- `whatsapp_cliente`: VARCHAR(20)
- `valor_entrada`: DECIMAL(10,2)
- `valor_financiar`: DECIMAL(10,2)
- `parcelas`: INT (Restrito a: 24, 36, 48, 60)
- `cnh_url`: VARCHAR(512) (Caminho privado no bucket)
- `consentimento_lgpd`: BOOLEAN (Deve ser TRUE)
- `created_at`: TIMESTAMP

## 5. Segurança, Privacidade e LGPD

### 5.1 Proteção da CNH (Dados Pessoais Sensíveis)

- **REQ-009:** As URLs geradas para visualização dos anexos de CNH no bucket de objetos devem ter assinatura com tempo de expiração curto (Ex: links pré-assinados válidos por apenas 5 minutos). Nenhuma CNH deve ser exposta via link estático público.
- **REQ-010 (Expurgo Automático):** Um worker síncrono (Cron Job) deve varrer a tabela `PedidosSimulacao` diariamente e apagar fisicamente os arquivos de CNH e os registros de leads cujo tempo de criação ultrapasse o limite legal definido em política (Ex: 30 dias), mitigando o passivo de armazenamento de dados sensíveis.
- **REQ-011 (Variáveis de Ambiente):** Credenciais críticas, tokens de API do Asaas e chaves privadas do Bucket de arquivos de produção sob hipótese alguma podem coexistir no código-fonte, devendo ser injetadas exclusivamente via variáveis de ambiente da infraestrutura de hospedagem.
