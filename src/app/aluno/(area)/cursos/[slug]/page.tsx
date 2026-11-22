import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtDate, loadCourseForStudent, requireStudent } from "@/lib/aluno";

export const instant = false;

export default async function AlunoCursoPage({ params }: PageProps<"/aluno/cursos/[slug]">) {
  const { slug } = await params;
  const { supabase, user } = await requireStudent(`/aluno/cursos/${slug}`);
  const data = await loadCourseForStudent(supabase, slug, user);
  if (!data) notFound();
  const { course, modules, lessons, done, hasAccess, enrollment } = data;
  const pct = lessons.length ? Math.round((done.size / lessons.length) * 100) : 0;
  const nextLesson = lessons.find((l) => !done.has(l.id) && (hasAccess || l.is_preview)) ?? lessons[0];

  return (
    <>
      <section className="bg-navy pb-10 pt-10 text-ivory">
        <div className="mx-auto max-w-5xl px-5">
          <Link href="/aluno" className="text-xs text-ivory/60 underline hover:text-copper">← Meus cursos</Link>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl">{course.title}</h1>
          <p className="mt-2 text-ivory/70">{course.subtitle}</p>
          {hasAccess ? (
            <>
              <div className="mt-6 h-2 max-w-md overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-copper" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs text-ivory/60">
                {done.size} de {lessons.length} aulas concluídas · {pct}%
                {enrollment?.expires_at ? ` · acesso até ${fmtDate(enrollment.expires_at)}` : ""}
              </p>
            </>
          ) : (
            <p className="mt-5 max-w-xl rounded-xl bg-white/5 p-4 text-sm text-ivory/80">
              Você ainda não tem acesso a este curso. As aulas grátis estão liberadas para você conhecer o método.{" "}
              <Link href={`/loja/cursos/${course.slug}`} className="font-semibold text-copper underline">Ver planos</Link>
            </p>
          )}
          {nextLesson && (
            <Link
              href={`/aluno/cursos/${course.slug}/aula/${nextLesson.id}`}
              className="mt-6 inline-block rounded-full bg-copper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-navy hover:brightness-105"
            >
              {done.size ? `Continuar: Aula ${nextLesson.position}` : hasAccess ? "Começar pela Aula 1" : "Assistir aula grátis"}
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-4 px-5 py-10">
        {modules.map((m) => {
          const mDone = m.lessons.filter((l) => done.has(l.id)).length;
          return (
            <details key={m.id} className="group rounded-2xl bg-white shadow-sm ring-1 ring-navy/5" open={m.lessons.some((l) => l.id === nextLesson?.id)}>
              <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-copper/60 font-serif text-copper">{m.position}</span>
                <span className="flex-1">
                  <span className="block font-serif text-lg text-navy">{m.title}</span>
                  <span className="text-xs text-ink/55">
                    {mDone}/{m.lessons.length} concluídas{m.level ? ` · ${m.level}` : ""}
                  </span>
                </span>
                <span className="text-xl text-ink/40 transition group-open:rotate-45">+</span>
              </summary>
              <ol className="divide-y divide-navy/5 border-t border-navy/10">
                {m.lessons.map((l) => {
                  const open = hasAccess || l.is_preview;
                  const isDone = done.has(l.id);
                  const row = (
                    <>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] ${
                          isDone ? "bg-green-600 text-white" : open ? "border border-navy/25 text-navy/60" : "bg-navy/5 text-ink/40"
                        }`}
                        aria-label={isDone ? "concluída" : open ? "não concluída" : "bloqueada"}
                      >
                        {isDone ? "✓" : open ? "" : "🔒"}
                      </span>
                      <span className="flex-1">
                        <span className="mr-2 text-xs text-ink/45">Aula {l.position}</span>
                        <span className={open ? "font-semibold text-navy" : "text-ink/50"}>{l.title}</span>
                        {l.is_preview && !hasAccess && (
                          <span className="ml-2 rounded-full bg-aqua/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-navy">grátis</span>
                        )}
                      </span>
                      {l.duration_min ? <span className="text-xs text-ink/45">{l.duration_min} min</span> : null}
                    </>
                  );
                  return (
                    <li key={l.id}>
                      {open ? (
                        <Link href={`/aluno/cursos/${course.slug}/aula/${l.id}`} className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-porcelain">
                          {row}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-5 py-3.5 text-sm">{row}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </div>
    </>
  );
}
