-- Itacaramby: fases do curso em 3D (animação na página do curso e nas aulas).
-- phases = [{ "title": "...", "text": "...", "model": "/3d/fases/...glb", "module": 1 }, ...]
alter table public.ita_courses add column if not exists phases jsonb not null default '[]'::jsonb;

update public.ita_courses set phases = $j$[
  {"module": 1, "model": "/3d/fases/masterclass-1.glb", "title": "Planejamento em cera",
   "text": "Os dentes montados em cera mostram o projeto da prótese: posição, contornos e volume da gengiva antes de qualquer cor."},
  {"module": 2, "model": "/3d/fases/masterclass-2.glb", "title": "Base gengival em resina",
   "text": "A cera vira resina acrílica rosa. É a base lisa e uniforme sobre a qual toda a caracterização vai ser construída."},
  {"module": 3, "model": "/3d/fases/masterclass-3.glb", "title": "Caracterização interna",
   "text": "Cores aplicadas por dentro dão profundidade: tons mais escuros entre as raízes, fundo de vestíbulo arroxeado e bossas mais claras."},
  {"module": 4, "model": "/3d/fases/masterclass-4.glb", "title": "Caracterização externa",
   "text": "Na superfície entram a gengiva marginal clara, papilas rosadas e pequenos capilares que dão vida ao tecido."},
  {"module": 5, "model": "/3d/fases/masterclass-5.glb", "title": "Anatomia e naturalidade",
   "text": "Textura de pontilhado e relevo das raízes reforçados: a gengiva deixa de parecer plástico e passa a parecer tecido."},
  {"module": 6, "model": "/3d/fases/masterclass-6.glb", "title": "Acabamento e polimento",
   "text": "O polimento devolve o brilho natural da mucosa úmida sem apagar os detalhes construídos nas fases anteriores."},
  {"module": 7, "model": "/3d/fases/masterclass-7.glb", "title": "Caracterização avançada",
   "text": "Pigmentação melânica e translucidez nas margens: os detalhes finais que tornam cada protocolo único."}
]$j$::jsonb
where slug = 'masterclass-protocolo-natural';
