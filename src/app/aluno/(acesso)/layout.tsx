import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark, LogoName } from "@/components/Logo";

export const metadata: Metadata = { title: "Área do Aluno — Itacaramby", robots: { index: false } };

export default function AcessoLayout({ children }: LayoutProps<"/aluno">) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-navy p-6">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-copper/15 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-3 text-copper">
          <LogoMark className="h-8 w-auto" />
          <LogoName className="h-5 w-auto" />
        </Link>
        <div className="rounded-3xl bg-ivory p-7 shadow-2xl sm:p-9">{children}</div>
        <p className="mt-6 text-center text-xs text-ivory/50">
          <Link href="/loja#cursos" className="underline hover:text-copper">Conheça os cursos</Link> ·{" "}
          <Link href="/" className="underline hover:text-copper">Voltar ao site</Link>
        </p>
      </div>
    </main>
  );
}
