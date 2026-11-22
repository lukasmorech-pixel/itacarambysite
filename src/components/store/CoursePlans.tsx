"use client";

import Link from "next/link";
import { brl, type Course } from "@/content/site";
import { useCart } from "@/components/store/CartProvider";

type Plan = "mensal" | "completo";

/** Cartões de compra do curso: assinatura mensal e/ou curso completo. */
export function CoursePlans({ c, dark = false }: { c: Course; dark?: boolean }) {
  const { add, items } = useCart();
  const inCart = items.find((i) => i.type === "curso" && i.id === c.id);
  const buy = (p: Plan, price: number) =>
    add({ type: "curso", id: c.id, plan: p, name: `${c.title} — ${p === "mensal" ? "assinatura mensal" : "curso completo"}`, price_cents: price, image_url: c.image_url });

  const box = (active: boolean) =>
    `rounded-2xl border p-5 ${active ? "border-copper bg-copper/10" : dark ? "border-ivory/15 bg-white/5" : "border-navy/10"}`;
  const muted = dark ? "text-ivory/60" : "text-ink/55";
  const price = dark ? "text-ivory" : "text-navy";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {c.price_monthly_cents != null && (
          <div className={box(inCart?.plan === "mensal")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-aqua">Assinatura mensal</p>
            <p className={`mt-2 font-serif text-3xl ${price}`}>
              {brl(c.price_monthly_cents)}
              <span className={`text-sm ${muted}`}> /mês</span>
            </p>
            <p className={`mt-1 text-xs ${muted}`}>Acesso liberado enquanto a assinatura estiver ativa.</p>
            <button
              onClick={() => buy("mensal", c.price_monthly_cents!)}
              className={`mt-4 w-full rounded-full py-2.5 text-xs font-semibold uppercase tracking-wider ${dark ? "bg-ivory text-navy hover:bg-white" : "bg-navy text-ivory hover:bg-navy-2"}`}
            >
              {inCart?.plan === "mensal" ? "No carrinho" : "Assinar"}
            </button>
          </div>
        )}
        {c.price_full_cents != null && (
          <div className={box(inCart?.plan === "completo")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-aqua">Curso completo</p>
            <p className={`mt-2 font-serif text-3xl ${price}`}>{brl(c.price_full_cents)}</p>
            <p className={`mt-1 text-xs ${muted}`}>Pagamento único · acesso por {Math.round(c.access_days / 30)} meses.</p>
            <button
              onClick={() => buy("completo", c.price_full_cents!)}
              className="mt-4 w-full rounded-full bg-copper py-2.5 text-xs font-semibold uppercase tracking-wider text-navy hover:brightness-105"
            >
              {inCart?.plan === "completo" ? "No carrinho" : "Comprar"}
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 h-5">
        {inCart && (
          <Link href="/loja/carrinho" className="text-xs font-semibold text-aqua underline">
            ✓ No carrinho — finalizar pedido
          </Link>
        )}
      </div>
    </div>
  );
}
