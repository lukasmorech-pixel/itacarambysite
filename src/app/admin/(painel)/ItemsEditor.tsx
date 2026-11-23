import Link from "next/link";
import { deleteItem, moveItem, saveItem } from "../actions";
import { ImageField } from "@/components/admin/ImageField";
import { FileField } from "@/components/admin/FileField";
import { ConfirmButton, IconButton, SubmitButton, inputCls, labelCls } from "@/components/admin/ui";
import { brl } from "@/content/site";

export type Kind = "services" | "gallery" | "partners" | "testimonials" | "products" | "courses";
type Row = Record<string, unknown> & { id: string; published: boolean };

const titleOf = (kind: Kind, r: Row) => {
  if (kind === "testimonials" || kind === "partners") return String(r.name);
  if (kind === "products") return `${r.name} · ${brl(Number(r.price_cents))} · ${r.kind === "digital" ? "digital" : "físico"}`;
  return String(r.title);
};

/** modelos 3D disponíveis em /public/3d */
const MODELS_3D: [string, string][] = [
  ["/3d/estudo-parcial.glb", "Par parcialmente desdentado"],
  ["/3d/estudo-total.glb", "Par desdentado total"],
  ["/3d/estudo-implante.glb", "Par com 4 análogos de implante"],
  ["/3d/protocolo.glb", "Protocolo superior sobre implantes"],
  ["/3d/protocolo-inferior.glb", "Protocolo inferior sobre 6 implantes"],
  ["/3d/ppr-inferior.glb", "Prótese parcial removível (PPR) inferior"],
  ["/3d/implante-coroa.glb", "Implante com coroa"],
];

/** centavos -> "180,00" para o campo de preço */
const money = (c: unknown) => (c == null || c === "" ? "" : (Number(c) / 100).toFixed(2).replace(".", ","));

function Fields({ kind, r }: { kind: Kind; r?: Row }) {
  const v = (k: string) => (r?.[k] as string | undefined) ?? "";
  switch (kind) {
    case "products":
      return (
        <>
          <label className={labelCls}>
            Tipo
            <select name="kind" defaultValue={v("kind") || "fisico"} className={inputCls}>
              <option value="fisico">Modelo físico (envio ou retirada)</option>
              <option value="digital">Arquivo digital (download)</option>
            </select>
          </label>
          <label className={labelCls}>Preço (R$)<input name="price" required inputMode="decimal" defaultValue={money(r?.price_cents)} placeholder="180,00" className={inputCls} /></label>
          <label className={`${labelCls} sm:col-span-2`}>Nome<input name="name" required defaultValue={v("name")} className={inputCls} /></label>
          <label className={`${labelCls} sm:col-span-2`}>
            Descrição
            <textarea name="description" rows={3} defaultValue={v("description")} className={inputCls} />
          </label>
          <ImageField name="image_url" defaultValue={v("image_url")} folder="loja" />
          <FileField name="file_path" defaultValue={v("file_path")} label="Arquivo (só para produto digital)" />
          <label className={`${labelCls} sm:col-span-2`}>
            Modelo 3D (opcional) — mostra o botão “Ver em 3D” na loja
            <select name="model_url" defaultValue={v("model_url")} className={inputCls}>
              <option value="">Sem modelo 3D</option>
              {MODELS_3D.map(([file, label]) => (
                <option key={file} value={file}>{label}</option>
              ))}
            </select>
          </label>
        </>
      );
    case "courses":
      return (
        <>
          <label className={labelCls}>Nome do curso<input name="title" required defaultValue={v("title")} className={inputCls} /></label>
          <label className={labelCls}>Endereço (slug)<input name="slug" defaultValue={v("slug")} placeholder="gerado pelo nome" className={inputCls} /></label>
          <label className={`${labelCls} sm:col-span-2`}>Subtítulo<input name="subtitle" defaultValue={v("subtitle")} className={inputCls} /></label>
          <label className={`${labelCls} sm:col-span-2`}>
            Descrição
            <textarea name="description" rows={4} defaultValue={v("description")} className={inputCls} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Destaques (um por linha)
            <textarea name="highlights" rows={4} defaultValue={((r?.highlights as string[]) ?? []).join("\n")} className={inputCls} />
          </label>
          <label className={labelCls}>Mensalidade (R$) — vazio = sem assinatura<input name="price_monthly" inputMode="decimal" defaultValue={money(r?.price_monthly_cents)} placeholder="97,00" className={inputCls} /></label>
          <label className={labelCls}>Curso completo (R$) — vazio = sem compra única<input name="price_full" inputMode="decimal" defaultValue={money(r?.price_full_cents)} placeholder="697,00" className={inputCls} /></label>
          <label className={labelCls}>Validade da compra única (dias)<input name="access_days" type="number" min={1} defaultValue={String(r?.access_days ?? 365)} className={inputCls} /></label>
          <ImageField name="image_url" defaultValue={v("image_url")} folder="cursos" label="Imagem de capa" />
        </>
      );
    case "services":
      return (
        <>
          <label className={labelCls}>Nome do serviço<input name="title" required defaultValue={v("title")} className={inputCls} /></label>
          <label className={labelCls}>Descrição curta<input name="text" defaultValue={v("text")} className={inputCls} /></label>
          <label className={`${labelCls} sm:col-span-2`}>
            Itens (um por linha)
            <textarea name="items" rows={4} defaultValue={((r?.items as string[]) ?? []).join("\n")} className={inputCls} />
          </label>
          <ImageField name="image_url" defaultValue={v("image_url")} folder="servicos" />
        </>
      );
    case "gallery":
      return (
        <>
          <label className={labelCls}>Título<input name="title" required defaultValue={v("title")} className={inputCls} /></label>
          <label className={labelCls}>Etiqueta (ex.: Implantes, E.max)<input name="tag" defaultValue={v("tag")} className={inputCls} /></label>
          <ImageField name="image_url" defaultValue={v("image_url")} folder="galeria" />
        </>
      );
    case "partners":
      return (
        <>
          <label className={labelCls}>Nome da clínica / dentista<input name="name" required defaultValue={v("name")} className={inputCls} /></label>
          <ImageField name="logo_url" defaultValue={v("logo_url")} label="Logo (opcional)" folder="parceiros" />
        </>
      );
    case "testimonials":
      return (
        <>
          <label className={labelCls}>Nome<input name="name" required defaultValue={v("name")} className={inputCls} placeholder="Dra. Maria Silva" /></label>
          <label className={labelCls}>Cargo / especialidade<input name="role" defaultValue={v("role")} className={inputCls} placeholder="Implantodontista" /></label>
          <label className={`${labelCls} sm:col-span-2`}>
            Depoimento
            <textarea name="quote" required rows={3} defaultValue={v("quote")} className={inputCls} />
          </label>
        </>
      );
  }
}

function ItemForm({ kind, r }: { kind: Kind; r?: Row }) {
  return (
    <form action={saveItem} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="_table" value={kind} />
      {r && <input type="hidden" name="id" value={r.id} />}
      <Fields kind={kind} r={r} />
      <div className="flex items-center justify-between gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={r ? r.published : true} className="h-4 w-4 accent-copper" />
          Mostrar no site
        </label>
        <SubmitButton>{r ? "Salvar" : "Adicionar"}</SubmitButton>
      </div>
    </form>
  );
}

export function ItemsEditor({ kind, rows, addLabel }: { kind: Kind; rows: Row[]; addLabel: string }) {
  return (
    <div className="grid gap-4">
      {rows.map((r, i) => (
        <details key={r.id} className="group rounded-2xl bg-white shadow-sm ring-1 ring-navy/5">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
            {typeof (r.image_url ?? r.logo_url) === "string" && (r.image_url || r.logo_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={String(r.image_url || r.logo_url)} alt="" className="h-12 w-16 shrink-0 rounded-md bg-navy object-cover" />
            ) : null}
            <span className="flex-1">
              <span className="font-semibold text-navy">{titleOf(kind, r)}</span>
              {!r.published && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] uppercase">oculto</span>}
            </span>
            <span className="text-xs text-aqua group-open:hidden">Editar</span>
          </summary>
          <div className="grid gap-4 border-t border-navy/10 p-4">
            {kind === "courses" && (
              <div className="flex flex-wrap gap-3 rounded-xl bg-aqua/10 p-3 text-sm">
                <Link href={`/admin/loja/cursos/${r.id}`} className="font-semibold text-navy underline">
                  Editar módulos e aulas →
                </Link>
                {r.published ? (
                  <Link href={`/loja/cursos/${r.slug}`} target="_blank" className="text-aqua underline">Ver página do curso ↗</Link>
                ) : null}
              </div>
            )}
            <ItemForm kind={kind} r={r} />
            <div className="flex items-center gap-2 border-t border-navy/10 pt-3">
              <form action={moveItem}>
                <input type="hidden" name="_table" value={kind} />
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="dir" value="up" />
                {i > 0 && <IconButton title="Subir">↑</IconButton>}
              </form>
              <form action={moveItem}>
                <input type="hidden" name="_table" value={kind} />
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="dir" value="down" />
                {i < rows.length - 1 && <IconButton title="Descer">↓</IconButton>}
              </form>
              <form action={deleteItem} className="ml-auto">
                <input type="hidden" name="_table" value={kind} />
                <input type="hidden" name="id" value={r.id} />
                <ConfirmButton message="Apagar este item? Não dá para desfazer." className="text-xs text-red-700 underline">
                  Apagar
                </ConfirmButton>
              </form>
            </div>
          </div>
        </details>
      ))}
      {rows.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink/60">Nada cadastrado ainda.</p>}

      <details className="rounded-2xl border-2 border-dashed border-copper/50 bg-white/60">
        <summary className="cursor-pointer list-none p-4 font-semibold text-copper">+ {addLabel}</summary>
        <div className="border-t border-navy/10 p-4">
          <ItemForm kind={kind} />
        </div>
      </details>
    </div>
  );
}
