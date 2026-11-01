import { createCn } from "cn/config"

// Ensina ao merge que a escala do DESIGN.md é tamanho de fonte; sem isso
// `text-caption` + `text-primary` seriam tratados como duas cores e um sumiria.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-md", "sub-lg", "sub-md", "sub-sm", "body-lg", "body-md", "caption"] }],
    },
  },
})

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
export const formatBRL = (centavos: number) => brl.format(centavos / 100)
