import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { whatsappUrl } from "@/lib/masks";

export const metadata: Metadata = { title: "Política de privacidade" };

// Texto técnico, a partir do que o app faz hoje (docs/arquitetura.md). Precisa de revisão jurídica.
const ATUALIZADA = "12 de novembro de 2026";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-3">
      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      <div className="grid grid-cols-1 gap-3 text-ink-2">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  const whatsapp = process.env.AUTOGIRO_WHATSAPP;
  const contato = whatsapp ? (
    <a href={whatsappUrl(whatsapp, "Olá! Tenho um pedido sobre meus dados no AutoGiro.")} target="_blank" rel="noopener" className="text-brand underline underline-offset-4">
      WhatsApp da AutoGiro
    </a>
  ) : (
    "WhatsApp da AutoGiro"
  );

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex h-16 w-full max-w-(--container) items-center justify-between px-4 lg:h-20 lg:px-(--gutter)">
          <Link href="/" aria-label="AutoGiro, página inicial" className="rounded-card">
            <Wordmark />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-8 px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-2 border-b border-rule pb-6">
          <h1 className="font-display text-3xl font-semibold">Política de privacidade</h1>
          <p className="text-sm text-ink-3">Atualizada em {ATUALIZADA}.</p>
        </div>

        <Secao titulo="Quem somos">
          <p>
            O AutoGiro é um app da 77dev para garagens de carros usados: estoque, vitrine e pedidos de simulação de financiamento. A
            77dev é a controladora dos dados da conta e da loja. Dúvidas e pedidos sobre seus dados: {contato}.
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
            já foi usado e evitar que ele se repita. Os avisos de pagamento do Asaas ficam pelo prazo exigido por lei. Vendedor
            desativado ou conta sem loja, que não entram no painel, pedem a exclusão pelo {contato}.
          </p>
        </Secao>

        <Secao titulo="Seus direitos">
          <p>
            Pela LGPD, você pode pedir para confirmar se tratamos seus dados, acessá-los, corrigi-los, levá-los a outro serviço ou
            apagá-los, e saber com quem são compartilhados. Peça pelo {contato}.
          </p>
        </Secao>
      </main>
    </div>
  );
}
