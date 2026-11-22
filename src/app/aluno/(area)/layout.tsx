import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark, LogoName } from "@/components/Logo";
import { requireStudent } from "@/lib/aluno";
import { studentLogout } from "../actions";

export const metadata: Metadata = { title: "Área do Aluno — Itacaramby", robots: { index: false } };
export const instant = false;

export default async function AreaLayout({ children }: LayoutProps<"/aluno">) {
  const { user } = await requireStudent();
  const first = (user.name || user.email).split(/[ @]/)[0];
  return (
    <div className="flex min-h-screen flex-col bg-porcelain">
      <header className="sticky top-0 z-40 bg-navy text-ivory shadow-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/aluno" className="flex items-center gap-2 text-copper" aria-label="Área do Aluno — início">
            <LogoMark className="h-7 w-auto" />
            <LogoName className="hidden h-4 w-auto sm:block" />
          </Link>
          <span className="hidden rounded-full border border-ivory/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory/70 sm:inline">
            Área do Aluno
          </span>
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/aluno" className="hover:text-copper">Meus cursos</Link>
            <Link href="/loja#cursos" className="hidden hover:text-copper sm:inline">Loja</Link>
            <span className="hidden text-ivory/50 md:inline">Olá, {first}</span>
            <form action={studentLogout}>
              <button className="rounded-full border border-ivory/25 px-3 py-1.5 text-xs hover:bg-white/10">Sair</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="py-8 text-center text-xs text-ink/45">
        Itacaramby · Laboratório de Prótese Dentária · <Link href="/" className="underline">site</Link>
      </footer>
    </div>
  );
}
