import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { deleteLesson, deleteModule, moveLesson, moveModule, saveLesson, saveModule } from "../../../../curso-actions";
import { ConfirmButton, IconButton, SubmitButton, inputCls, labelCls } from "@/components/admin/ui";
import { FileField } from "@/components/admin/FileField";

export const instant = false;

type LessonContent = { video_url: string; body: string; materials: { name: string; path: string }[]; updated_at: string };
type Lesson = {
  id: string;
  position: number;
  title: string;
  topics: string[];
  exercise: string[];
  duration_min: number | null;
  is_preview: boolean;
  content: LessonContent | LessonContent[] | null;
};
const contentOf = (l?: Lesson): LessonContent | null => (Array.isArray(l?.content) ? l.content[0] ?? null : l?.content ?? null);
type Module = { id: string; position: number; title: string; level: string; lessons: Lesson[] };

const LEVELS = ["Iniciante", "Intermediário", "Avançado", "Profissional"];

function Hidden({ courseId, id }: { courseId: string; id?: string }) {
  return (
    <>
      <input type="hidden" name="course_id" value={courseId} />
      {id && <input type="hidden" name="id" value={id} />}
    </>
  );
}

function MoveButtons({ action, courseId, id, first, last }: { action: (f: FormData) => Promise<void>; courseId: string; id: string; first: boolean; last: boolean }) {
  return (
    <>
      {!first && (
        <form action={action}>
          <Hidden courseId={courseId} id={id} />
          <input type="hidden" name="dir" value="up" />
          <IconButton title="Subir">↑</IconButton>
        </form>
      )}
      {!last && (
        <form action={action}>
          <Hidden courseId={courseId} id={id} />
          <input type="hidden" name="dir" value="down" />
          <IconButton title="Descer">↓</IconButton>
        </form>
      )}
    </>
  );
}

function ModuleFields({ m }: { m?: Module }) {
  return (
    <>
      <label className={`${labelCls} sm:col-span-2`}>Nome do módulo<input name="title" required defaultValue={m?.title} className={inputCls} /></label>
      <label className={labelCls}>
        Nível
        <input name="level" list="niveis" defaultValue={m?.level} placeholder="Iniciante" className={inputCls} />
      </label>
    </>
  );
}

function LessonForm({ courseId, modules, moduleId, l }: { courseId: string; modules: Module[]; moduleId: string; l?: Lesson }) {
  return (
    <form action={saveLesson} className="grid gap-3 sm:grid-cols-3">
      <Hidden courseId={courseId} id={l?.id} />
      <label className={`${labelCls} sm:col-span-2`}>Título da aula<input name="title" required defaultValue={l?.title} className={inputCls} /></label>
      <label className={labelCls}>Duração (min)<input name="duration_min" type="number" min={1} max={600} defaultValue={l?.duration_min ?? ""} className={inputCls} /></label>
      <label className={`${labelCls} sm:col-span-3`}>
        Conteúdo (um tópico por linha)
        <textarea name="topics" rows={3} defaultValue={l?.topics.join("\n")} className={inputCls} />
      </label>
      <label className={`${labelCls} sm:col-span-3`}>
        Exercício prático (uma etapa por linha)
        <textarea name="exercise" rows={3} defaultValue={l?.exercise.join("\n")} className={inputCls} />
      </label>
      <fieldset className="grid gap-3 rounded-xl bg-aqua/5 p-4 ring-1 ring-aqua/20 sm:col-span-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-navy/70">Conteúdo para os alunos (Área do Aluno)</legend>
        <label className={labelCls}>
          Vídeo da aula — link do Bunny Stream, YouTube ou Vimeo
          <input name="video_url" defaultValue={contentOf(l)?.video_url} placeholder="https://iframe.mediadelivery.net/embed/…" className={inputCls} />
        </label>
        <label className={labelCls}>
          Texto da aula (parágrafos separados por linha em branco)
          <textarea name="body" rows={5} defaultValue={contentOf(l)?.body} className={inputCls} />
        </label>
        {(contentOf(l)?.materials ?? []).length > 0 && (
          <div className="grid gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-navy/70">Materiais (desmarque para remover)</span>
            {contentOf(l)!.materials.map((m) => (
              <label key={m.path} className="flex items-center gap-2">
                <input type="checkbox" name="keep_material" value={m.path} defaultChecked className="h-4 w-4 accent-copper" />
                📎 {m.name}
              </label>
            ))}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <FileField
            name="new_material_path"
            nameField="new_material_original"
            folder={`cursos/${courseId}`}
            label="Adicionar material (PDF, ficha, etc.)"
            note="Pasta privada: só alunos com acesso ao curso conseguem baixar."
          />
          <label className={labelCls}>
            Nome do material (opcional)
            <input name="new_material_name" placeholder="Ex.: Ficha de cores" className={inputCls} />
          </label>
        </div>
      </fieldset>
      <label className={labelCls}>
        Módulo
        <select name="module_id" defaultValue={moduleId} className={inputCls}>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>{m.position}. {m.title}</option>
          ))}
        </select>
      </label>
      <div className="flex items-end justify-between gap-3 sm:col-span-2">
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="is_preview" defaultChecked={l?.is_preview ?? false} className="h-4 w-4 accent-copper" />
          Aula grátis (amostra)
        </label>
        <SubmitButton>{l ? "Salvar aula" : "Adicionar aula"}</SubmitButton>
      </div>
    </form>
  );
}

export default async function CursoConteudoPage({ params }: PageProps<"/admin/loja/cursos/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data: course } = await supabase
    .from("ita_courses")
    .select("id,title,slug,published,modules:ita_course_modules(id,position,title,level,lessons:ita_course_lessons(id,position,title,topics,exercise,duration_min,is_preview,content:ita_lesson_content(video_url,body,materials,updated_at)))")
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  const modules = ([...((course.modules as Module[]) ?? [])] as Module[])
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.position - b.position) }));
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const totalMin = modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + (l.duration_min ?? 0), 0), 0);

  return (
    <>
      <datalist id="niveis">
        {LEVELS.map((l) => <option key={l} value={l} />)}
      </datalist>

      <Link href="/admin/loja/cursos" className="text-xs text-aqua underline">← Cursos</Link>
      <h1 className="mt-2 font-serif text-3xl text-navy">{course.title}</h1>
      <p className="mb-2 mt-1 text-sm text-ink/60">
        Módulos e aulas que aparecem na página do curso. {modules.length} módulos · {totalLessons} aulas
        {totalMin ? ` · ${Math.floor(totalMin / 60)}h${String(totalMin % 60).padStart(2, "0")}` : ""}. As aulas são numeradas automaticamente.
      </p>
      <p className="mb-6 text-sm">
        {course.published ? (
          <Link href={`/loja/cursos/${course.slug}`} target="_blank" className="font-semibold text-aqua underline">Ver página do curso ↗</Link>
        ) : (
          <span className="text-ink/50">O curso está oculto: marque “Mostrar no site” em Cursos para a página aparecer.</span>
        )}
      </p>

      <div className="grid gap-4">
        {modules.map((m, mi) => (
          <details key={m.id} className="group rounded-2xl bg-white shadow-sm ring-1 ring-navy/5" open={modules.length <= 2}>
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-copper/60 font-serif text-copper">{m.position}</span>
              <span className="flex-1">
                <span className="font-semibold text-navy">{m.title}</span>
                <span className="ml-2 text-xs text-ink/50">{m.lessons.length} aulas{m.level ? ` · ${m.level}` : ""}</span>
              </span>
              <span className="text-xs text-aqua group-open:hidden">Abrir</span>
            </summary>

            <div className="grid gap-4 border-t border-navy/10 p-4">
              <form action={saveModule} className="grid gap-3 sm:grid-cols-3">
                <Hidden courseId={course.id} id={m.id} />
                <ModuleFields m={m} />
                <div className="flex items-center gap-2 sm:col-span-3">
                  <SubmitButton>Salvar módulo</SubmitButton>
                </div>
              </form>

              <div className="grid gap-2">
                {m.lessons.map((l, li) => (
                  <details key={l.id} className="group/l rounded-xl border border-navy/10">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm">
                      <span className="w-14 shrink-0 text-xs text-ink/45">Aula {l.position}</span>
                      <span className="flex-1 font-semibold text-navy">
                        {l.title}
                        {l.is_preview && <span className="ml-2 rounded-full bg-aqua/15 px-2 py-0.5 text-[10px] uppercase">grátis</span>}
                      </span>
                      {contentOf(l)?.video_url ? <span title="Tem vídeo" className="text-xs">🎬</span> : <span title="Sem vídeo ainda" className="text-xs text-ink/30">🎬</span>}
                      {l.duration_min ? <span className="text-xs text-ink/50">{l.duration_min} min</span> : null}
                      <span className="text-xs text-aqua group-open/l:hidden">Editar</span>
                    </summary>
                    <div className="grid gap-3 border-t border-navy/10 p-4">
                      <LessonForm key={contentOf(l)?.updated_at ?? l.id} courseId={course.id} modules={modules} moduleId={m.id} l={l} />
                      <div className="flex items-center gap-2 border-t border-navy/10 pt-3">
                        <MoveButtons action={moveLesson} courseId={course.id} id={l.id} first={li === 0} last={li === m.lessons.length - 1} />
                        <form action={deleteLesson} className="ml-auto">
                          <Hidden courseId={course.id} id={l.id} />
                          <ConfirmButton message={`Apagar a aula "${l.title}"? Não dá para desfazer.`} className="text-xs text-red-700 underline">
                            Apagar aula
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>
                  </details>
                ))}
                <details className="rounded-xl border-2 border-dashed border-copper/40">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-copper">+ Nova aula neste módulo</summary>
                  <div className="border-t border-navy/10 p-4">
                    <LessonForm key={`nova-${m.lessons.length}`} courseId={course.id} modules={modules} moduleId={m.id} />
                  </div>
                </details>
              </div>

              <div className="flex items-center gap-2 border-t border-navy/10 pt-3">
                <MoveButtons action={moveModule} courseId={course.id} id={m.id} first={mi === 0} last={mi === modules.length - 1} />
                <form action={deleteModule} className="ml-auto">
                  <Hidden courseId={course.id} id={m.id} />
                  <ConfirmButton
                    message={`Apagar o módulo "${m.title}" e as ${m.lessons.length} aulas dele? Não dá para desfazer.`}
                    className="text-xs text-red-700 underline"
                  >
                    Apagar módulo
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </details>
        ))}
        {modules.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink/60">Nenhum módulo ainda. Comece criando o primeiro.</p>}

        <details className="rounded-2xl border-2 border-dashed border-copper/50 bg-white/60" open={modules.length === 0}>
          <summary className="cursor-pointer list-none p-4 font-semibold text-copper">+ Novo módulo</summary>
          <form action={saveModule} className="grid gap-3 border-t border-navy/10 p-4 sm:grid-cols-3">
            <Hidden courseId={course.id} />
            <ModuleFields />
            <div className="sm:col-span-3">
              <SubmitButton>Criar módulo</SubmitButton>
            </div>
          </form>
        </details>
      </div>
    </>
  );
}
