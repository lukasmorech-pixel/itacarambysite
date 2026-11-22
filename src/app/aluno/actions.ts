"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createSessionClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/aluno";

export type FormState = { ok?: boolean; error?: string; info?: string };

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const UUID = /^[0-9a-f-]{36}$/i;

/** Só deixa voltar para páginas da própria Área do Aluno. */
function safeNext(v: string) {
  return v.startsWith("/aluno") && !v.startsWith("//") && !v.includes("\\") ? v : "/aluno";
}

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "itacaramby.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function passwordError(message: string) {
  if (/weak|pwned|leaked|strength|characters/i.test(message)) return "Senha fraca ou já vazada na internet. Escolha outra, com pelo menos 8 caracteres.";
  if (/rate|too many|seconds/i.test(message)) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  return null;
}

// ---------- ENTRAR ----------
export async function studentLogin(_prev: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  const password = String(f.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) return { error: "Confirme seu e-mail pelo link que enviamos antes de entrar." };
    return { error: passwordError(error.message) ?? "E-mail ou senha incorretos." };
  }
  redirect(safeNext(str(f, "voltar", 300)));
}

// ---------- CRIAR CONTA ----------
export async function studentSignup(_prev: FormState, f: FormData): Promise<FormState> {
  const name = str(f, "name", 120);
  const email = str(f, "email").toLowerCase();
  const password = String(f.get("password") ?? "");
  if (name.length < 2) return { error: "Informe seu nome." };
  if (!email.includes("@")) return { error: "Informe um e-mail válido." };
  if (password.length < 8) return { error: "Use uma senha com pelo menos 8 caracteres." };
  const next = safeNext(str(f, "voltar", 300));

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${await siteOrigin()}/aluno/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return { error: "Já existe uma conta com este e-mail. Use “Entrar” ou “Esqueci minha senha”." };
    return { error: passwordError(error.message) ?? "Não foi possível criar a conta. Tente de novo." };
  }
  // Com confirmação de e-mail ligada, a sessão só abre depois do link.
  if (!data.session) return { ok: true, info: `Enviamos um link de confirmação para ${email}. Abra o e-mail e clique no link para entrar.` };
  redirect(next);
}

export async function studentLogout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/aluno/entrar");
}

// ---------- SENHA ----------
export async function studentRequestReset(_prev: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email").toLowerCase();
  if (!email.includes("@")) return { error: "Informe um e-mail válido." };
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/aluno/auth/callback?next=/aluno/nova-senha`,
  });
  if (error && /rate|too many|seconds/i.test(error.message)) return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  if (error) console.error("Erro ao pedir recuperação (aluno):", error.message);
  return { ok: true };
}

export async function studentUpdatePassword(_prev: FormState, f: FormData): Promise<FormState> {
  const password = String(f.get("password") ?? "");
  if (password.length < 8) return { error: "Use pelo menos 8 caracteres." };
  if (password !== String(f.get("confirm") ?? "")) return { error: "As duas senhas não são iguais." };
  const { supabase } = await requireStudent("/aluno/nova-senha");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/same|different/i.test(error.message)) return { error: "A nova senha precisa ser diferente da anterior." };
    return { error: passwordError(error.message) ?? "Não foi possível trocar a senha. Tente de novo." };
  }
  redirect("/aluno?senha=alterada");
}

// ---------- PEDIDO -> ACESSO ----------
/** Liga as matrículas de um pedido pago (link com token) à conta logada. */
export async function claimOrder(f: FormData) {
  const id = str(f, "id", 64);
  const token = str(f, "t", 64);
  if (!UUID.test(id) || !UUID.test(token)) redirect("/aluno?ativar=erro");
  const { supabase } = await requireStudent(`/aluno/ativar?pedido=${id}&t=${token}`);
  const { data, error } = await supabase.rpc("ita_claim_order", { p_id: id, p_token: token });
  if (error) redirect("/aluno?ativar=erro");
  redirect(`/aluno?ativar=${Number(data) > 0 ? "ok" : "nada"}`);
}

// ---------- PROGRESSO ----------
export async function toggleLesson(f: FormData) {
  const lessonId = str(f, "lesson_id", 64);
  if (!UUID.test(lessonId)) return;
  const { supabase, user } = await requireStudent();
  if (f.get("done") === "1") {
    await supabase.from("ita_lesson_progress").delete().eq("lesson_id", lessonId).eq("user_id", user.id);
  } else {
    const { error } = await supabase.from("ita_lesson_progress").upsert({ lesson_id: lessonId, user_id: user.id }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    if (error) console.error("Erro ao marcar aula:", error.message);
  }
  const next = str(f, "next", 300);
  if (next.startsWith("/aluno/")) redirect(next);
  refresh();
}
