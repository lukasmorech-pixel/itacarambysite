import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getStore } from "@/lib/store";
import { CoursePlans } from "@/components/store/CoursePlans";
import { PhaseViewer } from "@/components/PhaseViewer";

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

function fmtTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? String(m).padStart(2, "0") : ""}` : `${m} min`;
}

export default async function CursoPage({ params }: PageProps<"/loja/cursos/[slug]">) {
  const { slug } = await params;
  const c = await getCourse(slug);
  if (!c) notFound();

  const lessons = c.modules.flatMap((m) => m.lessons);
  const total = lessons.reduce((n, l) => n + (l.duration_min ?? 0), 0);
  const levels = [...new Set(c.modules.map((m) => m.level).filter(Boolean))];
  const phaseOf = (module: number) => c.phases.findIndex((p) => p.module === module);

  return (
    <>
      {/* TOPO */}
      <section className="relative overflow-hidden bg-navy pb-16 pt-32 text-ivory">
        {c.image_url && (
          <Image src={c.image_url} alt="" fill priority={false} sizes="100vw" className="object-cover opacity-15" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/85 to-navy" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Link href="/loja#cursos" className="text-xs text-ivory/60 underline hover:text-copper">← Loja · Cursos</Link>
            <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">Curso online</p>
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{c.title}</h1>
            <p className="mt-3 text-lg text-ivory/80">{c.subtitle}</p>
            <p className="mt-6 max-w-2xl leading-relaxed text-ivory/70">{c.description}</p>
            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                [String(c.modules.length), "módulos"],
                [String(lessons.length), "aulas"],
                [total ? fmtTime(total) : "—", "de conteúdo"],
                [levels.length > 1 ? `${levels[0]} → ${levels[levels.length - 1]}` : levels[0] ?? "—", "nível"],
              ]
                .filter(([v]) => v !== "0" && v !== "—")
                .map(([v, l]) => (
                <div key={l} className="rounded-xl border border-ivory/10 bg-white/5 px-4 py-3">
                  <dt className="font-serif text-xl text-ivory">{v}</dt>
                  <dd className="text-xs text-ivory/55">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside className="h-fit rounded-3xl border border-ivory/10 bg-navy-2/80 p-6 backdrop-blur lg:mt-10">
            <p className="mb-4 font-serif text-xl">Escolha como quer estudar</p>
            <CoursePlans c={c} dark />
            <ul className="mt-2 grid gap-2 text-sm text-ivory/75">
              {c.highlights.map((h) => (
                <li key={h} className="flex gap-2"><span className="text-copper">✓</span> {h}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* FASES EM 3D */}
      {c.phases.length > 0 && (
        <section className="bg-navy pb-16">
          <div className="mx-auto max-w-5xl px-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">O curso em 3D</p>
            <h2 className="mb-6 max-w-2xl font-serif text-3xl text-ivory sm:text-4xl">Veja a peça evoluir, fase a fase.</h2>
            <PhaseViewer phases={c.phases} moduleLinkPrefix="#modulo-" />
            <p className="mt-3 text-center text-xs text-ivory/45">Modelo ilustrativo · arraste para girar · cada fase é ensinada num módulo do curso</p>
          </div>
        </section>
      )}

      {/* EMENTA */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-aqua">Conteúdo do curso</p>
        <h2 className="font-serif text-3xl text-navy sm:text-4xl">O que você vai aprender, aula por aula.</h2>
        {lessons.length > 0 ? (
          <p className="mt-3 text-sm text-ink/60">
            {c.modules.length} módulos e {lessons.length} aulas{total ? `, cerca de ${fmtTime(total)} de conteúdo` : ""}. Abra cada módulo para ver os temas de cada aula.
          </p>
        ) : (
          <p className="mt-6 rounded-2xl bg-white p-6 text-sm text-ink/60 shadow-sm ring-1 ring-navy/5">
            O conteúdo detalhado deste curso será publicado em breve. Fale com a gente pelo WhatsApp para saber mais.
          </p>
        )}

        <div className="mt-10 grid gap-4">
          {c.modules.map((m) => {
            const mins = m.lessons.reduce((n, l) => n + (l.duration_min ?? 0), 0);
            return (
              <details key={m.id} id={`modulo-${m.position}`} className="group scroll-mt-24 rounded-2xl bg-white shadow-sm ring-1 ring-navy/5" open={m.position === 1}>
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-copper/60 font-serif text-copper">
                    {m.position}
                  </span>
                  <span className="flex-1">
                    <span className="block font-serif text-lg text-navy">{m.title}</span>
                    <span className="text-xs text-ink/55">
                      {m.lessons.length} aulas{mins ? ` · ${fmtTime(mins)}` : ""}{m.level ? ` · ${m.level}` : ""}
                    </span>
                  </span>
                  <span className="text-xl text-ink/40 transition group-open:rotate-45">+</span>
                </summary>
                {phaseOf(m.position) >= 0 && (
                  <a href={`#fase-${phaseOf(m.position) + 1}`} className="mx-5 mb-3 inline-flex items-center gap-2 rounded-full bg-copper/10 px-3 py-1 text-xs font-semibold text-copper hover:bg-copper/20">
                    ▶ Ver a fase {phaseOf(m.position) + 1} em 3D: {c.phases[phaseOf(m.position)].title}
                  </a>
                )}
                <ol className="divide-y divide-navy/5 border-t border-navy/10">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-navy">
                          <span className="mr-2 text-xs font-normal text-ink/45">Aula {l.position}</span>
                          {l.title}
                          {l.is_preview && (
                            <span className="ml-2 rounded-full bg-aqua/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">Aula grátis</span>
                          )}
                        </p>
                        {l.duration_min ? <span className="text-xs text-ink/50">{l.duration_min} min</span> : null}
                      </div>
                      {l.topics.length > 0 && (
                        <ul className="mt-2 grid gap-1 text-sm text-ink/70">
                          {l.topics.map((t) => (
                            <li key={t} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-copper" />{t}</li>
                          ))}
                        </ul>
                      )}
                      {l.exercise.length > 0 && (
                        <p className="mt-2 text-xs text-aqua">✎ Exercício prático: {l.exercise.length} etapas</p>
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            );
          })}
        </div>

        <div className="mt-14 rounded-3xl bg-navy p-7 text-ivory sm:p-10">
          <h3 className="font-serif text-2xl">Pronto para começar?</h3>
          <p className="mb-6 mt-2 text-sm text-ivory/70">Escolha a assinatura mensal ou o curso completo. O acesso é liberado na Área do Aluno após a confirmação do pagamento.</p>
          <CoursePlans c={c} dark />
        </div>

        <p className="mt-8 text-xs leading-relaxed text-ink/50">
          Conteúdo técnico e educacional. Não substitui treinamento prático supervisionado, as instruções de uso dos fabricantes nem a avaliação
          clínica do cirurgião-dentista responsável.
        </p>
      </section>
    </>
  );
}
