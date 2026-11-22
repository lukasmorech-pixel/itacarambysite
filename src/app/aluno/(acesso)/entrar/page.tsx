import { AuthForms } from "./AuthForms";

export const instant = false;

export default async function EntrarPage({ searchParams }: PageProps<"/aluno/entrar">) {
  const { voltar, modo } = await searchParams;
  const next = typeof voltar === "string" && voltar.startsWith("/aluno") ? voltar : "/aluno";
  return (
    <>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">Área do Aluno</p>
      <h1 className="mt-2 text-center font-serif text-2xl text-navy">Seus cursos Itacaramby</h1>
      <AuthForms next={next} initial={modo === "criar" ? "criar" : "entrar"} />
    </>
  );
}
