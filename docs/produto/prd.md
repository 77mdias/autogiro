# PRD: requisitos de produto

> Documento de origem, escrito antes do código com o nome provisório **Garagem Link** (o produto é o **AutoGiro**). O que já está pronto, o que mudou e por quê: [estado.md](estado.md).

## 1. Visão Geral do Produto

O **Auto Giro** é uma plataforma SaaS focada na extrema simplicidade de gerenciamento e divulgação de estoque para pequenos lojistas de automóveis. A plataforma resolve a complexidade e o alto custo dos ERPs automotivos tradicionais, permitindo o cadastro de um veículo em menos de 1 minuto via dispositivo móvel.

## 2. Objetivos e Critérios de Sucesso

- **Simplicidade Absoluta:** O usuário (garagista) deve conseguir cadastrar um veículo sem a necessidade de passar por qualquer tipo de treinamento prévio.
- **Time-to-Value Rápido:** Permitir a geração e o compartilhamento de um link público funcional imediatamente após o cadastro do carro.
- **Conversão de Clientes:** Facilitar a ponte entre cliente final e lojista através do direcionamento ágil para o WhatsApp e captação simplificada de leads de financiamento.

## 3. Personas

- **O Garagista (Usuário Autenticado):** Dono de uma pequena revenda de veículos (frequentemente opera sozinho ou com pouquíssimos funcionários). Utiliza majoritariamente o smartphone no pátio da loja, tem pouca paciência para sistemas burocráticos e preza pela agilidade no Pix/WhatsApp.
- **O Comprador (Usuário Público):** Consumidor final em busca de um carro. Navega via celular, quer informações claras de forma rápida, e prefere simular o financiamento ou iniciar o contato diretamente pelo WhatsApp sem precisar preencher cadastros longos (como CPF ou renda nesta fase).

## 4. Requisitos Funcionais (Escopo do Produto)

### 4.1 Experiência do Garagista (Painel Administrativo do Lojista)

- **Onboarding & Autenticação:** Criação de conta simplificada, Login/Logout e recuperação de senha.
- **Configuração da Loja:** Edição do nome da loja e número do WhatsApp (com DDI/DDD) para geração correta dos links de redirecionamento.
- **Gestão de Estoque (CRUD Completo):**
  - Cadastro rápido contendo: Fotos, Marca, Modelo, Ano, KM, Preço, Câmbio, Combustível, Cor e Observações textuais.
  - Atualização de status: Alternar entre "Disponível" e "Vendido" (veículos marcados como vendidos continuam na vitrine, mas sinalizados).
- **Compartilhamento:** Botão nativo de cópia do link público do veículo ou da vitrine completa para envio rápido pelas redes sociais.
- **Central de Interessados (Leads):** Visualização organizada em formato de lista dos pedidos de simulação feitos pelos clientes finais. Deve exibir os metadados do lead, arquivo anexo da CNH e link direto para iniciar chat no WhatsApp.

### 4.2 Experiência do Cliente Final (Visão Pública)

- **Vitrine da Loja (`/loja/[slug_da_loja]`):** Catálogo digital responsivo listando todos os automóveis da loja com filtros básicos ou ordenação por preço/ano.
- **Página de Detalhes do Veículo (`/carro/[id_do_carro]`):** Galeria de fotos, exibição clara dos atributos técnicos e CTAs (Call to Action) evidentes.
- **Integração com WhatsApp:** Botão de contato direto que abre o aplicativo do cliente com uma mensagem pré-formatada (Ex: _"Olá! Vi o modelo [Marca] [Modelo] [Ano] na sua vitrine e gostaria de mais informações."_).
- **Formulário de Simulação de Financiamento:** Coleta de Nome, WhatsApp, Entrada, Valor a Financiar, seleção de Parcelas (24x a 60x), upload de arquivo de CNH e checkbox obrigatório de consentimento de dados (LGPD).

### 4.3 Experiência do Administrador Geral (Dono do SaaS)

- **Dashboard Admin:** Monitoramento da saúde financeira e operacional do ecossistema. Exibição de contadores agregados por status da assinatura (Em teste, Ativas, Inadimplentes, Canceladas), Receita Mensal Recorrente (MRR) e métricas de engajamento das lojas (quantidade de carros/pedidos).

## 5. Requisitos Não-Funcionais

- **Mobile-First / PWA:** A interface de administração do lojista precisa se comportar como um aplicativo nativo quando adicionada à tela inicial do celular.
- **Performance:** Carregamento rápido da vitrine e imagens otimizadas para redes móveis 4G/5G.
- **Multi-Tenancy Restrito:** Isolamento total de dados a nível de banco de dados. Uma loja jamais poderá visualizar ou interceptar requisições, carros ou leads de outra.

## 6. Riscos, Restrições e Decisões de Produto

- **Dados Pessoais Sensíveis:** A CNH coletada é um dado crítico. O produto assume a restrição de não expor publicamente estes arquivos em URLs indexáveis ou abertas, limitando o acesso estritamente ao respectivo lojista.
- **Prevenção de Escopo Inflado (Scope Creep):** Manter a firme decisão de **não** adicionar CPF, score de crédito, avaliação de veículo usado na troca ou comprovantes de renda nesta fase do ciclo de vida do produto para garantir o diferencial de simplicidade.
