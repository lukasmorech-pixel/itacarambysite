import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import type { CourseDetail } from "@/lib/store";
import { CourseView } from "@/components/store/CourseView";

export const instant = false;

// Mostra a página do curso como ficará na loja, mesmo com o curso oculto (só para admin).
export default async function PreviaCursoPage({ params }: PageProps<"/admin/loja/cursos/[id]/previa">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("ita_courses")
    .select(
      "id,slug,title,subtitle,description,image_url,highlights,price_monthly_cents,price_full_cents,access_days,phases,published," +
        "modules:ita_course_modules(id,position,title,level,lessons:ita_course_lessons(id,position,title,topics,exercise,duration_min,is_preview))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const c = data as unknown as CourseDetail & { published: boolean };
  c.phases = Array.isArray(c.phases) ? c.phases : [];
  c.modules = [...(c.modules ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position) }));

  return (
    <div className="-m-5 sm:-m-8">
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 bg-copper px-5 py-2 text-sm text-navy">
        <strong>Pré-visualização</strong>
        <span>{c.published ? "Este curso está publicado na loja." : "Este curso está oculto: só administradores veem esta página."}</span>
        <Link href={`/admin/loja/cursos/${c.id}`} className="ml-auto font-semibold underline">← Voltar ao conteúdo</Link>
      </div>
      <div className="bg-porcelain">
        <CourseView c={c} />
      </div>
    </div>
  );
}
