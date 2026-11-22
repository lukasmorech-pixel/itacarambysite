"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Envia um arquivo (ex.: STL) para a pasta PRIVADA da loja e guarda o caminho num input escondido. */
export function FileField({
  name,
  defaultValue = "",
  label = "Arquivo para download",
  folder = "produtos",
  note = "Fica numa pasta privada: só quem comprou recebe o link.",
  nameField,
}: {
  name: string;
  defaultValue?: string;
  label?: string;
  folder?: string;
  note?: string;
  /** se informado, guarda também o nome original do arquivo neste campo */
  nameField?: string;
}) {
  const [path, setPath] = useState(defaultValue);
  const [original, setOriginal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      setError("O arquivo passa de 200 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const safe = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "-");
      const p = `${folder}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await createBrowserSupabase().storage.from("itacaramby-arquivos").upload(p, file, { upsert: false });
      if (upErr) throw upErr;
      setPath(p);
      setOriginal(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar o arquivo.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-navy/70">{label}</span>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex cursor-pointer rounded-full bg-navy px-4 py-2 text-xs font-semibold text-ivory hover:bg-navy-2">
          {busy ? "Enviando…" : path ? "Trocar arquivo" : "Escolher arquivo"}
          <input type="file" onChange={onFile} disabled={busy} className="hidden" />
        </label>
        <span className="text-xs text-ink/60">{path ? `📎 ${path.split("/").pop()?.replace(/^[0-9a-f-]{37}/, "")}` : "nenhum arquivo"}</span>
      </div>
      <p className="text-[11px] text-ink/50">{note}</p>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <input type="hidden" name={name} value={path} />
      {nameField && <input type="hidden" name={nameField} value={original} />}
    </div>
  );
}
