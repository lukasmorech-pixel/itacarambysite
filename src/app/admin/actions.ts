"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { CONTENT_TAG } from "@/lib/content";
import { createSessionClient } from "@/lib/supabase/server";
import type { Settings } from "@/content/site";

type Table = "services" | "gallery" | "partners" | "testimonials" | "products" | "courses";
const TABLES: Table[] = ["services", "gallery", "partners", "testimonials", "products", "courses"];

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
/** "1.234,56" / "180" / "R$ 97,00" -> centavos; vazio -> null */
const cents = (f: FormData, k: string): number | null => {
  const raw = str(f, k, 30).replace(/[^\d,.]/g, "");
  if (!raw) return null;
  const n = Number(raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const lines = (f: FormData, k: string) =>
  str(f, k, 8000)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

function table(f: FormData): Table {
  const t = str(f, "_table") as Table;
  if (!TABLES.includes(t)) throw new Error("Tabela inválida");
  return t;
}

function done() {
  updateTag(CONTENT_TAG);
  refresh();
}

// ---------- LOGIN ----------
export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = str(formData, "email", 200);
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha incorretos." };

  const { data: isAdmin } = await supabase.rpc("ita_is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Este usuário não tem acesso ao painel." };
  }
  redirect("/admin");
}

export async function logout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------- ITENS (serviços, galeria, parceiros, depoimentos) ----------
function rowFromForm(t: Table, f: FormData) {
  const published = f.get("published") === "on";
  switch (t) {
    case "services":
      return { title: str(f, "title", 120), text: str(f, "text", 400), items: lines(f, "items"), image_url: str(f, "image_url", 600), published };
    case "gallery":
      return { title: str(f, "title", 120), tag: str(f, "tag", 40), image_url: str(f, "image_url", 600), published };
    case "partners":
      return { name: str(f, "name", 120), logo_url: str(f, "logo_url", 600), published };
    case "testimonials":
      return { quote: str(f, "quote", 800), name: str(f, "name", 120), role: str(f, "role", 120), published };
    case "products": {
      const kind = str(f, "kind", 10) === "digital" ? "digital" : "fisico";
      return {
        kind,
        name: str(f, "name", 140),
        description: str(f, "description", 1500),
        price_cents: cents(f, "price") ?? 0,
        image_url: str(f, "image_url", 600),
        file_path: kind === "digital" ? str(f, "file_path", 400) : "",
        model_url: /^(\/3d\/[\w.-]+\.glb|https:\/\/\S+\.glb)$/.test(str(f, "model_url", 400)) ? str(f, "model_url", 400) : "",
        published,
      };
    }
    case "courses":
      return {
        title: str(f, "title", 140),
        slug: slugify(str(f, "slug", 80) || str(f, "title", 140)),
        subtitle: str(f, "subtitle", 200),
        description: str(f, "description", 3000),
        highlights: lines(f, "highlights"),
        image_url: str(f, "image_url", 600),
        price_monthly_cents: cents(f, "price_monthly"),
        price_full_cents: cents(f, "price_full"),
        access_days: Math.max(1, Math.min(3650, Number(str(f, "access_days", 5)) || 365)),
        published,
      };
  }
}

export async function saveItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const t = table(formData);
  const id = str(formData, "id", 64);
  const row = rowFromForm(t, formData);
  if (t === "gallery" && !("image_url" in row && row.image_url)) throw new Error("Escolha uma foto para a galeria.");
  if (t === "courses" && "price_monthly_cents" in row && row.price_monthly_cents == null && row.price_full_cents == null) {
    throw new Error("Informe pelo menos um preço (mensal ou completo).");
  }

  if (id) {
    const { error } = await supabase.from(`ita_${t}`).update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data: last } = await supabase.from(`ita_${t}`).select("position").order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from(`ita_${t}`).insert({ ...row, position: (last?.position ?? 0) + 1 });
    if (error) throw new Error(error.message);
  }
  done();
}

export async function deleteItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const t = table(formData);
  const id = str(formData, "id", 64);
  const { error } = await supabase.from(`ita_${t}`).delete().eq("id", id);
  if (error) throw new Error(error.message);
  done();
}

export async function moveItem(formData: FormData) {
  const { supabase } = await requireAdmin();
  const t = table(formData);
  const id = str(formData, "id", 64);
  const dir = str(formData, "dir", 4) === "up" ? -1 : 1;

  const { data: rows, error } = await supabase.from(`ita_${t}`).select("id,position").order("position", { ascending: true });
  if (error || !rows) throw new Error(error?.message ?? "Erro ao ordenar");
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return;

  // Renumera tudo em sequência, trocando os dois de lugar.
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await Promise.all(rows.map((r, idx) => supabase.from(`ita_${t}`).update({ position: idx + 1 }).eq("id", r.id)));
  done();
}

// ---------- MENSAGENS ----------
export async function setMessageRead(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id", 64);
  const read = str(formData, "read", 5) === "true";
  const { error } = await supabase.from("ita_messages").update({ read }).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- PEDIDOS ----------
const ORDER_STATUS = ["pendente", "pago", "enviado", "entregue", "cancelado"];

export async function updateOrder(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id", 64);
  const status = str(formData, "status", 20);
  if (!ORDER_STATUS.includes(status)) throw new Error("Status inválido");
  const { data: current } = await supabase.from("ita_orders").select("status,paid_at").eq("id", id).maybeSingle();
  const patch: Record<string, unknown> = { status, admin_notes: str(formData, "admin_notes", 1000) };
  if (status === "pago" && !current?.paid_at) patch.paid_at = new Date().toISOString();
  const { error } = await supabase.from("ita_orders").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function deleteMessage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("ita_messages").delete().eq("id", str(formData, "id", 64));
  if (error) throw new Error(error.message);
  refresh();
}

// ---------- TEXTOS E CONTATOS ----------
export type SettingsState = { ok?: boolean; error?: string };

export async function saveSettings(_prev: SettingsState, f: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();

  const stats = [0, 1, 2]
    .map((i) => ({ value: str(f, `stat_value_${i}`, 40), label: str(f, `stat_label_${i}`, 80) }))
    .filter((s) => s.value);

  const leadTimes = lines(f, "leadTimes").map((l) => {
    const [item, ...rest] = l.split("|");
    return { item: item.trim(), days: rest.join("|").trim() };
  });

  const data: Settings = {
    cro: str(f, "cro", 40),
    city: str(f, "city", 80),
    hero: { eyebrow: str(f, "hero_eyebrow", 120), title1: str(f, "hero_title1", 120), title2: str(f, "hero_title2", 120), text: str(f, "hero_text", 600) },
    about: {
      title: str(f, "about_title", 160),
      paragraphs: str(f, "about_text", 4000).split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean),
      stats,
    },
    owner: { name: str(f, "owner_name", 120), role: str(f, "owner_role", 160), photo: str(f, "owner_photo", 600) },
    contact: {
      whatsapp: str(f, "whatsapp", 20).replace(/\D/g, ""),
      whatsappLabel: str(f, "whatsappLabel", 40),
      email: str(f, "email", 160),
      instagram: str(f, "instagram", 60).replace(/^@/, ""),
      address: str(f, "address", 300),
    },
    leadTimes,
    verse: { text: str(f, "verse_text", 400), ref: str(f, "verse_ref", 60) },
    store: { shippingFlatCents: cents(f, "shipping_flat") ?? 0, pickupNote: str(f, "pickup_note", 400) },
  };

  if (data.contact.whatsapp.length < 10) return { error: "WhatsApp inválido: use só números com DDI e DDD (ex.: 5562984490810)." };

  const { error } = await supabase.from("ita_site_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  done();
  return { ok: true };
}
