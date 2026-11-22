import { claimOrder } from "../../actions";
import { requireStudent } from "@/lib/aluno";

export const instant = false;

// Aberta pelo botão "Ativar na minha conta" da página do pedido.
export default async function AtivarPage({ searchParams }: PageProps<"/aluno/ativar">) {
  const { pedido, t } = await searchParams;
  const { user } = await requireStudent();
  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-navy/5">
        <h1 className="font-serif text-2xl text-navy">Ativar curso na sua conta</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          O curso deste pedido vai ficar disponível na conta <strong>{user.email}</strong>. Depois é só entrar com ela para estudar.
        </p>
        <form action={claimOrder} className="mt-6">
          <input type="hidden" name="id" value={typeof pedido === "string" ? pedido : ""} />
          <input type="hidden" name="t" value={typeof t === "string" ? t : ""} />
          <button className="rounded-full bg-copper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-navy hover:brightness-105">
            Ativar acesso
          </button>
        </form>
      </div>
    </div>
  );
}
