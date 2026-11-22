import { requireAdmin } from "@/lib/admin";
import { deleteEnrollment, extendAccess, grantAccess, setEnrollmentStatus } from "../../alunos-actions";
import { ConfirmButton, SubmitButton, inputCls, labelCls } from "@/components/admin/ui";

export const instant = false;

type Row = {
  id: string;
  email: string;
  name: string;
  plan: string;
  status: "ativo" | "cancelado";
  expires_at: string | null;
  user_id: string | null;
  created_at: string;
  order: { number: number } | null;
  course: { title: string } | null;
};

const isExpired = (iso: string | null) => !!iso && new Date(iso).getTime() < Date.now();
const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
const PLAN: Record<string, string> = { mensal: "Mensal", completo: "Completo", cortesia: "Cortesia" };

export default async function AlunosPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: courses }] = await Promise.all([
    supabase
      .from("ita_enrollments")
      .select("id,email,name,plan,status,expires_at,user_id,created_at,order:ita_orders(number),course:ita_courses(title)")
      .order("created_at", { ascending: false }),
    supabase.from("ita_courses").select("id,title").order("position"),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <h1 className="font-serif text-3xl text-navy">Alunos</h1>
      <p className="mb-6 mt-1 max-w-3xl text-sm text-ink/60">
        Quem tem acesso aos cursos. Ao marcar um pedido de curso como <strong>pago</strong>, o aluno entra aqui sozinho, pelo e-mail do pedido
        (mensal: 30 dias; completo: a validade do curso). Você também pode liberar acesso manualmente, por exemplo para cortesias ou vendas
        feitas fora do site.
      </p>

      <details className="mb-6 rounded-2xl border-2 border-dashed border-copper/50 bg-white/60" open={rows.length === 0}>
        <summary className="cursor-pointer list-none p-4 font-semibold text-copper">+ Liberar acesso para um aluno</summary>
        <form action={grantAccess} className="grid gap-3 border-t border-navy/10 p-4 sm:grid-cols-2">
          <label className={labelCls}>E-mail do aluno<input name="email" type="email" required className={inputCls} /></label>
          <label className={labelCls}>Nome<input name="name" className={inputCls} /></label>
          <label className={labelCls}>
            Curso
            <select name="course_id" required className={inputCls}>
              {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Tipo
              <select name="plan" defaultValue="cortesia" className={inputCls}>
                <option value="cortesia">Cortesia</option>
                <option value="completo">Completo</option>
                <option value="mensal">Mensal</option>
              </select>
            </label>
            <label className={labelCls}>Dias (0 = sem prazo)<input name="days" type="number" min={0} max={3650} defaultValue={365} className={inputCls} /></label>
          </div>
          <p className="text-xs text-ink/55 sm:col-span-2">
            O aluno entra em <strong>/aluno</strong> criando a conta com esse mesmo e-mail. Se ele já tiver acesso a esse curso, o prazo é substituído.
          </p>
          <div className="sm:col-span-2"><SubmitButton>Liberar acesso</SubmitButton></div>
        </form>
      </details>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-ink/60">Nenhum aluno ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-navy/5">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-navy/10 text-xs uppercase tracking-wider text-ink/50">
              <tr>
                <th className="p-3">Aluno</th>
                <th className="p-3">Curso</th>
                <th className="p-3">Plano</th>
                <th className="p-3">Acesso</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {rows.map((r) => {
                const expired = isExpired(r.expires_at);
                const state =
                  r.status === "cancelado" ? ["Cancelado", "bg-red-100 text-red-900"] : expired ? ["Vencido", "bg-amber-100 text-amber-900"] : ["Ativo", "bg-green-100 text-green-900"];
                return (
                  <tr key={r.id} className="align-top">
                    <td className="p-3">
                      <p className="font-semibold text-navy">{r.name || "—"}</p>
                      <p className="text-xs text-ink/60">{r.email}</p>
                      <p className="text-[11px] text-ink/45">{r.user_id ? "conta criada" : "ainda não criou conta"}</p>
                    </td>
                    <td className="p-3">{r.course?.title ?? "—"}</td>
                    <td className="p-3">
                      {PLAN[r.plan] ?? r.plan}
                      {r.order && <p className="text-[11px] text-ink/45">pedido nº {r.order.number}</p>}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${state[1]}`}>{state[0]}</span>
                      <p className="mt-1 text-xs text-ink/55">{r.expires_at ? `até ${fmt(r.expires_at)}` : "sem prazo"}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.expires_at && (
                          <form action={extendAccess} className="flex items-center gap-1">
                            <input type="hidden" name="id" value={r.id} />
                            <input name="days" type="number" min={1} max={3650} defaultValue={30} aria-label="dias" className="w-16 rounded-lg border border-navy/15 px-2 py-1 text-xs" />
                            <button className="rounded-full bg-navy px-3 py-1 text-xs text-ivory">+ dias</button>
                          </form>
                        )}
                        <form action={setEnrollmentStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value={r.status === "ativo" ? "cancelado" : "ativo"} />
                          <button className="rounded-full border border-navy/15 px-3 py-1 text-xs text-navy hover:bg-navy/5">
                            {r.status === "ativo" ? "Cancelar" : "Reativar"}
                          </button>
                        </form>
                        <form action={deleteEnrollment}>
                          <input type="hidden" name="id" value={r.id} />
                          <ConfirmButton message={`Apagar o acesso de ${r.email}? O progresso das aulas fica guardado.`} className="text-xs text-red-700 underline">
                            Apagar
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
