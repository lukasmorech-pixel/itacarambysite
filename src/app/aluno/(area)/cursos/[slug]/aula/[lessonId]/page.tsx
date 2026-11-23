import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCourseForStudent, requireStudent } from "@/lib/aluno";
import { embedUrl } from "@/lib/video";
import { PhaseViewer } from "@/components/PhaseViewer";
import { toggleLesson } from "../../../../../actions";

export const instant = false;

type Content = { video_url: string; body: string; materials: { name: string; path: string }[] };

export default async function AulaPage({ params }: PageProps<"/aluno/cursos/[slug]/aula/[lessonId]">) {
  const { slug, lessonId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(lessonId)) notFound();
  const here = `/aluno/cursos/${slug}/aula/${lessonId}`;
  const { supabase, user } = await requireStudent(here);
  const data = await loadCourseForStudent(supabase, slug, user);
  if (!data) notFound();
  const { course, modules, lessons, done, hasAccess, phases } = data;

  const idx = lessons.findIndex((l) => l.id === lessonId);
  if (idx < 0) notFound();
  const lesson = lessons[idx];
  const mod = modules.find((m) => m.lessons.some((l) => l.id === lessonId))!;
  const canView = hasAccess || lesson.is_preview;
  // fase em 3D do módulo desta aula (ou a última fase já alcançada)
  let phaseIdx = -1;
  phases.forEach((p, i) => {
    if (p.module <= mod.position) phaseIdx = i;
  });

  // tópicos e exercício (ementa) + conteúdo protegido (só volta se o aluno tiver acesso)
  const [{ data: syllabus }, { data: content }] = await Promise.all([
    supabase.from("ita_course_lessons").select("topics,exercise").eq("id", lessonId).maybeSingle(),
    canView
      ? supabase.from("ita_lesson_content").select("video_url,body,materials").eq("lesson_id", lessonId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const c = content as Content | null;
  const video = c?.video_url ? embedUrl(c.video_url) : null;
  const materials = canView && c?.materials?.length
    ? await Promise.all(
        c.materials.map(async (m) => {
          const { data: signed } = await supabase.storage.from("itacaramby-arquivos").createSignedUrl(m.path, 60 * 60, { download: m.name });
          return { name: m.name, url: signed?.signedUrl ?? null };
        }),
      )
    : [];

  const reachable = lessons.filter((l) => hasAccess || l.is_preview);
  const pos = reachable.findIndex((l) => l.id === lessonId);
  const prev = pos > 0 ? reachable[pos - 1] : null;
  const next = pos >= 0 && pos < reachable.length - 1 ? reachable[pos + 1] : null;
  const isDone = done.has(lessonId);
  const lessonHref = (id: string) => `/aluno/cursos/${course.slug}/aula/${id}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1fr_300px]">
      <article>
        <Link href={`/aluno/cursos/${course.slug}`} className="text-xs text-ink/55 underline hover:text-copper">← {course.title}</Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-copper">
          Módulo {mod.position} · Aula {lesson.position}
          {lesson.duration_min ? ` · ${lesson.duration_min} min` : ""}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-navy">{lesson.title}</h1>

        {!canView ? (
          <div className="mt-6 rounded-3xl bg-navy p-8 text-ivory">
            <p className="font-serif text-xl">🔒 Aula exclusiva para alunos</p>
            <p className="mt-2 text-sm text-ivory/70">Assine ou compre o curso para liberar todas as aulas, os vídeos e os materiais.</p>
            <Link href={`/loja/cursos/${course.slug}`} className="mt-5 inline-block rounded-full bg-copper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-navy">
              Ver planos
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-hidden rounded-3xl bg-navy shadow-lg">
              {video ? (
                <div className="relative aspect-video">
                  <iframe
                    src={video}
                    title={`Vídeo: ${lesson.title}`}
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="grid aspect-video place-items-center p-6 text-center text-sm text-ivory/60">
                  <p>
                    <span className="block font-serif text-xl text-ivory">Vídeo em produção</span>
                    O vídeo desta aula será publicado em breve. Enquanto isso, acompanhe o roteiro abaixo.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <form action={toggleLesson}>
                <input type="hidden" name="lesson_id" value={lessonId} />
                <input type="hidden" name="done" value={isDone ? "1" : "0"} />
                {!isDone && next && <input type="hidden" name="next" value={lessonHref(next.id)} />}
                <button
                  className={`rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                    isDone ? "border border-green-700/30 bg-green-50 text-green-800" : "bg-copper text-navy hover:brightness-105"
                  }`}
                >
                  {isDone ? "✓ Aula concluída (desmarcar)" : next ? "Concluir e ir para a próxima" : "Marcar como concluída"}
                </button>
              </form>
            </div>

            {c?.body && (
              <section className="prose-sm mt-8 max-w-none text-[15px] leading-relaxed text-ink/80">
                {c.body.split(/\r?\n\s*\r?\n/).map((p, i) => (
                  <p key={i} className="mb-4 whitespace-pre-line">{p}</p>
                ))}
              </section>
            )}
          </>
        )}

        {syllabus && (syllabus.topics?.length > 0 || syllabus.exercise?.length > 0) && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {syllabus.topics?.length > 0 && (
              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/5">
                <h2 className="font-serif text-lg text-navy">Nesta aula</h2>
                <ul className="mt-3 grid gap-2 text-sm text-ink/75">
                  {(syllabus.topics as string[]).map((t) => (
                    <li key={t} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-copper" />{t}</li>
                  ))}
                </ul>
              </section>
            )}
            {syllabus.exercise?.length > 0 && (
              <section className="rounded-2xl bg-aqua/10 p-6">
                <h2 className="font-serif text-lg text-navy">✎ Exercício prático</h2>
                <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm text-ink/75">
                  {(syllabus.exercise as string[]).map((t) => <li key={t}>{t}</li>)}
                </ol>
              </section>
            )}
          </div>
        )}

        {phases.length > 0 && phaseIdx >= 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-serif text-lg text-navy">Em 3D: a fase desta aula</h2>
            <PhaseViewer key={lessonId} phases={phases} initial={phaseIdx} autoplay={false} compact />
          </section>
        )}

        {materials.length > 0 && (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-navy/5">
            <h2 className="font-serif text-lg text-navy">Materiais da aula</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              {materials.map((m) => (
                <li key={m.name}>
                  {m.url ? (
                    <a href={m.url} className="inline-flex items-center gap-2 font-semibold text-navy underline hover:text-copper">📎 {m.name}</a>
                  ) : (
                    <span className="text-ink/50">📎 {m.name} (indisponível)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="mt-10 flex justify-between gap-4 border-t border-navy/10 pt-6 text-sm">
          {prev ? (
            <Link href={lessonHref(prev.id)} className="text-navy hover:text-copper">← Aula {prev.position}: {prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link href={lessonHref(next.id)} className="text-right text-navy hover:text-copper">Aula {next.position}: {next.title} →</Link>
          ) : <span />}
        </nav>
      </article>

      <aside className="h-fit rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy/5 lg:sticky lg:top-24">
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-ink/50">
          {done.size}/{lessons.length} concluídas
        </p>
        <div className="mt-3 max-h-[70vh] overflow-y-auto">
          {modules.map((m) => (
            <div key={m.id} className="mb-3">
              <p className="px-2 py-1 text-xs font-semibold text-navy">{m.position}. {m.title}</p>
              <ul>
                {m.lessons.map((l) => {
                  const open = hasAccess || l.is_preview;
                  const cur = l.id === lessonId;
                  const cls = `flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${cur ? "bg-copper/15 font-semibold text-navy" : open ? "text-ink/70 hover:bg-porcelain" : "text-ink/35"}`;
                  const inner = (
                    <>
                      <span className="w-4 shrink-0 text-center">{done.has(l.id) ? "✓" : open ? "·" : "🔒"}</span>
                      <span>{l.position}. {l.title}</span>
                    </>
                  );
                  return (
                    <li key={l.id}>
                      {open ? <Link href={lessonHref(l.id)} className={cls} aria-current={cur ? "page" : undefined}>{inner}</Link> : <span className={cls}>{inner}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
