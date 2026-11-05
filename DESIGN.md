# Design: AutoGiro

O sistema travado. Toda tela nova parte daqui; mudar este arquivo é decisão de produto, não de página.
As telas seguem a organização do projeto "AutoGiro PWA Platform" no Stitch (celular primeiro); o visual é o tema Vantage da Hallmark com as cores do logo.

## Sistema
- Gênero: modern-minimal (Hallmark)
- Formas: telas de app (painel, vitrine, detalhe, simulação); a landing em `/` é uma página simples de venda (como funciona, funções, vantagens, preço, perguntas), com texto grande para o garagista
- Tema: Vantage, com a paleta do logo no lugar do lima; suporte completo a modo claro e modo escuro (`switchtheme` via `data-mode="light" | "dark"` persistido em `localStorage`)
- Eixos: light/grotesk-sans/chromatic-blue em todas as telas, landing inclusive (o modo escuro segue a escolha salva pelo usuário) · postura: contida

## Tokens
`src/app/tokens.css` é a fonte da verdade (Tailwind 4, `@theme static`). Os papéis:
```css
:root {
  --color-paper: oklch(98.4% 0.004 256);  --color-paper-2: oklch(96% 0.007 256);  --color-paper-3: oklch(93% 0.01 256);
  --color-ink: oklch(24% 0.05 256);  --color-ink-2: oklch(38% 0.035 256);  --color-ink-3: oklch(50% 0.025 256);
  --color-rule: oklch(90% 0.012 256);  --color-rule-2: oklch(64% 0.02 256);
  --color-brand: oklch(55% 0.2 256);  --color-brand-ink: oklch(99% 0.004 256);  --color-focus: oklch(58% 0.2 256);
  --color-navy: oklch(29.9% 0.083 256);  --color-signal: oklch(52% 0.13 152);  --color-error: oklch(52% 0.19 27);
  --font-display: Rethink Sans (peso 600);  --font-body: Plus Jakarta Sans (peso 400/500);  --font-mono: JetBrains Mono;
  --radius-card: 6px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: none;
}
.theme-night, html[data-mode="dark"] { --color-paper: oklch(14% 0.02 256); --color-brand: oklch(66% 0.19 256); --color-signal: oklch(78% 0.18 150); … }
```
Escala de espaço, de tipo, easings e durações estão em `tokens.css`. O shadcn lê os mesmos tokens pelos nomes dele (`globals.css`).

## Regras de cor
- Azul da marca (`brand`): só a ação principal da tela, o foco e o item ativo.
- Verde (`signal`): só o canal do comprador (WhatsApp) e o que "chegou" (simulação nova). Um botão verde cheio por tela; os demais em contorno verde.
- Marinho (`navy`): o aviso de simulações novas no estoque e o avatar da loja.
- Texto secundário em `ink-3` (contraste 5,7:1). Fotos dos carros nunca recebem filtro.

## Controles
- Primário: pílula azul, 48px no toque e 40px com mouse (na landing, `size="lg"`: 56px no toque e 48px com mouse)
- Secundário: pílula com contorno `rule-2`, mesma altura · Opções (câmbio, filtros): pílulas, marcadas em `ink`
- Campos: 48px, borda `rule-2`, foco em contorno de 2px, fonte de 16px (o iPhone não dá zoom)
- Molduras: só os cantos (`.ticks`) em estados vazios, link da vitrine e números medidos

## Navegação do painel
- Desktop: barra lateral de 16rem (loja, itens, tema, Sair). Item ativo em `paper-2` com filete azul e ícone azul.
- Celular: gaveta pela esquerda, aberta pelo botão de menu (56px, contorno `rule-2`) no canto inferior esquerdo; no direito, cadastrar carro (56px, azul). Fica fora da tela de cadastro.
- Contadores (simulações novas, pedidos para aprovar): pílula `navy` no item do menu e ponto `navy` no botão de menu.

## Movimento
- Caráter: calmo. Transições de 120ms a 420ms, só `transform`, `opacity` e cor.
- Landing: só a entrada suave do topo ao carregar e os blocos aparecendo uma vez ao rolar (`landing.css`); nada se mexe com movimento reduzido.

## Exports
`src/app/tokens.css` (Tailwind 4) e o mapeamento para o shadcn em `src/app/globals.css`. Ao criar um tamanho de fonte novo, registre-o em `src/lib/utils.ts` (o `cn` precisa saber que é tamanho, não cor).
