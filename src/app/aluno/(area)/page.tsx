import Image from "next/image";
import Link from "next/link";
import { fmtDate, isActive, requireStudent, type Enrollment } from "@/lib/aluno";

export const instant = false;

const NOTICE: Record<string, [string, string]> = {
  ok: ["Pronto! O curso do seu pedido foi ligado à sua conta.", "bg-green-50 text-green-900"],
  nada: ["Não encontramos curso liberado nesse pedido. Ele já foi pago? Se precisar, fale com a gente.", "bg-amber-50 text-amber-900"],
  erro: ["Não foi possível ativar o acesso com esse link. Confira o link do pedido ou fale com a gente.", "bg-red-50 text-red-900"],
};

export default async function AlunoHome({ searchParams }: PageProps<"/aluno">) {
  const { ativar, senha } = await searchParams;
  const { supabase, user } = await requireStudent();
  const { data } = await supabase
    .from("ita_enrollments")
    .select("id,plan,expires_at,status,course:ita_courses(id,slug,title,subtitle,image_url)")
    .or(`user_id.eq.${user.id},email.eq.${user.email.toLowerCase().replace(/[,()]/g, "")}`)
    .order("created_at", { ascending: false });
  const enrollments = (data ?? []) as unknown as Enrollment[];

  // progresso por curso
  const courseIds = enrollments.map((e) => e.course?.id).filter(Boolean) as string[];
  const counts = new Map<string, { total: number; done: number }>();
  if (courseIds.length) {
    const [{ data: lessons }, { data: progress }] = await Promise.all([
      supabase.from("ita_course_lessons").select("id,module:ita_course_modules!inner(course_id)").in("module.course_id", courseIds),
      supabase.from("ita_lesson_progress").select("lesson_id").eq("user_id", user.id),
    ]);
    const done = new Set((progress ?? []).map((p) => p.lesson_id));
    for (const l of (lessons ?? []) as unknown as { id: string; module: { course_id: string } }[]) {
      const c = counts.get(l.module.course_id) ?? { total: 0, done: 0 };
      c.total += 1;
      if (done.has(l.id)) c.done += 1;
      counts.set(l.module.course_id, c);
    }
  }
  const notice = typeof ativar === "string" ? NOTICE[ativar] : undefined;
  const confirmedEmail = !!user.email;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">Área do Aluno</p>
      <h1 className="mt-1 font-serif text-3xl text-navy sm:text-4xl">Meus cursos</h1>

      {notice && <p className={`mt-5 rounded-xl p-4 text-sm ${notice[1]}`}>{notice[0]}</p>}
      {senha === "alterada" && <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-900">Senha alterada com sucesso.</p>}

      {enrollments.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-navy/5">
          <h2 className="font-serif text-xl text-navy">Nenhum curso por aqui ainda</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
            Quando o pagamento de um curso é confirmado, ele aparece aqui automaticamente para o e-mail da compra
            {confirmedEmail ? ` (${user.email})` : ""}. Comprou com outro e-mail? Abra o link do seu pedido e clique em
            “Ativar na minha conta”.
          </p>
          <Link href="/loja#cursos" className="mt-6 inline-block rounded-full bg-copper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-navy">
            Ver cursos disponíveis
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6">
          {enrollments.map((e) => {
            if (!e.course) return null;
            const active = isActive(e);
            const c = counts.get(e.course.id) ?? { total: 0, done: 0 };
            const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
            return (
              <article key={e.id} className="grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-navy/5 sm:grid-cols-[260px_1fr]">
                <div className="relative min-h-40 bg-navy">
                  {e.course.image_url && <Image src={e.course.image_url} alt="" fill sizes="260px" className="object-cover opacity-90" />}
                </div>
                <div className="p-6">
                  <h2 className="font-serif text-2xl text-navy">{e.course.title}</h2>
                  <p className="mt-1 text-sm text-ink/60">{e.course.subtitle}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-copper" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-ink/55">
                    {c.done} de {c.total} aulas concluídas · {pct}%
                  </p>
                  <p className="mt-1 text-xs text-ink/55">
                    {e.plan === "mensal" ? "Assinatura mensal" : e.plan === "cortesia" ? "Acesso cortesia" : "Curso completo"}
                    {e.expires_at ? ` · ${active ? "acesso até" : "acesso encerrado em"} ${fmtDate(e.expires_at)}` : " · acesso sem prazo"}
                  </p>
                  {active ? (
                    <Link
                      href={`/aluno/cursos/${e.course.slug}`}
                      className="mt-5 inline-block rounded-full bg-navy px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-navy-2"
                    >
                      {c.done ? "Continuar curso" : "Começar curso"}
                    </Link>
                  ) : (
                    <Link
                      href="/loja#cursos"
                      className="mt-5 inline-block rounded-full bg-copper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-navy"
                    >
                      Renovar acesso
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
