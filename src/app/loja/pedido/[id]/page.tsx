import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/server";
import { getContent } from "@/lib/content";
import { brl, whatsappLink } from "@/content/site";
import { ClearCart } from "./ClearCart";

export const instant = false;
export const metadata = { title: "Pedido — Itacaramby", robots: { index: false } };

type Order = {
  id: string;
  number: number;
  status: "pendente" | "pago" | "enviado" | "entregue" | "cancelado";
  created_at: string;
  customer_name: string;
  delivery: "envio" | "retirada" | "nenhuma";
  address: Record<string, string> | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  items: { name: string; type: string; kind: string | null; plan: string | null; unit_price_cents: number; quantity: number }[];
};

const STATUS: Record<Order["status"], [string, string]> = {
  pendente: ["Aguardando pagamento", "bg-amber-100 text-amber-900"],
  pago: ["Pagamento confirmado", "bg-green-100 text-green-900"],
  enviado: ["Enviado", "bg-sky-100 text-sky-900"],
  entregue: ["Entregue", "bg-green-100 text-green-900"],
  cancelado: ["Cancelado", "bg-red-100 text-red-900"],
};

const UUID = /^[0-9a-f-]{36}$/i;

export default async function PedidoPage({ params, searchParams }: PageProps<"/loja/pedido/[id]">) {
  const { id } = await params;
  const { t, novo } = await searchParams;
  const token = typeof t === "string" ? t : "";
  if (!UUID.test(id) || !UUID.test(token)) notFound();

  const { data } = await createPublicClient().rpc("ita_get_order", { p_id: id, p_token: token });
  if (!data) notFound();
  const o = data as Order;
  const { settings } = await getContent();
  const [label, cls] = STATUS[o.status];
  const msg = `Olá! Fiz o pedido nº ${o.number} na loja do site (total ${brl(o.total_cents)}). Como faço o pagamento?`;
  const hasCourse = o.items.some((i) => i.type === "curso");
  const hasDigital = o.items.some((i) => i.kind === "digital");

  return (
    <>
      {novo === "1" && <ClearCart />}
      <div className="bg-navy pb-10 pt-32 text-ivory">
        <div className="mx-auto max-w-4xl px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">Pedido nº {o.number}</p>
          <h1 className="mt-2 font-serif text-4xl">{novo === "1" ? `Obrigado, ${o.customer_name.split(" ")[0]}!` : "Seu pedido"}</h1>
          <span className={`mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${cls}`}>{label}</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 px-5 py-10">
        {o.status === "pendente" && (
          <section className="rounded-2xl border-2 border-copper/50 bg-white p-6">
            <h2 className="font-serif text-xl text-navy">Próximo passo: pagamento</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              Recebemos seu pedido. O pagamento online (Pix e cartão) estará disponível em breve. Por enquanto, envie o número do pedido
              pelo WhatsApp que passamos os dados para pagamento e confirmamos tudo por lá.
            </p>
            <a
              href={whatsappLink(settings.contact.whatsapp, msg)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full bg-[#25d366] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white"
            >
              Enviar pedido nº {o.number} pelo WhatsApp
            </a>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/5">
          <h2 className="mb-4 font-serif text-xl text-navy">Itens</h2>
          <ul className="divide-y divide-navy/10 text-sm">
            {o.items.map((i, k) => (
              <li key={k} className="flex justify-between gap-4 py-3">
                <span>
                  {i.quantity > 1 && `${i.quantity}× `}
                  {i.name}
                </span>
                <span className="font-semibold text-navy">{brl(i.unit_price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid gap-1 border-t border-navy/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>{brl(o.subtotal_cents)}</dd></div>
            {o.delivery !== "nenhuma" && (
              <div className="flex justify-between"><dt className="text-ink/60">Frete</dt><dd>{o.shipping_cents ? brl(o.shipping_cents) : "Retirada no laboratório"}</dd></div>
            )}
            <div className="flex justify-between text-base font-semibold text-navy"><dt>Total</dt><dd>{brl(o.total_cents)}</dd></div>
          </dl>
        </section>

        {o.delivery === "envio" && o.address && (
          <section className="rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-navy/5">
            <h2 className="mb-2 font-serif text-xl text-navy">Entrega</h2>
            <p className="text-ink/75">
              {o.address.street}, {o.address.number} {o.address.complement} — {o.address.district}, {o.address.city}/{o.address.state} · CEP {o.address.cep}
            </p>
          </section>
        )}
        {o.delivery === "retirada" && (
          <section className="rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-navy/5">
            <h2 className="mb-2 font-serif text-xl text-navy">Retirada</h2>
            <p className="text-ink/75">{settings.store.pickupNote}</p>
          </section>
        )}

        {(hasCourse || hasDigital) && (
          <section className="rounded-2xl bg-aqua/10 p-6 text-sm text-navy/85">
            {hasCourse && o.status === "pendente" && (
              <p>📚 Assim que o pagamento for confirmado, o curso é liberado na <strong>Área do Aluno</strong> para o e-mail deste pedido.</p>
            )}
            {hasCourse && (o.status === "pago" || o.status === "entregue" || o.status === "enviado") && (
              <div>
                <p className="font-semibold">📚 Seu curso está liberado!</p>
                <p className="mt-1">
                  Entre na Área do Aluno com o e-mail deste pedido. Se preferir usar outra conta, clique em “Ativar na minha conta”.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/aluno" className="rounded-full bg-navy px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory">
                    Ir para a Área do Aluno
                  </Link>
                  <Link
                    href={`/aluno/ativar?pedido=${o.id}&t=${token}`}
                    className="rounded-full border border-navy/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-navy"
                  >
                    Ativar na minha conta
                  </Link>
                </div>
              </div>
            )}
            {hasDigital && <p className="mt-2">💾 Os arquivos digitais ficam disponíveis para download após a confirmação do pagamento.</p>}
          </section>
        )}

        <p className="text-center text-xs text-ink/50">
          Guarde o link desta página para acompanhar seu pedido. · <Link href="/loja" className="underline">Voltar à loja</Link>
        </p>
      </div>
    </>
  );
}
