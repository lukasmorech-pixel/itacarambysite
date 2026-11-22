"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { brl, type Course, type Product } from "@/content/site";
import { useCart } from "@/components/store/CartProvider";
import { CoursePlans } from "@/components/store/CoursePlans";
import { LogoMark } from "@/components/Logo";

type Tab = "modelos" | "cursos";

function Added({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Link href="/loja/carrinho" className="text-xs font-semibold text-aqua underline">
      ✓ No carrinho — ver carrinho
    </Link>
  );
}

function ProductCard({ p }: { p: Product }) {
  const { add, items } = useCart();
  const inCart = items.some((i) => i.key === `produto:${p.id}`);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-ivory shadow-sm ring-1 ring-navy/5">
      <div className="relative grid aspect-[16/10] place-items-center bg-navy">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.name} fill sizes="(min-width:1024px) 360px, 90vw" className="object-cover" />
        ) : (
          <LogoMark className="w-24 text-copper" />
        )}
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
            p.kind === "digital" ? "bg-aqua text-navy" : "bg-copper text-navy"
          }`}
        >
          {p.kind === "digital" ? "Arquivo digital" : "Modelo físico"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-lg text-navy">{p.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/65">{p.description}</p>
        <p className="mt-3 text-xs text-ink/50">
          {p.kind === "digital" ? "Download liberado após a confirmação do pagamento." : "Envio pelo correio ou retirada no laboratório."}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="font-serif text-2xl text-navy">{brl(p.price_cents)}</p>
          <button
            onClick={() => add({ type: "produto", id: p.id, kind: p.kind, name: p.name, price_cents: p.price_cents, image_url: p.image_url })}
            className="rounded-full bg-navy px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-navy-2"
          >
            {inCart && p.kind === "digital" ? "Adicionado" : "Adicionar"}
          </button>
        </div>
        <div className="mt-2 h-4">
          <Added show={inCart} />
        </div>
      </div>
    </article>
  );
}

function CourseCard({ c }: { c: Course }) {
  return (
    <article className="grid overflow-hidden rounded-3xl bg-ivory shadow-sm ring-1 ring-navy/5 lg:grid-cols-[1fr_1.1fr]">
      <Link href={`/loja/cursos/${c.slug}`} className="group relative block min-h-64 bg-navy">
        {c.image_url && <Image src={c.image_url} alt={c.title} fill sizes="(min-width:1024px) 520px, 90vw" className="object-cover opacity-90 transition group-hover:opacity-100" />}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-7 text-ivory">
          <span className="rounded-full bg-copper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-navy">Curso online</span>
          <h3 className="mt-3 font-serif text-3xl">{c.title}</h3>
          <p className="mt-1 text-sm text-ivory/75">{c.subtitle}</p>
        </div>
      </Link>
      <div className="p-7 sm:p-9">
        <p className="leading-relaxed text-ink/75">{c.description}</p>
        <ul className="mt-5 grid gap-2 text-sm text-ink/80 sm:grid-cols-2">
          {c.highlights.map((h) => (
            <li key={h} className="flex gap-2">
              <span className="text-copper">✓</span> {h}
            </li>
          ))}
        </ul>
        <Link href={`/loja/cursos/${c.slug}`} className="mt-5 inline-block text-sm font-semibold text-aqua underline">
          Ver conteúdo do curso, aula por aula →
        </Link>
        <div className="mt-6">
          <CoursePlans c={c} />
        </div>
      </div>
    </article>
  );
}

export function StoreTabs({ products, courses }: { products: Product[]; courses: Course[] }) {
  const [tab, setTab] = useState<Tab>("modelos");

  useEffect(() => {
    // permite links diretos para /loja#cursos
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.hash === "#cursos") setTab("cursos");
  }, []);

  const select = (t: Tab) => {
    setTab(t);
    history.replaceState(null, "", t === "cursos" ? "#cursos" : "#modelos");
  };

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "modelos", label: "Modelos de estudo", n: products.length },
    { id: "cursos", label: "Cursos", n: courses.length },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <div role="tablist" aria-label="Seções da loja" className="flex gap-2 border-b border-navy/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => select(t.id)}
            className={`-mb-px border-b-2 px-5 py-3 text-sm font-semibold transition ${
              tab === t.id ? "border-copper text-navy" : "border-transparent text-ink/50 hover:text-navy"
            }`}
          >
            {t.label} <span className="ml-1 rounded-full bg-navy/5 px-2 text-xs">{t.n}</span>
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "modelos" &&
          (products.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <p className="text-ink/60">Em breve novos modelos de estudo.</p>
          ))}
        {tab === "cursos" &&
          (courses.length ? (
            <div className="grid gap-8">
              {courses.map((c) => (
                <CourseCard key={c.id} c={c} />
              ))}
            </div>
          ) : (
            <p className="text-ink/60">Em breve novos cursos.</p>
          ))}
      </div>
    </section>
  );
}
