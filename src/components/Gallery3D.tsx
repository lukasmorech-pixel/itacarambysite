"use client";

import { useState } from "react";
import { Viewer3D } from "@/components/Viewer3D";

const MODELS = [
  {
    id: "coroa",
    tab: "Coroa sobre implante",
    title: "Coroa sobre implante, de todos os ângulos.",
    text: "Gire, aproxime e observe os detalhes: a anatomia das cúspides, o encaixe no pilar e o implante rosqueado.",
    points: ["Coroa em cerâmica sobre pilar e implante de titânio"],
    src: "/3d/implante-coroa.glb",
    alt: "Modelo 3D de coroa de molar sobre implante",
    orbit: "35deg 72deg 130%",
  },
  {
    id: "protocolo",
    tab: "Protocolo sobre implantes",
    title: "Protocolo superior sobre 4 implantes.",
    text: "Arcada completa fixa sobre implantes: dentes com anatomia e cor individual, gengiva em resina caracterizada e implantes posteriores inclinados para aproveitar melhor o osso.",
    points: ["14 dentes sobre gengiva em resina caracterizada", "2 implantes retos e 2 inclinados (técnica All-on-4)"],
    src: "/3d/protocolo.glb",
    alt: "Modelo 3D de protocolo superior sobre quatro implantes",
    orbit: "0deg 82deg 100%",
  },
  {
    id: "protocolo-inferior",
    tab: "Protocolo inferior",
    title: "Protocolo inferior sobre 6 implantes.",
    text: "A prótese aparece separada da base para você ver como ela se encaixa: 12 dentes sobre gengiva em resina, parafusados nos pilares de titânio instalados no rebordo.",
    points: ["12 dentes sobre gengiva em resina", "6 implantes com pilares multi-unit, vista explodida"],
    src: "/3d/protocolo-inferior.glb",
    alt: "Modelo 3D de protocolo inferior sobre seis implantes, com a prótese separada da base",
    orbit: "15deg 65deg 105%",
  },
];

export function Gallery3D() {
  const [active, setActive] = useState(MODELS[0].id);
  const m = MODELS.find((x) => x.id === active) ?? MODELS[0];

  return (
    <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">Veja em 3D</p>
        <div role="tablist" aria-label="Modelos 3D" className="mb-6 flex flex-wrap gap-2">
          {MODELS.map((x) => (
            <button
              key={x.id}
              role="tab"
              aria-selected={x.id === active}
              onClick={() => setActive(x.id)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                x.id === active ? "border-copper bg-copper text-navy" : "border-ivory/25 text-ivory/70 hover:border-copper hover:text-copper"
              }`}
            >
              {x.tab}
            </button>
          ))}
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl">{m.title}</h2>
        <p className="mt-5 leading-relaxed text-ivory/70">
          {m.text} No celular, toque em <strong className="text-copper">“Ver na sua mesa”</strong> para ver a peça em realidade aumentada.
        </p>
        <ul className="mt-8 grid gap-3 text-sm text-ivory/75">
          <li className="flex gap-3"><span className="text-copper">●</span> Arraste para girar · role ou faça pinça para aproximar</li>
          {m.points.map((p) => (
            <li key={p} className="flex gap-3"><span className="text-copper">●</span> {p}</li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-ivory/40">Modelos ilustrativos.</p>
      </div>
      <Viewer3D key={m.id} src={m.src} alt={m.alt} orbit={m.orbit} />
    </div>
  );
}
