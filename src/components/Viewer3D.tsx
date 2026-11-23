"use client";

import { useEffect, useState } from "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
    }
  }
}

export type Hotspot = { id: string; label: string; position: string; normal?: string };

/** Visualizador 3D: girar, aproximar e ver em realidade aumentada no celular. Aceita etiquetas presas ao modelo. */
export function Viewer3D({ src, alt, orbit = "35deg 72deg 130%", hotspots = [] }: { src: string; alt: string; orbit?: string; hotspots?: Hotspot[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-b from-navy-2 to-navy">
      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-sm text-ivory/50">Carregando modelo 3D…</div>
      )}
      {ready && (
        <model-viewer
          src={src}
          alt={alt}
          camera-controls=""
          touch-action="pan-y"
          auto-rotate=""
          auto-rotate-delay="1500"
          rotation-per-second="20deg"
          interaction-prompt="auto"
          camera-orbit={orbit}
          min-camera-orbit="auto auto 60%"
          max-camera-orbit="auto auto 180%"
          shadow-intensity="0.8"
          shadow-softness="1"
          environment-image="neutral"
          exposure="1.1"
          ar=""
          ar-modes="webxr scene-viewer quick-look"
          style={{ width: "100%", height: "100%", background: "transparent", "--poster-color": "transparent" } as React.CSSProperties}
        >
          {hotspots.map((h) => (
            <button
              key={h.id}
              slot={`hotspot-${h.id}`}
              data-position={h.position}
              data-normal={h.normal ?? "0 0 1"}
              data-visibility-attribute="visible"
              className="hotspot-label pointer-events-none whitespace-nowrap rounded-full border border-ivory/30 bg-navy/85 px-2.5 py-1 text-[11px] font-semibold text-ivory shadow-lg backdrop-blur"
            >
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-copper align-middle" />
              {h.label}
            </button>
          ))}
          <button
            slot="ar-button"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-copper px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-navy shadow-lg"
          >
            Ver na sua mesa (AR)
          </button>
        </model-viewer>
      )}
    </div>
  );
}
