import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

/** Garante que quem está acessando é um administrador. Use em toda página e ação do painel. */
export async function requireAdmin() {
  await connection(); // sempre por requisição (sessão do usuário)
  const supabase = await createSessionClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) redirect("/admin/login");

  const { data: isAdmin, error } = await supabase.rpc("ita_is_admin");
  if (error || !isAdmin) redirect("/admin/login?erro=sem-permissao");

  return { supabase, email: (claims.email as string | undefined) ?? "" };
}

/**
 * Erro de validação numa ação do painel: volta para a mesma tela com o aviso em ?erro=
 * (em vez de derrubar a página). Mostrado pelo AdminNotice do layout.
 */
export async function fail(message: string): Promise<never> {
  const h = await headers();
  let dest = "/admin";
  try {
    const u = new URL(h.get("referer") ?? "");
    if (u.pathname.startsWith("/admin")) {
      u.searchParams.delete("ok");
      u.searchParams.set("erro", message.slice(0, 300));
      dest = u.pathname + u.search;
    }
  } catch {
    // sem referer: volta ao início do painel
  }
  redirect(dest);
}
