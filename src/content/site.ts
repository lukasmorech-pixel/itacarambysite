// Conteúdo padrão do site. É usado como reserva quando o banco (Supabase) não está configurado
// e foi o conteúdo inicial cadastrado no banco. Depois disso, edite pelo painel em /admin.

export type Stat = { value: string; label: string };
export type LeadTime = { item: string; days: string };

export type Settings = {
  cro: string;
  city: string;
  hero: { eyebrow: string; title1: string; title2: string; text: string };
  about: { title: string; paragraphs: string[]; stats: Stat[] };
  owner: { name: string; role: string; photo: string };
  contact: { whatsapp: string; whatsappLabel: string; email: string; instagram: string; address: string };
  leadTimes: LeadTime[];
  verse: { text: string; ref: string };
  store: { shippingFlatCents: number; pickupNote: string };
};

export type Product = {
  id: string;
  kind: "fisico" | "digital";
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  /** modelo 3D (.glb) opcional, mostrado no botão "Ver em 3D" */
  model_url?: string;
};
/** Uma fase do curso mostrada em 3D (animação na página do curso e nas aulas). */
export type Phase = { title: string; text: string; model: string; module: number };
export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  highlights: string[];
  price_monthly_cents: number | null;
  price_full_cents: number | null;
  access_days: number;
};

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type Service = { id: string; title: string; text: string; items: string[]; image_url: string };
export type GalleryItem = { id: string; title: string; tag: string; image_url: string };
export type Partner = { id: string; name: string; logo_url: string };
export type Testimonial = { id: string; quote: string; name: string; role: string };

export type SiteContent = {
  settings: Settings;
  services: Service[];
  gallery: GalleryItem[];
  partners: Partner[];
  testimonials: Testimonial[];
};

export const SITE_NAME = "Itacaramby";
export const SITE_TAGLINE = "Estética em Prótese Dentária";

export const defaultSettings: Settings = {
  cro: "CRO 430",
  city: "Anápolis - GO",
  hero: {
    eyebrow: "ESTÉTICA • PRECISÃO • COMPROMISSO",
    title1: "O sorriso do seu paciente",
    title2: "começa na nossa bancada.",
    text: "Coroas, facetas, protocolos e próteses totais e removíveis feitas com materiais de primeira linha e acabamento estético. Envie seu caso pelo WhatsApp e receba no prazo.",
  },
  about: {
    title: "Onde a técnica encontra o detalhe.",
    paragraphs: [
      "O Itacaramby é um laboratório de prótese dentária em Anápolis dedicado à estética. Trabalhamos lado a lado com o dentista, do planejamento à entrega, para que cada peça chegue ao consultório pronta para o paciente.",
      "Seguimos investindo em cursos, equipamentos e materiais de qualidade — E.max, Rosetta, Signum, Resilab, metalocerâmica e ligas metálicas — para entregar trabalhos com adaptação precisa e aparência natural.",
    ],
    stats: [
      { value: "CRO 430", label: "laboratório registrado" },
      { value: "5 dias", label: "prazo a partir de 5 dias úteis" },
      { value: "30+", label: "tipos de trabalho" },
    ],
  },
  owner: {
    name: "Cesar Itacaramby",
    role: "Técnico em Prótese Dentária · Responsável técnico",
    photo: "/img/responsavel.png",
  },
  contact: {
    whatsapp: "5562984490810",
    whatsappLabel: "(62) 98449-0810",
    email: "itacaramby76@outlook.com",
    instagram: "",
    address: "Rua Dinamarca, Qd. 37, Lt. 14, nº 14 — Vila Santa Isabel, Anápolis - GO, CEP 75083-323",
  },
  leadTimes: [
    { item: "N.M.F / R.M.F", days: "5 dias úteis" },
    { item: "Montagem de dentes", days: "5 dias úteis" },
    { item: "Acrilização", days: "5 dias úteis" },
    { item: "Metal C.M.C", days: "7 dias úteis" },
    { item: "Grade da PPR", days: "10 dias úteis" },
    { item: "C.M.C direta", days: "10 dias úteis" },
    { item: "Estrutura metálica de protocolo", days: "10 dias úteis" },
    { item: "Metal C.M.C sobre implante", days: "10 dias úteis" },
  ],
  verse: {
    text: "Confia os teus cuidados ao Senhor, e ele te sustentará; jamais permitirá que o justo seja abalado.",
    ref: "Salmos 55.22",
  },
  store: {
    shippingFlatCents: 3500,
    pickupNote: "Retirada no laboratório em Anápolis - GO. Combine o horário pelo WhatsApp.",
  },
};

const s = (id: string, title: string, text: string, items: string[], image_url: string): Service => ({ id, title, text, items, image_url });

export const defaultContent: SiteContent = {
  settings: defaultSettings,
  services: [
    s("1", "E.max e Rosetta", "Cerâmicas de alta estética para coroas, facetas e lentes.", ["Coroa", "Onlay / Inlay", "Faceta ou lente", "Fragmento", "E.max"], "/img/dissilicato.png"),
    s("2", "Metalocerâmica", "Resistência e estética para unitários, pontes e implantes.", ["Coroa metalocerâmica", "Coroa sobre implante", "Protocolo metalocerâmico", "Protocolo com gengiva cerâmica"], "/img/coroas-implante.png"),
    s("3", "Signum e Resilab", "Resinas laboratoriais para coroas e restaurações indiretas.", ["Coroa Signum", "Coroa Resilab", "Onlay / Inlay Signum", "Onlay / Inlay Resilab"], "/img/ceramica.png"),
    s("4", "Protocolos sobre implantes", "Reabilitações fixas sobre implantes, do provisório ao definitivo.", ["Protocolo em resina", "Protocolo provisório", "Barra de protocolo", "Barra com O-ring"], "/img/protocolo-ceramica.png"),
    s("5", "Próteses totais", "Dentaduras com acabamento rosa, caracterizado ou customizado.", ["Prótese total rosa", "Prótese total caracterizada", "Prótese total customizada", "Prótese total imediata", "Clonagem de PT"], "/img/protese-total.png"),
    s("6", "Removíveis e estruturas metálicas", "PPR e núcleos em liga de prata, cromo e metal amarelo.", ["Prótese parcial removível", "N.M.F e R.M.F (prata, cromo, metal amarelo)", "Coping metálico"], "/img/ppr.png"),
    s("7", "Placas, guias e outros", "Trabalhos complementares para o dia a dia do consultório.", ["Guia cirúrgico", "Placa de clareamento", "Placa de bruxismo (silicone ou acrílica)", "Veneer em Art Glass ou resina acrílica"], "/img/protocolo-resina.png"),
    s("8", "Trabalhos fracionados", "Etapas avulsas para complementar o seu fluxo.", ["Provisório", "Moldeira individual", "Montagem e prensagem (PT/PPR)", "Troca de dentes", "Aplicação de cerâmica"], ""),
  ],
  gallery: [
    { id: "1", title: "Coroas sobre implante", tag: "Metalocerâmica", image_url: "/img/coroas-implante.png" },
    { id: "2", title: "Protocolo com gengiva", tag: "Implantes", image_url: "/img/protocolo-ceramica.png" },
    { id: "3", title: "Coroas em cerâmica", tag: "Cerâmica", image_url: "/img/ceramica.png" },
    { id: "4", title: "Prótese total", tag: "PT", image_url: "/img/protese-total.png" },
    { id: "5", title: "Protocolo em resina", tag: "Implantes", image_url: "/img/protocolo-resina.png" },
    { id: "6", title: "Prótese parcial removível", tag: "PPR", image_url: "/img/ppr.png" },
    { id: "7", title: "Onlays em dissilicato", tag: "E.max", image_url: "/img/dissilicato.png" },
  ],
  partners: [],
  testimonials: [],
};

export const steps = [
  { title: "Envie o caso", text: "Fale com a gente pelo WhatsApp e combine a coleta do modelo ou moldagem, com cor e informações do paciente." },
  { title: "Planejamento", text: "Avaliamos o caso e alinhamos com você material, prazo e detalhes estéticos." },
  { title: "Confecção", text: "Produção no laboratório com materiais de primeira linha e acabamento manual." },
  { title: "Entrega", text: "Peça conferida e entregue no prazo combinado, pronta para o consultório." },
];

export function whatsappLink(number: string, message?: string) {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function mapsLink(address: string) {
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
}
