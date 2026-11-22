import { StudentPasswordForm } from "./StudentPasswordForm";

export const instant = false;

export default function NovaSenhaAlunoPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-navy/5">
        <h1 className="font-serif text-2xl text-navy">Criar nova senha</h1>
        <p className="mt-2 text-sm text-ink/60">Escolha uma senha com pelo menos 8 caracteres.</p>
        <StudentPasswordForm />
      </div>
    </div>
  );
}
