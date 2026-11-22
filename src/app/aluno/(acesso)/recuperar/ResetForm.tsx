"use client";

import { useActionState } from "react";
import { studentRequestReset, type FormState } from "../../actions";
import { inputCls, labelCls } from "@/components/admin/ui";

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(studentRequestReset, {});
  if (state.ok)
    return (
      <p className="mt-6 rounded-2xl bg-aqua/10 p-5 text-sm leading-relaxed text-navy">
        Se existir uma conta com esse e-mail, o link chega em alguns minutos. Confira também a caixa de spam.
      </p>
    );
  return (
    <form action={action} className="mt-6 grid gap-4">
      <label className={labelCls}>
        E-mail
        <input name="email" type="email" autoComplete="email" required className={inputCls} />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-copper py-3 text-xs font-semibold uppercase tracking-wider text-navy disabled:opacity-60">
        {pending ? "Enviando…" : "Enviar link"}
      </button>
    </form>
  );
}
