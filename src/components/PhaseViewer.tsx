"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Phase } from "@/content/site";
import "@/components/Viewer3D"; // tipos do <model-viewer>

const STEP_MS = 5000;

/**
 * Animação das fases de um curso: o mesmo modelo 3D muda de fase em fase.
 * Toca sozinho (pausa quando a pessoa interage ou quando sai da tela) e aceita links #fase-N.
 */
export function PhaseViewer({
  phases,
  initial = 0,
  autoplay = true,
  compact = false,
  moduleLinkPrefix,
}: {
  phases: Phase[];
  initial?: number;
  autoplay?: boolean;
  compact?: boolean;
  /** prefixo do link para o módulo da fase, ex.: "#modulo-" (âncora na ementa) */
  moduleLinkPrefix?: string;
}) {
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(Math.min(Math.max(initial, 0), phases.length - 1));
  const [playing, setPlaying] = useState(autoplay);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const mv = useRef<HTMLElement>(null);

  useEffect(() => {
    import("@google/model-viewer").then(() => setReady(true));
  }, []);

  // só anima quando está na tela
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // links #fase-N (ex.: vindo da ementa)
  useEffect(() => {
    const go = () => {
      const m = window.location.hash.match(/^#fase-(\d+)$/);
      if (!m) return;
      const n = Number(m[1]) - 1;
      if (n >= 0 && n < phases.length) {
        setIdx(n);
        setPlaying(false);
        box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [phases.length]);

  // avisa quando o modelo da fase terminou de carregar
  useEffect(() => {
    const el = mv.current;
    if (!el) return;
    const done = () => setLoading(false);
    el.addEventListener("load", done);
    return () => el.removeEventListener("load", done);
  }, [ready]);

  // baixa as outras fases em segundo plano depois da primeira
  useEffect(() => {
    if (loading || !ready) return;
    phases.forEach((p, i) => i !== idx && fetch(p.model, { priority: "low" } as RequestInit).catch(() => {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loading === false]);

  // avanço automático
  useEffect(() => {
    if (!playing || !visible || loading) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % phases.length), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, visible, loading, idx, phases.length]);

  const go = useCallback(
    (i: number) => {
      setPlaying(false);
      setIdx((i + phases.length) % phases.length);
    },
    [phases.length],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
  }, [idx]);

  if (!phases.length) return null;
  const p = phases[idx];
  const href = moduleLinkPrefix ? `${moduleLinkPrefix}${p.module}` : null;
  const running = playing && visible && !loading;

  return (
    <div ref={box} className="overflow-hidden rounded-3xl bg-gradient-to-b from-navy-2 to-navy text-ivory shadow-xl">
      <div className={`relative ${compact ? "aspect-[16/9]" : "aspect-[16/10]"} w-full`}>
        {ready && (
          <model-viewer
            ref={mv}
            src={p.model}
            alt={`Modelo 3D — fase ${idx + 1}: ${p.title}`}
            camera-controls=""
            touch-action="pan-y"
            auto-rotate=""
            auto-rotate-delay="0"
            rotation-per-second="14deg"
            camera-orbit="0deg 68deg 105%"
            min-camera-orbit="auto auto 60%"
            max-camera-orbit="auto auto 160%"
            interaction-prompt="none"
            shadow-intensity="0.7"
            environment-image="neutral"
            exposure="1.05"
            style={{ width: "100%", height: "100%", background: "transparent", "--poster-color": "transparent" } as React.CSSProperties}
          />
        )}
        <div
          className={`pointer-events-none absolute inset-0 grid place-items-center bg-navy/40 text-sm text-ivory/70 transition-opacity duration-300 ${
            loading ? "opacity-100" : "opacity-0"
          }`}
        >
          Carregando fase…
        </div>
        <div className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-copper">
            Fase {idx + 1} de {phases.length}
          </p>
          <p className={`mt-1 font-serif ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>{p.title}</p>
        </div>
        <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-5">
          <button onClick={() => go(idx - 1)} aria-label="Fase anterior" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20">‹</button>
          <button
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "Pausar animação" : "Tocar animação"}
            className="grid h-9 w-9 place-items-center rounded-full bg-copper text-navy hover:brightness-105"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button onClick={() => go(idx + 1)} aria-label="Próxima fase" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20">›</button>
        </div>
      </div>

      {/* linha do tempo */}
      <div className="px-4 pb-5 sm:px-6">
        <ol className="flex gap-1.5" aria-label="Fases">
          {phases.map((ph, i) => (
            <li key={i} className="flex-1">
              <button onClick={() => go(i)} className="group block w-full text-left" aria-current={i === idx ? "step" : undefined} title={ph.title}>
                <span className="block h-1.5 overflow-hidden rounded-full bg-white/15">
                  <span
                    key={`${i}-${idx}-${running}`}
                    className="block h-full rounded-full bg-copper"
                    style={
                      i === idx && running
                        ? { width: "100%", animation: `phase-fill ${STEP_MS}ms linear both` }
                        : { width: i <= idx ? "100%" : "0%", opacity: i === idx ? 1 : 0.55 }
                    }
                  />
                </span>
                {!compact && (
                  <span className={`mt-2 hidden text-[11px] leading-tight sm:block ${i === idx ? "text-ivory" : "text-ivory/45 group-hover:text-ivory/75"}`}>
                    {i + 1}. {ph.title}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
        <p className={`mt-4 max-w-3xl leading-relaxed text-ivory/75 ${compact ? "text-sm" : "text-[15px]"}`}>{p.text}</p>
        {href && (
          <a href={href} className="mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-copper underline">
            Ensinado no módulo {p.module} →
          </a>
        )}
      </div>
    </div>
  );
}
