"use client";

import { useActionState, useState } from "react";
import { studentUpdatePassword, type FormState } from "../../actions";
import { inputCls, labelCls } from "@/components/admin/ui";

export function StudentPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(studentUpdatePassword, {});
  const [show, setShow] = useState(false);
  const type = show ? "text" : "password";

  return (
    <form action={action} className="mt-6 grid gap-4">
      <label className={labelCls}>
        Nova senha (mínimo 8 caracteres)
        <input name="password" type={type} autoComplete="new-password" minLength={8} required className={inputCls} />
      </label>
      <label className={labelCls}>
        Repita a nova senha
        <input name="confirm" type={type} autoComplete="new-password" minLength={8} required className={inputCls} />
      </label>
      <label className="flex items-center gap-2 text-xs text-ink/70">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-copper" />
        Mostrar senha
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-copper py-3 text-xs font-semibold uppercase tracking-wider text-navy disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
