/**
 * Converte o link de vídeo colado no painel num endereço de incorporação seguro.
 * Aceita Bunny Stream, YouTube e Vimeo; qualquer outro endereço é ignorado (retorna null).
 */
export function embedUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\./, "");
  const parts = u.pathname.split("/").filter(Boolean);

  // Bunny Stream: iframe.mediadelivery.net/embed/{biblioteca}/{vídeo} (ou /play/...)
  if (host === "iframe.mediadelivery.net" || host === "player.mediadelivery.net") {
    if ((parts[0] === "embed" || parts[0] === "play") && parts[1] && parts[2]) {
      const out = new URL(`https://iframe.mediadelivery.net/embed/${parts[1]}/${parts[2]}`);
      out.searchParams.set("autoplay", "false");
      out.searchParams.set("preload", "true");
      for (const k of ["token", "expires"]) {
        const v = u.searchParams.get(k);
        if (v) out.searchParams.set(k, v);
      }
      return out.toString();
    }
    return null;
  }
  // YouTube
  let yt: string | null = null;
  if (host === "youtu.be") yt = parts[0] ?? null;
  else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") yt = u.searchParams.get("v");
    else if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") yt = parts[1] ?? null;
  }
  if (yt) return /^[\w-]{6,20}$/.test(yt) ? `https://www.youtube-nocookie.com/embed/${yt}?rel=0` : null;
  // Vimeo
  if (host === "vimeo.com" && /^\d+$/.test(parts[0] ?? "")) return `https://player.vimeo.com/video/${parts[0]}`;
  if (host === "player.vimeo.com" && parts[0] === "video" && /^\d+$/.test(parts[1] ?? "")) return `https://player.vimeo.com/video/${parts[1]}`;
  return null;
}
