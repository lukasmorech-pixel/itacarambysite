import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import type { Phase } from "@/content/site";

export type Enrollment = {
  id: string;
  plan: "mensal" | "completo" | "cortesia";
  expires_at: string | null;
  status: "ativo" | "cancelado";
  course: { id: string; slug: string; title: string; subtitle: string; image_url: string } | null;
};

export type StudentLesson = { id: string; position: number; title: string; duration_min: number | null; is_preview: boolean };
export type StudentModule = { id: string; position: number; title: string; level: string; lessons: StudentLesson[] };

/** Aluno logado (qualquer conta). Use em toda página e ação da Área do Aluno. */
export async function requireStudent(next = "/aluno") {
  await connection(); // sempre por requisição (sessão do aluno)
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect(`/aluno/entrar?voltar=${encodeURIComponent(next)}`);
  const meta = (claims.user_metadata ?? {}) as { name?: string };
  return {
    supabase,
    user: { id: claims.sub as string, email: (claims.email as string | undefined) ?? "", name: meta.name ?? "" },
  };
}

export const isActive = (e: Pick<Enrollment, "status" | "expires_at">) =>
  e.status === "ativo" && (!e.expires_at || new Date(e.expires_at) > new Date());

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

/** Curso com módulos e aulas (lista pública) + progresso do aluno. */
export async function loadCourseForStudent(
  supabase: Awaited<ReturnType<typeof createSessionClient>>,
  slug: string,
  user: { id: string; email: string },
) {
  const { data: course } = await supabase
    .from("ita_courses")
    .select("id,slug,title,subtitle,image_url,phases,modules:ita_course_modules(id,position,title,level,lessons:ita_course_lessons(id,position,title,duration_min,is_preview))")
    .eq("slug", slug)
    .maybeSingle();
  if (!course) return null;
  const modules = ([...((course.modules as StudentModule[]) ?? [])] as StudentModule[])
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position) }));
  const lessons = modules.flatMap((m) => m.lessons);
  const [{ data: access }, { data: progress }, { data: enr }] = await Promise.all([
    supabase.rpc("ita_has_access", { p_course: course.id }),
    lessons.length
      ? supabase.from("ita_lesson_progress").select("lesson_id").eq("user_id", user.id).in("lesson_id", lessons.map((l) => l.id))
      : Promise.resolve({ data: [] as { lesson_id: string }[] }),
    supabase
      .from("ita_enrollments")
      .select("plan,expires_at,status")
      .eq("course_id", course.id)
      .or(`user_id.eq.${user.id},email.eq.${user.email.toLowerCase().replace(/[,()]/g, "")}`)
      .limit(1)
      .maybeSingle(),
  ]);
  const done = new Set((progress ?? []).map((p) => p.lesson_id));
  return {
    course: { id: course.id as string, slug: course.slug as string, title: course.title as string, subtitle: course.subtitle as string, image_url: course.image_url as string },
    modules,
    lessons,
    done,
    phases: (Array.isArray(course.phases) ? course.phases : []) as Phase[],
    hasAccess: !!access,
    enrollment: enr as Pick<Enrollment, "plan" | "expires_at" | "status"> | null,
  };
}
