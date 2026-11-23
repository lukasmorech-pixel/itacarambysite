import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourse, getStore } from "@/lib/store";
import { CourseView } from "@/components/store/CourseView";

const FALLBACK_SLUG = "masterclass-protocolo-natural";

// Cursos já publicados saem pré-gerados; um curso novo é gerado na primeira visita.
export const instant = false;

export async function generateStaticParams() {
  const { courses } = await getStore();
  const slugs = courses.map((c) => c.slug);
  // Com Cache Components é preciso pelo menos um parâmetro.
  return (slugs.length ? slugs : [FALLBACK_SLUG]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/loja/cursos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCourse(slug);
  return c
    ? { title: `${c.title} — Curso online | Itacaramby`, description: `${c.subtitle}. ${c.description}`.slice(0, 160) }
    : { title: "Curso — Itacaramby" };
}

export default async function CursoPage({ params }: PageProps<"/loja/cursos/[slug]">) {
  const { slug } = await params;
  const c = await getCourse(slug);
  if (!c) notFound();
  return <CourseView c={c} />;
}
