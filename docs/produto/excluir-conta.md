# Plano: excluir conta (e política de privacidade)

> **Para agentes:** use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar tarefa a tarefa. Os passos usam caixas (`- [ ]`) para acompanhar.

**Objetivo:** o garagista (gestor ou vendedor) exclui a própria conta pelo painel; os dados dele somem, e do gestor some a loja inteira. Fica guardado só o número do WhatsApp em `testes_whatsapp`, para registrar que o teste grátis foi usado. A política de privacidade passa a existir e diz isso.

**Arquitetura:** uma server action `excluirConta` em `src/app/painel/actions.ts` decide pelo papel: vendedor sai da loja (carteira volta ao gestor, como em `desativarVendedor`); gestor cancela a assinatura no Asaas, apaga a loja (o `on delete cascade` leva carros, leads, membros, convites, pedidos e vendas; `testes_whatsapp.loja_id` vira null) e depois os arquivos no R2. As regras puras ficam em `src/lib/exclusao.ts`, testadas com `node --test`.

**Stack:** Next.js 16 (server actions), Drizzle no Supabase Postgres, Auth.js v5, Asaas API v3, Cloudflare R2, `@base-ui/react` (AlertDialog do shadcn em `src/components/ui`).

**Depende de:** [PR #16](https://github.com/77mdias/autogiro/pull/16) (tabela `testes_whatsapp`) mergeado na `main`. Comece a branch depois dele.

## Regras decididas

- **Quem exclui:** qualquer membro ativo logado, a própria conta (vendedor desativado já não entra no painel; pede à AutoGiro), em Minha loja (`/painel/loja`, que abre mesmo com o plano pausado).
- **Confirmação:** digitar `EXCLUIR` (aceita minúsculas e espaços nas pontas) num AlertDialog.
- **Vendedor:** carros e clientes dele voltam ao gestor; o registro em `membros` é apagado; pedidos de edição pendentes dele somem (as fotos novas desses pedidos são apagadas do R2); nas vendas, `membro_id` vira null (o histórico da loja fica, sem o nome dele). A mensalidade da loja é recalculada (`ajustarMensalidade`).
- **Gestor:** apaga a loja inteira. Os vendedores perdem o acesso na hora e, ao entrar, caem no onboarding. Com assinatura, cancela no Asaas **antes** de apagar; se o Asaas recusar, nada é apagado.
- **Conta de e-mail:** apaga `usuarios` (e `tokens_email` em cascata). Conta Google não tem linha própria; some com o membro.
- **Fica guardado:** `testes_whatsapp.chave` (número, sem ligação com a loja) e `webhook_events` (registro financeiro dos eventos do Asaas). Os dados de pagamento (nome, CPF/CNPJ, cartão) ficam no Asaas, que é o controlador deles.
- **Depois:** `signOut({ redirectTo: "/login?aviso=excluida" })`; o login já mostra avisos por `?aviso=` (mapa `AVISOS` em `src/app/login/page.tsx`), e ganha `excluida: "Conta excluída."`. A landing fica estática.
- **Fora do escopo:** conta sem loja (parou no onboarding) não tem painel; exclusão por pedido no WhatsApp ou e-mail da AutoGiro, como diz a política. Prazo de carência ou "desfazer" também fica de fora.

## Restrições gerais

- Código, textos e docs em português.
- `loja_id` e `membro_id` só da sessão (`getMembro()`), nunca do formulário.
- Nada de `.env` nem `next dev` no host; o que precisa de segredo roda em container (`pnpm docker:exec`).
- Arquivos testados em `src/lib/` sem o alias `@/` e com import `.ts` explícito.
- Visual segue o `DESIGN.md` travado; reusar `AlertDialog`, `Button`, `Input` de `src/components/ui`.
- Docs no mesmo PR (tabela "Manter em dia" de `docs/README.md`).
- Antes de commitar: `pnpm test`, `pnpm typecheck`, `pnpm lint`.

## Pontos para a revisão

1. **Assinatura já apagada no Asaas** (webhook perdido): o `DELETE` responde 404. Esperado: tratar como cancelada e seguir. Coberto na tarefa 2.
2. **Asaas fora do ar ou chave inválida:** esperado: nada apagado, erro "Não deu para cancelar a assinatura no Asaas. Tente de novo em alguns minutos." e nova tentativa funciona. Coberto na tarefa 3 (assinatura limpa no banco logo após o cancelamento, para a nova tentativa não cancelar duas vezes) e validado na tarefa 6.
3. **Clique duplo ou duas abas:** a segunda chamada não acha membro. Esperado: sai da conta sem erro. Coberto na tarefa 3.
4. **Falha no R2 depois de apagar o banco:** a conta já sumiu; esperado: não mostrar erro, registrar as chaves no log (`console.error`) para limpar à mão. Coberto na tarefa 3.
5. **Mesmo WhatsApp depois de excluir:** conta nova cria loja sem teste grátis (regra do PR #16). Validado na tarefa 6.

---

### Tarefa 1: regras puras da exclusão

**Arquivos:**
- Criar: `src/lib/exclusao.ts`
- Teste: `src/lib/exclusao.test.ts`

**Interfaces:**
- Produz: `CONFIRMACAO_EXCLUSAO = "EXCLUIR"`; `confirmouExclusao(texto: string): boolean`; `arquivosDaLoja(fotosCarros: string[][], pedidos: Pick<MudancasCarro, "fotosNovas">[]): string[]` (sem repetidas); `contaDeEmail(sub: string): boolean` (o `sub` é um UUID de `usuarios`; o do Google é numérico).

- [ ] **Passo 1: escrever os testes**

```ts
test("confirmação da exclusão", () => {
  assert.equal(confirmouExclusao("EXCLUIR"), true);
  assert.equal(confirmouExclusao("  excluir "), true);
  assert.equal(confirmouExclusao("excluir conta"), false);
  assert.equal(confirmouExclusao(""), false);
});

test("arquivos da loja sem repetir", () => {
  assert.deepEqual(arquivosDaLoja([["a.jpg", "b.jpg"], ["c.jpg"]], [{ fotosNovas: ["b.jpg", "d.jpg"] }]), ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]);
  assert.deepEqual(arquivosDaLoja([], []), []);
});

test("conta de e-mail ou Google", () => {
  assert.equal(contaDeEmail("0b6f4c1e-6d1a-4f1e-9a43-2a7d1c0e9b11"), true);
  assert.equal(contaDeEmail("109876543210987654321"), false);
});
```

- [ ] **Passo 2:** `node --test src/lib/exclusao.test.ts` falha (módulo não existe).
- [ ] **Passo 3:** implementar as quatro exportações em `src/lib/exclusao.ts` (`import type { MudancasCarro } from "./pedidos.ts"`).
- [ ] **Passo 4:** `node --test src/lib/exclusao.test.ts` passa.
- [ ] **Passo 5:** commit `feat(conta): regras puras da exclusão de conta`.

### Tarefa 2: cancelar assinatura no Asaas

**Arquivos:**
- Modificar: `src/lib/asaas.ts`

**Interfaces:**
- Produz: `AsaasError` ganha `status: number` (`new AsaasError(mensagem, status)`); `cancelarAssinatura(subscriptionId: string): Promise<void>` faz `DELETE /subscriptions/{id}` e retorna normalmente quando o Asaas responde 404 (já não existe).

- [ ] **Passo 1:** adicionar `status` ao `AsaasError` e passá-lo no `asaas()`; conferir que os usos atuais (`assinar`, `ajustarMensalidade`) não mudam.
- [ ] **Passo 2:** implementar `cancelarAssinatura` com `asaas(path, undefined, "DELETE")`, engolindo só `AsaasError` com `status === 404`.
- [ ] **Passo 3:** `pnpm typecheck` passa.
- [ ] **Passo 4:** commit `feat(asaas): cancelar assinatura`. (Validação real no Sandbox, tarefa 6.)

### Tarefa 3: action `excluirConta`

**Arquivos:**
- Modificar: `src/app/painel/actions.ts`

**Interfaces:**
- Consome: `confirmouExclusao`, `arquivosDaLoja`, `contaDeEmail` (tarefa 1); `cancelarAssinatura`, `AsaasError` (tarefa 2); `getMembro`, `deleteFotos`, `deleteCnhs`, `ajustarMensalidade`, `signOut`.
- Produz: `excluirConta(_prev: FormState, fd: FormData): Promise<FormState>` (campo `confirmacao`); `devolverCarteira(tx: Tx, lojaId: string, de: string, para: string): Promise<void>`, extraída de `desativarVendedor` (que passa a chamá-la).

- [ ] **Passo 1:** extrair `devolverCarteira` (os dois `update` de `carros.cadastradoPor` e `sim.responsavelId`) e usar em `desativarVendedor`. `pnpm test` e `pnpm typecheck` passam sem mudar comportamento.
- [ ] **Passo 2:** implementar `excluirConta`, nesta ordem:
  1. `confirmouExclusao(fd.get("confirmacao"))`, senão `{ error: "Digite EXCLUIR para confirmar." }`.
  2. `getMembro()`; sem membro → `signOut` (já excluída, ponto 3 da revisão).
  3. **Vendedor:** numa transação, achar o gestor ativo da loja, `devolverCarteira(tx, lojaId, membroId, gestorId)`, juntar `fotosNovas` dos pedidos pendentes dele, apagar o membro. Fora da transação: `deleteFotos` dessas fotos, `ajustarMensalidade(lojaId)`.
  4. **Gestor:** ler `asaas_subscription_id`; se houver, `cancelarAssinatura` (com `AsaasError` → erro do ponto 2 da revisão, sem apagar nada) e, em seguida, `update lojas set asaas_subscription_id = null`. Juntar as chaves com `arquivosDaLoja` (fotos dos carros e dos pedidos) e as `cnh_key` não nulas das simulações. Apagar a loja (`delete from lojas where id = lojaId`). Depois `deleteFotos` e `deleteCnhs` num `try/catch` que só faz `console.error` com as chaves (ponto 4).
  5. `contaDeEmail(session.user.id)` → apagar `usuarios` pelo id (para Google não roda, senão o Postgres recusa o texto como UUID).
  6. `signOut({ redirectTo: "/login?aviso=excluida" })`.
- [ ] **Passo 3:** `pnpm test`, `pnpm typecheck`, `pnpm lint` passam.
- [ ] **Passo 4:** commit `feat(conta): excluir conta de gestor ou vendedor`.

### Tarefa 4: tela em Minha loja

**Arquivos:**
- Criar: `src/app/painel/loja/excluir-conta.tsx` (client)
- Modificar: `src/app/painel/loja/page.tsx` (no fim da página), `src/app/login/page.tsx` (aviso `excluida` em `AVISOS`)

**Interfaces:**
- Consome: `excluirConta`, `CONFIRMACAO_EXCLUSAO`.
- Produz: `<ExcluirConta gestor={boolean} vendedores={number} temAssinatura={boolean} />`.

- [ ] **Passo 1:** componente com botão "Excluir minha conta" (variante destrutiva do `Button`), `AlertDialog` com o texto abaixo, `Input name="confirmacao"`, `useActionState(excluirConta)` e o erro embaixo do campo.
  - Gestor: "Apaga a loja, os carros e as fotos, os interessados e as CNHs, as vendas e o acesso {vendedores} vendedor(es). {temAssinatura ? "A assinatura no Asaas é cancelada. " : ""}Fica guardado só o número do WhatsApp, para registrar que o teste grátis foi usado. Não dá para desfazer."
  - Vendedor: "Seus carros e clientes voltam para o gestor da loja. Não dá para desfazer."
  - Rótulo do campo: "Digite EXCLUIR para confirmar".
- [ ] **Passo 2:** em `page.tsx`, montar com os dados que a página já tem (`gestor`, `vendedores`, `loja.asaasSubscriptionId`). Em `AVISOS` do login, `excluida: "Conta excluída."`.
- [ ] **Passo 3:** `pnpm typecheck`, `pnpm lint` e o sloplint de design (`node ~/.claude/skills/hallmark/scripts/sloplint.mjs src/app src/components --scope app`) passam.
- [ ] **Passo 4:** commit `feat(conta): botão de excluir conta em Minha loja`.

### Tarefa 5: página de política de privacidade

**Arquivos:**
- Criar: `src/app/privacidade/page.tsx` (estática, `metadata.title = "Política de privacidade"`)
- Modificar: rodapé da landing (`src/app/page.tsx`), rodapé da vitrine (`src/app/loja/[slug]/page.tsx`), cadastro (`src/app/cadastro/page.tsx`) e o aceite LGPD da simulação (`simulacao-form.tsx`), com link para `/privacidade`.

- [ ] **Passo 1:** escrever a página com estas seções, cada uma com o que o app faz hoje (fonte: `arquitetura.md`, `pagamentos-asaas.md`):
  - Quem é o controlador (AutoGiro / 77dev) e contato.
  - Dados da loja e da equipe (nome, WhatsApp, e-mail, conta Google) e para quê.
  - Dados de quem pede simulação (nome, telefone, valores, CNH), que a loja recebe; CNH em bucket privado, link de 5 minutos, apagada em 90 dias.
  - Pagamento: feito pelo Asaas; o AutoGiro não vê nem guarda cartão nem CPF/CNPJ.
  - Fornecedores: Vercel, Supabase, Cloudflare R2, Resend, Asaas, Google.
  - **Exclusão:** pelo painel (Minha loja › Excluir minha conta) ou pedido à AutoGiro. Apaga loja, carros, fotos, interessados, CNHs e vendas. **Fica guardado o número do WhatsApp**, só para registrar que o teste grátis foi usado (legítimo interesse, prevenção de fraude), e os registros de pagamento do Asaas, pelo prazo legal.
  - Direitos do titular (LGPD art. 18) e como pedir.
- [ ] **Passo 2:** links nos quatro lugares.
- [ ] **Passo 3:** `pnpm typecheck`, `pnpm lint` passam.
- [ ] **Passo 4:** commit `feat: política de privacidade`. O texto é técnico: **precisa de revisão jurídica** antes de divulgar em escala (pendência que já está em `estado.md`).

### Tarefa 6: validar e documentar

**Arquivos:**
- Modificar: `docs/arquitetura.md` (rota `/privacidade`, exclusão na seção Plano/Dados), `docs/produto/estado.md` (marca a política como publicada, com revisão jurídica pendente; exclusão de conta pronta), `docs/decisoes.md` (entrada: guardar só o número), `docs/testes.md` (o que foi validado).

- [ ] **Passo 1:** reativar o Supabase de dev (estava pausado em 2026-11-12) e subir `pnpm docker:up` com o ngrok.
- [ ] **Passo 2:** no Sandbox, com a conta de teste: loja com carro, foto, simulação com CNH, um vendedor e assinatura de cartão. Excluir a conta do **vendedor** → carros e leads dele com o gestor, mensalidade recalculada.
- [ ] **Passo 3:** excluir a conta do **gestor** → assinatura some no Asaas Sandbox; `SUBSCRIPTION_DELETED` chega e é ignorado (200); `pnpm docker:exec pnpm loja listar` sem a loja; `testes_whatsapp` com a chave e `loja_id` null; foto e CNH não existem mais no R2.
- [ ] **Passo 4:** Asaas recusando (chave Sandbox inválida no container): nada apagado, erro na tela; com a chave certa, a nova tentativa conclui.
- [ ] **Passo 5:** conta nova com o mesmo WhatsApp → loja sem teste grátis.
- [ ] **Passo 6:** atualizar as docs listadas, rodar `pnpm test`, `pnpm typecheck`, `pnpm lint`, commit `docs: exclusão de conta e política de privacidade` e abrir o PR.
