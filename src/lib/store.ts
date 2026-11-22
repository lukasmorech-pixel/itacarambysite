import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { CONTENT_TAG } from "@/lib/content";
import type { Course, Product } from "@/content/site";

/** Produtos e cursos publicados (em cache; atualiza quando o painel salva). */
export async function getStore(): Promise<{ products: Product[]; courses: Course[] }> {
  "use cache";
  cacheTag(CONTENT_TAG);
  if (!supabaseConfigured) {
    cacheLife("max");
    return { products: [], courses: [] };
  }
  const db = createPublicClient();
  const [p, c] = await Promise.all([
    db.from("ita_products").select("id,kind,name,description,price_cents,image_url,model_url").eq("published", true).order("position"),
    db
      .from("ita_courses")
      .select("id,slug,title,subtitle,description,image_url,highlights,price_monthly_cents,price_full_cents,access_days")
      .eq("published", true)
      .order("position"),
  ]);
  if (p.error || c.error) {
    console.error("Erro ao ler a loja:", p.error ?? c.error);
    cacheLife("minutes");
    return { products: [], courses: [] };
  }
  cacheLife("max");
  return { products: (p.data ?? []) as Product[], courses: (c.data ?? []) as Course[] };
}

export type Lesson = { id: string; position: number; title: string; topics: string[]; exercise: string[]; duration_min: number | null; is_preview: boolean };
export type CourseModule = { id: string; position: number; title: string; level: string; lessons: Lesson[] };
export type CourseDetail = Course & { modules: CourseModule[] };

/** Curso com módulos e aulas (ementa pública), para a página do curso. */
export async function getCourse(slug: string): Promise<CourseDetail | null> {
  "use cache";
  cacheTag(CONTENT_TAG);
  if (!supabaseConfigured) {
    cacheLife("max");
    return null;
  }
  const { data, error } = await createPublicClient()
    .from("ita_courses")
    .select(
      "id,slug,title,subtitle,description,image_url,highlights,price_monthly_cents,price_full_cents,access_days," +
        "modules:ita_course_modules(id,position,title,level,lessons:ita_course_lessons(id,position,title,topics,exercise,duration_min,is_preview))",
    )
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) {
    console.error("Erro ao ler o curso:", error);
    cacheLife("minutes");
    return null;
  }
  cacheLife("max");
  if (!data) return null;
  const course = data as unknown as CourseDetail;
  course.modules = [...(course.modules ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position) }));
  return course;
}
