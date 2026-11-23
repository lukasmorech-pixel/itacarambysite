import { Suspense } from "react";
import { AdminNotice } from "@/components/admin/AdminNotice";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { logout } from "../actions";
import { LogoMark } from "@/components/Logo";

export const instant = false;

const nav = [
  { href: "/admin", label: "Início" },
  { href: "/admin/mensagens", label: "Mensagens" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/galeria", label: "Galeria" },
  { href: "/admin/parceiros", label: "Parceiros e depoimentos" },
  { href: "/admin/textos", label: "Textos e contatos" },
  { href: "/admin/loja/pedidos", label: "Loja · Pedidos" },
  { href: "/admin/loja/produtos", label: "Loja · Modelos" },
  { href: "/admin/loja/cursos", label: "Loja · Cursos" },
  { href: "/admin/alunos", label: "Alunos" },
];

export default async function PainelLayout({ children }: LayoutProps<"/admin">) {
  const { supabase, email } = await requireAdmin();
  const [msgs, orders] = await Promise.all([
    supabase.from("ita_messages").select("id", { count: "exact", head: true }).eq("read", false),
    supabase.from("ita_orders").select("id", { count: "exact", head: true }).eq("status", "pendente"),
  ]);
  const badge: Record<string, number> = { "/admin/mensagens": msgs.count ?? 0, "/admin/loja/pedidos": orders.count ?? 0 };

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-navy text-ivory lg:min-h-screen">
        <div className="flex items-center gap-3 px-5 py-5 text-copper">
          <LogoMark className="h-7 w-auto" />
          <span className="font-serif text-lg text-ivory">Painel</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:overflow-visible">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-ivory/80 hover:bg-white/10 hover:text-ivory">
              {n.label}
              {!!badge[n.href] && <span className="rounded-full bg-copper px-2 text-xs font-bold text-navy">{badge[n.href]}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-3 text-xs text-ivory/50 lg:py-4">
          <p className="truncate">{email}</p>
          <div className="mt-3 flex gap-3">
            <a href="/" target="_blank" className="underline hover:text-ivory">Ver site</a>
            <Link href="/admin/nova-senha" className="underline hover:text-ivory">Trocar senha</Link>
            <form action={logout}>
              <button className="underline hover:text-ivory">Sair</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl p-5 sm:p-8">
        <Suspense fallback={null}>
          <AdminNotice />
        </Suspense>
        {children}
      </main>
    </div>
  );
}
