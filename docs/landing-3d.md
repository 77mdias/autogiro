# Landing 3D: contrato de design, movimento e desempenho

Fonte única de verdade para a landing (`/`). Referência visual: [MengTo/kage](https://mengto.github.io/kage/). Toda mudança na cena 3D confere este contrato antes de ir para revisão.

## Conceito (direção criativa)

**Showroom noturno.** A página inteira é um corredor 3D fixo atrás do conteúdo (`KageScrollStage`). O scroll é a caminhada: a câmera entra pelo primeiro portal, passa pelo carro da loja (`/3D/car-3d.glb`) girando num ponto de luz e segue pelas placas com as fotos de `public/landing` até a estrada no horizonte. O conteúdo flutua por cima, sem fundo próprio.

- **Ponto focal do hero:** o carro 3D no centro da tela, no eixo do corredor, sobre um ponto de luz (spot de cima e contorno azul atrás). É o único objeto sólido da cena; as placas são “janelas”. O texto fica no topo à esquerda e os números no rodapé, para deixar o meio livre.
- **Elevador:** ao sair do hero (1,5% a 10% do percurso) o carro desce pelo piso, cortado por um plano de corte, e some antes de a câmera passar por cima. Escondido, ele sai do render no resto da página.
- **Paleta:** só os tokens de `src/app/tokens.css` (noite, `brand` azul, `signal` verde). Nada de cor nova na cena além desses tons.
- **Tipografia:** títulos em caixa alta sobre a cena, com halo escuro (`.lp-kage main :is(h1,h2,.lead)`) para ler por cima das placas.
- **Sem WebGL:** a cena vira um pôster estático (foto do pátio escurecida + vinheta). O texto e a navegação continuam iguais.

## Movimento

| Elemento | Comportamento | Reduzido (`prefers-reduced-motion`) |
|---|---|---|
| Câmera | Spline Catmull-Rom pelos 6 capítulos `[data-cam]`, amortecida (`damp` 4.2) | Segue o scroll sem amortecer; renderiza só quando rola |
| Entrada | Dolly de ~2 s ao abrir | Nenhuma |
| Carro | Giro lento (0,12 rad/s), leve empurrão com a velocidade do scroll; desce pelo piso ao sair do hero | Parado; a descida segue o scroll |
| Placas | Balanço, curvatura pela velocidade do scroll, somem perto da câmera | Paradas |
| Hero | Texto sai com blur e desce 16 px ao rolar (`[data-hero-exit]`) | Igual (ligado ao scroll, não ao tempo) |
| Cards da travessia | Tecido WebGL só com o cursor em cima ou rolando, e para 1,5 s depois; em repouso, só os glows CSS respiram | Foto estática, glows parados |
| Rastro do cursor | Wisp de luz segue o ponteiro | Desligado (sem loop) |

Aba oculta: tudo pausa.

## Orçamento de desempenho

| Tier | Como detecta | DPR máx | Antialias | Carro 3D | Tecido nos cards |
|---|---|---|---|---|---|
| alto | ponteiro fino | 1,5 | sim | sim | sim |
| médio | toque, ≥ 6 GB (ou não informado, caso do Safari) e ≥ 4 núcleos | 1,25 | não | sim | não |
| baixo | toque, resto; ou `saveData` | 1,0 | não | não | não |

- **Contextos WebGL:** 1 do palco + até 6 dos cards (só criados perto da tela e só em ponteiro fino). No celular, só 1.
- **DPR adaptativo:** a média de 45 frames acima de 24 ms baixa a resolução 15% (até 0,6×); abaixo de 18,5 ms ela sobe 5%, só 3 s depois da última queda. O limite de subida precisa ser alcançável a 60 Hz (o rAF não passa de ~16,7 ms), senão a escala só desce.
- **Imagens:** a cena e os cards usam `public/landing/web/*.webp` (até 1600 px). Os originais em `public/landing/` ficam como fonte e não são baixados pela landing.
- **Carro:** carregado depois do primeiro frame, em ocioso, com `import()` dos loaders (fora do bundle inicial) e Draco em worker.
- **Limpeza:** todo contexto é liberado no desmonte (`forceContextLoss` / `WEBGL_lose_context`) e o canvas é criado dentro do efeito, para o StrictMode e o HMR não acumularem contextos.

## Pronto quando

- Nenhum erro de WebGL no console, nem com a GPU desligada (cai no pôster).
- Nenhum aviso `THREE.Clock`.
- Bytes da landing: imagens abaixo de 3 MB, sem contar o carro.
- Nenhum long task acima de 200 ms depois do carregamento.
- Rolar a página inteira sem frame acima de 50 ms no desktop.
- `tsc`, `eslint src` e `pnpm test` passando.

## Gerar as imagens otimizadas

```bash
for f in garagem "garagem 2" carro-dentro estrada benjamin-zhao-5DremXTTKE0-unsplash painel-car; do
  magick "public/landing/$f.jpg" -auto-orient -resize '1600x1600>' -strip -quality 74 "public/landing/web/${f// /-}.webp"
done
```
