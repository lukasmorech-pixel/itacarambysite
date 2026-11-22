import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/server";

// Recebe o link do e-mail (confirmação de conta ou recuperação de senha), abre a sessão e segue para a página pedida.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next") ?? "/aluno/nova-senha";
  // Só permite voltar para páginas da Área do Aluno.
  const next = nextParam.startsWith("/aluno") && !nextParam.startsWith("//") && !nextParam.includes("\\") ? nextParam : "/aluno/nova-senha";

  const supabase = await createSessionClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  // "next" pode trazer parâmetros (ex.: /aluno/ativar?pedido=...)
  const dest = new URL(ok ? next : "/aluno/recuperar?erro=link", request.nextUrl.origin);
  return NextResponse.redirect(dest);
}
