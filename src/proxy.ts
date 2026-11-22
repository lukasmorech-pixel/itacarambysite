import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

// Renova a sessão do Supabase no painel e na Área do Aluno, e manda quem não está logado para o login certo.
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet, headers) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const path = request.nextUrl.pathname;
  const isAluno = path === "/aluno" || path.startsWith("/aluno/");
  const publicPaths = isAluno
    ? ["/aluno/entrar", "/aluno/recuperar", "/aluno/auth/callback"]
    : ["/admin/login", "/admin/recuperar", "/admin/auth/callback"];
  if (!data?.claims && !publicPaths.includes(path)) {
    const url = request.nextUrl.clone();
    url.search = "";
    if (isAluno) {
      url.pathname = "/aluno/entrar";
      // volta para onde o aluno queria ir depois de entrar
      url.searchParams.set("voltar", path + request.nextUrl.search);
    } else {
      url.pathname = "/admin/login";
    }
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/aluno", "/aluno/:path*"],
};
