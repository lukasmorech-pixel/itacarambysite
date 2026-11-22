import Link from "next/link";
import { ResetForm } from "./ResetForm";

export const instant = false;

export default async function RecuperarPage({ searchParams }: PageProps<"/aluno/recuperar">) {
  const { erro } = await searchParams;
  return (
    <>
      <h1 className="text-center font-serif text-2xl text-navy">Esqueci minha senha</h1>
      <p className="mt-2 text-center text-sm text-ink/60">Enviamos um link para você criar uma senha nova.</p>
      {erro === "link" && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">Esse link expirou ou já foi usado. Peça um novo abaixo.</p>
      )}
      <ResetForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/aluno/entrar" className="text-navy/70 underline hover:text-copper">Voltar para entrar</Link>
      </p>
    </>
  );
}
