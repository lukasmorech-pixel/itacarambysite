import { requireAdmin } from "@/lib/admin";
import { ItemsEditor } from "../../ItemsEditor";

export const instant = false;

export default async function CursosPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("ita_courses").select("*").order("position");
  return (
    <>
      <h1 className="font-serif text-3xl text-navy">Loja — Cursos</h1>
      <p className="mb-6 mt-1 text-sm text-ink/60">
        Defina a mensalidade e/ou o valor do curso completo. Deixe um dos preços vazio para não oferecer aquela opção. Cada curso tem a própria página na loja; abra o curso e clique em “Editar módulos e aulas” para montar o conteúdo.
      </p>
      <ItemsEditor kind="courses" rows={data ?? []} addLabel="Adicionar curso" />
    </>
  );
}
