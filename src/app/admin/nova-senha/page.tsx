import Link from "next/link";
import { LogoMark, LogoName } from "@/components/Logo";
import { NewPasswordForm } from "./NewPasswordForm";

export const instant = false;

export default function NovaSenhaPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-navy p-6">
      <div className="w-full max-w-sm rounded-2xl bg-ivory p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-center gap-3 text-copper">
          <LogoMark className="h-8 w-auto" />
          <LogoName className="h-5 w-auto" />
        </div>
        <h1 className="text-center font-serif text-xl text-navy">Criar nova senha</h1>
        <NewPasswordForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/admin" className="text-navy/70 underline hover:text-copper">Voltar ao painel</Link>
        </p>
      </div>
    </main>
  );
}
