"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Mostra o aviso de erro que as ações do painel mandam em ?erro= (ex.: campo obrigatório). */
export function AdminNotice() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const erro = params.get("erro");
  if (!erro) return null;

  const close = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("erro");
    const q = next.toString();
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  };

  return (
    <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <span aria-hidden className="text-lg leading-none">⚠</span>
      <p className="flex-1">
        <strong>Não foi possível salvar.</strong> {erro}
      </p>
      <button onClick={close} className="text-xs underline" aria-label="Fechar aviso">Fechar</button>
    </div>
  );
}
