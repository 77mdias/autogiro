import { createCn } from "cn/config"

// Ensina ao merge que a escala da Hallmark (tokens.css) é tamanho de fonte; sem isso
// `text-title` + `text-ink` seriam tratados como duas cores e um sumiria.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["md", "display", "display-s", "section", "title", "lead"] }],
    },
  },
})

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const brlInteiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
// Preço de carro é quase sempre redondo: "R$ 124.900" lê melhor que "R$ 124.900,00"
export const formatBRL = (centavos: number) => (centavos % 100 === 0 ? brlInteiro : brl).format(centavos / 100)
