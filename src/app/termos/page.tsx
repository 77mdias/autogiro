import type { Metadata } from "next";
import Link from "next/link";
import { ContatoAutoGiro, PaginaLegal, RESPONSAVEL, Secao } from "@/components/pagina-legal";
import { FAIXAS, MAX_VENDEDORES, TRIAL_DIAS } from "@/lib/plano";

export const metadata: Metadata = { title: "Termos de uso" };

// Texto técnico, a partir do que o app faz hoje (docs/pagamentos-asaas.md, docs/arquitetura.md).
// Precisa de revisão jurídica: foro, reembolso e limites de responsabilidade ficaram para ela.
export default function TermosPage() {
  const contato = <ContatoAutoGiro mensagem="Olá! Tenho uma dúvida sobre os termos de uso do AutoGiro." />;

  return (
    <PaginaLegal titulo="Termos de uso" atualizada="12 de novembro de 2026">
      <Secao titulo="Sobre estes termos">
        <p>
          O AutoGiro é desenvolvido pela 77mdevseven. O responsável pelo AutoGiro é {RESPONSAVEL}. Ao criar uma conta, você
          concorda com estes termos e com a{" "}
          <Link href="/privacidade" className="text-brand underline underline-offset-4">
            política de privacidade
          </Link>
          .
        </p>
      </Secao>

      <Secao titulo="O serviço">
        <p>
          O AutoGiro é um app para garagens de carros usados: cadastro do estoque, vitrine pública da loja e pedidos de simulação de
          financiamento feitos pelos interessados.
        </p>
        <p>
          O AutoGiro não vende carros, não participa da negociação entre a loja e o comprador e não concede nem aprova
          financiamento. A simulação é um pedido de contato que vai para a loja; a análise de crédito é feita pela loja e por quem
          ela escolher.
        </p>
      </Secao>

      <Secao titulo="Conta e equipe">
        <p>
          Cada conta participa de uma loja. Quem cria a loja é o gestor: responde por ela, pelos dados que cadastra e pela equipe
          que convida (até {MAX_VENDEDORES} vendedores). Cada pessoa usa a própria conta e cuida do próprio acesso. O gestor pode
          desativar um vendedor a qualquer momento; os carros e clientes dele voltam para o gestor.
        </p>
      </Secao>

      <Secao titulo="Teste grátis">
        <p>
          A loja nova tem {TRIAL_DIAS} dias grátis, sem cartão. O teste é um por número de WhatsApp: uma loja criada com um WhatsApp
          que já teve teste começa sem ele e precisa assinar para usar o painel e a vitrine.
        </p>
      </Secao>

      <Secao titulo="Plano e pagamento">
        <p>A mensalidade depende de quantos vendedores ativos a loja tem (o gestor e os convites em aberto não contam):</p>
        <ul className="grid list-disc gap-1 pl-5">
          {FAIXAS.map((f) => (
            <li key={f.rotulo}>
              {f.rotulo}: R$ {f.reais} por mês
            </li>
          ))}
        </ul>
        <p>
          Acima de {MAX_VENDEDORES} vendedores, fale com a AutoGiro. A cobrança é feita pelo Asaas. Quando a loja muda de faixa, o
          valor novo vale a partir da próxima cobrança, e Minha loja avisa antes.
        </p>
        <p>
          Com o pagamento em atraso, o painel e a vitrine ficam pausados e a loja não recebe novas simulações até a fatura ser
          paga. Os dados continuam guardados.
        </p>
      </Secao>

      <Secao titulo="Cancelar">
        <p>
          Para cancelar a assinatura, fale com a AutoGiro pelo {contato} ou exclua a conta em Minha loja, o que cancela a
          assinatura no Asaas e apaga a loja. O cancelamento vale para as cobranças seguintes.
        </p>
      </Secao>

      <Secao titulo="O que a loja se compromete a fazer">
        <ul className="grid list-disc gap-1 pl-5">
          <li>Anunciar carros que existem, com preço, ano, quilometragem e fotos verdadeiros.</li>
          <li>Usar só fotos que a loja tem o direito de publicar.</li>
          <li>
            Usar os dados e a CNH de quem pede simulação só para a análise de financiamento e o contato sobre aquele pedido, como
            manda a LGPD.
          </li>
          <li>Não usar o AutoGiro para nada ilegal nem para enganar compradores.</li>
        </ul>
        <p>Se isso não for cumprido, a AutoGiro pode suspender a vitrine ou a conta, avisando a loja.</p>
      </Secao>

      <Secao titulo="O que a AutoGiro se compromete a fazer">
        <p>
          Manter o app funcionando e os dados guardados com cuidado, como descrito na política de privacidade. O app pode ficar fora
          do ar por manutenção ou falha de fornecedores; nesses casos, trabalhamos para voltar o quanto antes.
        </p>
      </Secao>

      <Secao titulo="Mudanças nestes termos">
        <p>
          Quando estes termos mudarem, a data no topo muda e, se a mudança afetar a loja, avisamos no app antes de ela valer.
          Dúvidas: {contato}.
        </p>
      </Secao>
    </PaginaLegal>
  );
}
