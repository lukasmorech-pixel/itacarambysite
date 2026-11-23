"use server";

import { refresh } from "next/cache";
import { fail, requireAdmin } from "@/lib/admin";

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const UUID = /^[0-9a-f-]{36}$/i;
const PLANS = ["cortesia", "completo", "mensal"];

/** Libera (ou renova) o acesso de um e-mail a um curso, sem pedido. */
export async function grantAccess(f: FormData) {
  const { supabase } = await requireAdmin();
  const email = str(f, "email").toLowerCase();
  const courseId = str(f, "course_id", 64);
  const plan = str(f, "plan", 20);
  const days = Number(str(f, "days", 5));
  if (!email.includes("@")) return fail("Informe um e-mail válido.");
  if (!UUID.test(courseId)) return fail("Escolha o curso.");
  if (!PLANS.includes(plan)) return fail("Plano inválido.");
  const expires = days > 0 ? new Date(Date.now() + Math.min(days, 3650) * 86400000).toISOString() : null;
  const { error } = await supabase.from("ita_enrollments").upsert(
    { course_id: courseId, email, name: str(f, "name", 120), plan, status: "ativo", expires_at: expires, order_id: null },
    { onConflict: "course_id,email" },
  );
  if (error) return fail(error.message);
  refresh();
}

export async function extendAccess(f: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(f, "id", 64);
  const days = Math.max(1, Math.min(3650, Number(str(f, "days", 5)) || 30));
  const { data: e } = await supabase.from("ita_enrollments").select("expires_at").eq("id", id).maybeSingle();
  if (!e) return fail("Matrícula não encontrada.");
  if (!e.expires_at) return; // já é sem prazo
  const base = Math.max(Date.now(), new Date(e.expires_at).getTime());
  const { error } = await supabase
    .from("ita_enrollments")
    .update({ expires_at: new Date(base + days * 86400000).toISOString(), status: "ativo" })
    .eq("id", id);
  if (error) return fail(error.message);
  refresh();
}

export async function setEnrollmentStatus(f: FormData) {
  const { supabase } = await requireAdmin();
  const status = str(f, "status", 20) === "cancelado" ? "cancelado" : "ativo";
  const { error } = await supabase.from("ita_enrollments").update({ status }).eq("id", str(f, "id", 64));
  if (error) return fail(error.message);
  refresh();
}

export async function deleteEnrollment(f: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("ita_enrollments").delete().eq("id", str(f, "id", 64));
  if (error) return fail(error.message);
  refresh();
}
