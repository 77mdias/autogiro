import type { Metadata } from "next";
import Link from "next/link";
import { ContatoAutoGiro, PaginaLegal, RESPONSAVEL, Secao } from "@/components/pagina-legal";

export const metadata: Metadata = { title: "Política de privacidade" };

// Texto técnico, a partir do que o app faz hoje (docs/arquitetura.md). Precisa de revisão jurídica.
export default function PrivacidadePage() {
  const contato = <ContatoAutoGiro mensagem="Olá! Tenho um pedido sobre meus dados no AutoGiro." />;

  return (
    <PaginaLegal titulo="Política de privacidade" atualizada="12 de novembro de 2026">
      <Secao titulo="Quem somos">
        <p>
          O AutoGiro é um app para garagens de carros usados (estoque, vitrine e pedidos de simulação de financiamento),
          desenvolvido pela 77mdevseven. O responsável pelo AutoGiro e pelos dados da conta e da loja (o controlador) é{" "}
          {RESPONSAVEL}. Dúvidas e pedidos sobre seus dados: {contato}.
        </p>
      </Secao>

      <Secao titulo="Dados da loja e da equipe">
        <p>
          Para criar a conta e a loja guardamos nome, e-mail (ou a conta Google usada para entrar), o nome e o WhatsApp da loja, os
          carros e as fotos cadastrados e as vendas registradas. Senhas são guardadas só como hash. Usamos esses dados para o app
          funcionar e para cobrar a mensalidade.
        </p>
      </Secao>

      <Secao titulo="Dados de quem pede uma simulação">
        <p>
          Quem pede simulação na vitrine informa nome, telefone, entrada e valor a financiar e pode enviar a foto da CNH, com
          autorização. Esses dados vão para a loja, que os usa para a análise de financiamento. A CNH fica num armazenamento privado,
          só a loja abre (por um link que vale 5 minutos) e ela é apagada automaticamente em 90 dias.
        </p>
      </Secao>

      <Secao titulo="Pagamento">
        <p>
          A mensalidade é cobrada pelo Asaas. O número do cartão e o CPF ou CNPJ são informados direto ao Asaas, não ao AutoGiro.
          Guardamos os avisos de pagamento que o Asaas nos envia, como chegam: podem trazer os identificadores do cliente e da
          assinatura no Asaas, valores, datas, a forma de pagamento e, no cartão, a bandeira e os últimos dígitos.
        </p>
      </Secao>

      <Secao titulo="Com quem os dados ficam">
        <p>
          Usamos fornecedores para hospedar e operar o app: Vercel (hospedagem), Supabase (banco de dados), Cloudflare (fotos e
          CNHs), Resend (e-mails da conta), Asaas (cobrança) e Google (entrar com Google). Não vendemos dados.
        </p>
      </Secao>

      <Secao titulo="Excluir a conta">
        <p>
          Em Minha loja › Excluir minha conta, ou pelo {contato}. Ao excluir a conta do gestor, apagamos a loja, os carros e as fotos,
          os interessados e as CNHs, as vendas e o acesso da equipe, e a assinatura é cancelada. Ao excluir a conta de um vendedor,
          os carros e clientes dele passam para o gestor da loja.
        </p>
        <p>
          Depois da exclusão, guardamos o número do WhatsApp da loja, separado dos dados apagados, para registrar que o teste grátis
          já foi usado e evitar que ele se repita. Os avisos de pagamento do Asaas ficam pelo prazo exigido por lei. Conta
          sem loja, inclusive a de vendedor desativado, é excluída na tela de criar loja, com o mesmo botão.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>
          Pela LGPD, você pode pedir para confirmar se tratamos seus dados, acessá-los, corrigi-los, levá-los a outro serviço ou
          apagá-los, e saber com quem são compartilhados. Peça pelo {contato}.
        </p>
      </Secao>
      <p className="text-sm text-ink-3">
        Veja também os{" "}
        <Link href="/termos" className="underline underline-offset-4">
          termos de uso
        </Link>
        .
      </p>
    </PaginaLegal>
  );
}
