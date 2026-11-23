"use server";

import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { CONTENT_TAG } from "@/lib/content";
import { embedUrl } from "@/lib/video";

type Db = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const lines = (f: FormData, k: string) =>
  str(f, k, 8000)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

type Mod = { id: string; position: number };
type Les = { id: string; module_id: string; position: number };

async function load(db: Db, courseId: string) {
  const { data: mods, error } = await db.from("ita_course_modules").select("id,position").eq("course_id", courseId).order("position");
  if (error) throw new Error(error.message);
  const ids = (mods ?? []).map((m) => m.id);
  const { data: les, error: e2 } = ids.length
    ? await db.from("ita_course_lessons").select("id,module_id,position").in("module_id", ids).order("position")
    : { data: [] as Les[], error: null };
  if (e2) throw new Error(e2.message);
  return { mods: (mods ?? []) as Mod[], les: (les ?? []) as Les[] };
}

/** Grava a ordem: módulos 1..N e aulas numeradas em sequência no curso inteiro. */
async function applyOrder(db: Db, courseId: string, mods: Mod[], les: Les[]) {
  const lessonIds = mods.flatMap((m) => les.filter((l) => l.module_id === m.id).map((l) => l.id));
  const { error } = await db.rpc("ita_course_apply_order", { p_course: courseId, p_modules: mods.map((m) => m.id), p_lessons: lessonIds });
  if (error) throw new Error(error.message);
}

async function renumber(db: Db, courseId: string) {
  const { mods, les } = await load(db, courseId);
  await applyOrder(db, courseId, mods, les);
}

function done() {
  updateTag(CONTENT_TAG);
  refresh();
}

const swap = <T,>(arr: T[], i: number, j: number) => {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return false;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return true;
};

// ---------- MÓDULOS ----------
export async function saveModule(f: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(f, "course_id", 64);
  const id = str(f, "id", 64);
  const row = { title: str(f, "title", 160), level: str(f, "level", 40) };
  if (!row.title) throw new Error("Informe o nome do módulo.");

  if (id) {
    const { error } = await supabase.from("ita_course_modules").update(row).eq("id", id).eq("course_id", courseId);
    if (error) throw new Error(error.message);
  } else {
    const { mods } = await load(supabase, courseId);
    const next = Math.max(0, ...mods.map((m) => m.position)) + 1;
    const { error } = await supabase.from("ita_course_modules").insert({ ...row, course_id: courseId, position: next });
    if (error) throw new Error(error.message);
    await renumber(supabase, courseId);
  }
  done();
}

export async function deleteModule(f: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(f, "course_id", 64);
  const { error } = await supabase.from("ita_course_modules").delete().eq("id", str(f, "id", 64)).eq("course_id", courseId);
  if (error) throw new Error(error.message);
  await renumber(supabase, courseId);
  done();
}

export async function moveModule(f: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(f, "course_id", 64);
  const { mods, les } = await load(supabase, courseId);
  const i = mods.findIndex((m) => m.id === str(f, "id", 64));
  if (!swap(mods, i, i + (str(f, "dir", 4) === "up" ? -1 : 1))) return;
  await applyOrder(supabase, courseId, mods, les);
  done();
}

// ---------- AULAS ----------
export async function saveLesson(f: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(f, "course_id", 64);
  const id = str(f, "id", 64);
  const moduleId = str(f, "module_id", 64);
  const dur = Number(str(f, "duration_min", 4));
  const row = {
    title: str(f, "title", 200),
    topics: lines(f, "topics"),
    exercise: lines(f, "exercise"),
    duration_min: Number.isFinite(dur) && dur > 0 ? Math.min(600, Math.round(dur)) : null,
    is_preview: f.get("is_preview") === "on",
  };
  if (!row.title) throw new Error("Informe o título da aula.");

  const { mods, les } = await load(supabase, courseId);
  if (!mods.some((m) => m.id === moduleId)) throw new Error("Módulo inválido.");
  // posição provisória no fim do módulo de destino (a numeração final vem do renumber)
  const endOf = Math.max(0, ...les.filter((l) => l.module_id === moduleId).map((l) => l.position)) + 100;

  // conteúdo protegido (só alunos com acesso veem)
  const video = str(f, "video_url", 600);
  if (video && !embedUrl(video)) throw new Error("Link de vídeo não reconhecido. Use o link do Bunny Stream, YouTube ou Vimeo.");
  const prefix = `cursos/${courseId}/`;

  let lessonId = id;
  if (id) {
    const cur = les.find((l) => l.id === id);
    if (!cur) throw new Error("Aula não encontrada.");
    const patch = cur.module_id === moduleId ? row : { ...row, module_id: moduleId, position: endOf };
    const { error } = await supabase.from("ita_course_lessons").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase.from("ita_course_lessons").insert({ ...row, module_id: moduleId, position: endOf }).select("id").single();
    if (error) throw new Error(error.message);
    lessonId = data.id;
  }

  const { data: old } = await supabase.from("ita_lesson_content").select("materials").eq("lesson_id", lessonId).maybeSingle();
  const keep = new Set(f.getAll("keep_material").map(String));
  const materials = ((old?.materials ?? []) as { name: string; path: string }[]).filter((m) => keep.has(m.path));
  const newPath = str(f, "new_material_path", 400);
  if (newPath) {
    if (!newPath.startsWith(prefix)) throw new Error("Arquivo de material inválido.");
    const label = str(f, "new_material_name", 120) || str(f, "new_material_original", 160) || newPath.split("/").pop()!;
    materials.push({ name: label, path: newPath });
  }
  const { error: cErr } = await supabase.from("ita_lesson_content").upsert({
    lesson_id: lessonId,
    video_url: video,
    body: str(f, "body", 20000),
    materials,
    updated_at: new Date().toISOString(),
  });
  if (cErr) throw new Error(cErr.message);

  await renumber(supabase, courseId);
  done();
}

export async function deleteLesson(f: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(f, "course_id", 64);
  const { les } = await load(supabase, courseId);
  const id = str(f, "id", 64);
  if (!les.some((l) => l.id === id)) throw new Error("Aula não encontrada.");
  const { error } = await supabase.from("ita_course_lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await renumber(supabase, courseId);
  done();
}

export async function moveLesson(f: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(f, "course_id", 64);
  const { mods, les } = await load(supabase, courseId);
  const id = str(f, "id", 64);
  const cur = les.find((l) => l.id === id);
  if (!cur) return;
  const inMod = les.filter((l) => l.module_id === cur.module_id);
  const i = inMod.findIndex((l) => l.id === id);
  if (!swap(inMod, i, i + (str(f, "dir", 4) === "up" ? -1 : 1))) return;
  const others = les.filter((l) => l.module_id !== cur.module_id);
  await applyOrder(supabase, courseId, mods, [...others, ...inMod]);
  done();
}

// ---------- FASES EM 3D ----------
const MODEL_RE = /^\/3d\/[\w./-]+\.glb$/;

export async function savePhases(f: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(f, "course_id", 64);
  const titles = f.getAll("phase_title").map((v) => String(v).trim().slice(0, 120));
  const texts = f.getAll("phase_text").map((v) => String(v).trim().slice(0, 600));
  const models = f.getAll("phase_model").map((v) => String(v).trim().slice(0, 200));
  const mods = f.getAll("phase_module").map((v) => Math.max(1, Math.min(99, Number(v) || 1)));
  const phases = titles
    .map((title, i) => ({ title, text: texts[i] ?? "", model: models[i] ?? "", module: mods[i] ?? 1 }))
    .filter((p) => p.title || p.model);
  for (const p of phases) {
    if (!p.title) throw new Error("Toda fase precisa de um título.");
    if (!MODEL_RE.test(p.model)) throw new Error(`Modelo 3D inválido na fase “${p.title}”. Use um arquivo de /3d/…glb.`);
  }
  const { error } = await supabase.from("ita_courses").update({ phases }).eq("id", courseId);
  if (error) throw new Error(error.message);
  done();
}
