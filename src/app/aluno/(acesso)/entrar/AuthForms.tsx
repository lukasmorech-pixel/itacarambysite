"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { studentLogin, studentSignup, type FormState } from "../../actions";
import { inputCls, labelCls } from "@/components/admin/ui";

const btn = "rounded-full bg-copper py-3 text-xs font-semibold uppercase tracking-wider text-navy hover:brightness-105 disabled:opacity-60";

export function AuthForms({ next, initial }: { next: string; initial: "entrar" | "criar" }) {
  const [mode, setMode] = useState(initial);
  const [loginState, login, loggingIn] = useActionState<FormState, FormData>(studentLogin, {});
  const [signupState, signup, signingUp] = useActionState<FormState, FormData>(studentSignup, {});

  return (
    <div className="mt-6">
      <div role="tablist" className="grid grid-cols-2 rounded-full bg-navy/5 p-1 text-sm font-semibold">
        {(["entrar", "criar"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full py-2 transition ${mode === m ? "bg-white text-navy shadow-sm" : "text-ink/50 hover:text-navy"}`}
          >
            {m === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      {mode === "entrar" ? (
        <form action={login} className="mt-6 grid gap-4">
          <input type="hidden" name="voltar" value={next} />
          <label className={labelCls}>
            E-mail
            <input name="email" type="email" autoComplete="email" required className={inputCls} />
          </label>
          <label className={labelCls}>
            Senha
            <input name="password" type="password" autoComplete="current-password" required className={inputCls} />
          </label>
          {loginState.error && <p className="text-sm text-red-700">{loginState.error}</p>}
          <button type="submit" disabled={loggingIn} className={btn}>{loggingIn ? "Entrando…" : "Entrar"}</button>
          <Link href="/aluno/recuperar" className="text-center text-sm text-navy/70 underline hover:text-copper">Esqueci minha senha</Link>
        </form>
      ) : signupState.ok ? (
        <div className="mt-6 rounded-2xl bg-aqua/10 p-5 text-sm leading-relaxed text-navy">
          <p className="font-semibold">Quase lá!</p>
          <p className="mt-1">{signupState.info}</p>
          <p className="mt-3 text-xs text-ink/60">Não chegou? Confira a caixa de spam ou fale com a gente pelo WhatsApp.</p>
        </div>
      ) : (
        <form action={signup} className="mt-6 grid gap-4">
          <input type="hidden" name="voltar" value={next} />
          <label className={labelCls}>
            Nome completo
            <input name="name" autoComplete="name" required className={inputCls} />
          </label>
          <label className={labelCls}>
            E-mail
            <input name="email" type="email" autoComplete="email" required className={inputCls} />
          </label>
          <p className="-mt-2 text-xs text-ink/55">Use o mesmo e-mail da sua compra: é por ele que o curso é liberado.</p>
          <label className={labelCls}>
            Senha
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputCls} />
          </label>
          {signupState.error && <p className="text-sm text-red-700">{signupState.error}</p>}
          <button type="submit" disabled={signingUp} className={btn}>{signingUp ? "Criando…" : "Criar minha conta"}</button>
        </form>
      )}
    </div>
  );
}
