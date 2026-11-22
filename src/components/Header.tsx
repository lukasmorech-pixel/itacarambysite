"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark, LogoName } from "@/components/Logo";
import { SITE_NAME, whatsappLink } from "@/content/site";
import { useCart } from "@/components/store/CartProvider";

const links = [
  { href: "/#inicio", label: "Início" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#modelo-3d", label: "3D" },
  { href: "/#galeria", label: "Galeria" },
  { href: "/loja", label: "Loja" },
  { href: "/aluno", label: "Área do aluno" },
  { href: "/#contato", label: "Contato" },
];

function CartButton({ onClick }: { onClick?: () => void }) {
  const { count, ready } = useCart();
  return (
    <Link href="/loja/carrinho" onClick={onClick} aria-label={`Carrinho (${count} itens)`} className="relative text-ivory transition hover:text-copper">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
        <circle cx="10" cy="20" r="1.3" />
        <circle cx="17" cy="20" r="1.3" />
      </svg>
      {ready && count > 0 && (
        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-copper px-1 text-[10px] font-bold text-navy">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Header({ whatsapp }: { whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors ${
        scrolled || open ? "bg-navy/95 shadow-lg backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/#inicio" className="flex items-center gap-3 text-copper" aria-label={`${SITE_NAME} — início`}>
          <LogoMark className="h-8 w-auto" />
          <LogoName className="h-5 w-auto sm:h-6" title={SITE_NAME} />
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.15em] text-ivory/80 xl:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-copper">
              {l.label}
            </Link>
          ))}
          <CartButton />
          <a
            href={whatsappLink(whatsapp, "Olá! Gostaria de enviar um caso para o laboratório.")}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-full bg-copper px-5 py-2.5 text-navy transition hover:bg-ivory"
          >
            Enviar caso
          </a>
        </nav>

        <div className="flex items-center gap-5 xl:hidden">
          <CartButton />
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="text-ivory"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-ivory/10 px-5 pb-6 pt-2 xl:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-semibold uppercase tracking-[0.15em] text-ivory/85"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
