-- Itacaramby: curso "Prótese Total" (rascunho, oculto até revisão do conteúdo e definição de preços).
do $$
declare
  v_course uuid;
  m jsonb;
  l jsonb;
  v_mod uuid;
  data jsonb := $j$[
  {"n":1,"t":"Plano de cera e linhas de referência","lv":"Iniciante","l":[
    {"n":1,"t":"Modelos, placa base e plano de cera","d":12,"c":["Conferir os modelos de trabalho e a área chapeável.","Confeccionar a placa base e posicionar o plano de cera sobre o rebordo."],"e":["Delimitar a área chapeável no modelo.","Adaptar a placa base sem báscula.","Fixar o plano de cera centralizado sobre o rebordo."]},
    {"n":2,"t":"Alturas e espessuras do plano de cera","d":12,"c":["Respeitar as alturas de referência na região anterior e posterior de cada arcada.","Manter a largura do plano compatível com o espaço dos futuros dentes."],"e":["Medir e ajustar as alturas do plano superior e inferior.","Conferir o paralelismo entre os planos.","Registrar as medidas na ficha do caso."]},
    {"n":3,"t":"Linhas de referência","d":10,"c":["Entender a linha média, as linhas dos caninos e a linha alta do sorriso.","Usar o plano oclusal como guia para a montagem dos dentes."],"e":["Identificar as linhas marcadas pelo dentista no plano de cera.","Transferir as referências para a ficha de montagem.","Conferir a simetria em relação à linha média."]}]},
  {"n":2,"t":"Montagem dos dentes","lv":"Iniciante","l":[
    {"n":4,"t":"Seleção de dentes artificiais","d":10,"c":["Escolher forma, tamanho e cor a partir das referências do plano de cera.","Usar a distância entre as linhas dos caninos para definir o tamanho do bloco anterior."],"e":["Medir a distância entre as linhas dos caninos.","Selecionar a carta de dentes compatível.","Registrar forma, tamanho e cor escolhidos."]},
    {"n":5,"t":"Montagem dos dentes anteriores","d":15,"c":["Posicionar incisivos e caninos superiores respeitando a linha média e a linha do sorriso.","Ajustar inclinações, trespasses e harmonia do arco."],"e":["Montar os incisivos centrais na linha média.","Completar laterais e caninos simetricamente.","Conferir o trespasse com os anteriores inferiores."]},
    {"n":6,"t":"Montagem dos dentes posteriores","d":18,"c":["Montar pré-molares e molares sobre o rebordo, seguindo o plano oclusal.","Buscar contatos estáveis e equilíbrio em oclusão."],"e":["Montar os posteriores de um lado e conferir os contatos.","Repetir do outro lado.","Verificar a oclusão no articulador."]}]},
  {"n":3,"t":"Enceramento e escultura gengival","lv":"Intermediário","l":[
    {"n":7,"t":"Enceramento da base","d":12,"c":["Completar a cera da base com espessura e contornos adequados.","Selar a cera ao modelo e aos dentes."],"e":["Completar o volume de cera na vestibular e lingual.","Selar as margens.","Conferir a espessura em toda a base."]},
    {"n":8,"t":"Escultura das papilas e do contorno gengival","d":18,"c":["Esculpir papilas, zênites e o contorno cervical de cada dente.","Criar as bossas que imitam as raízes."],"e":["Recortar o colo dos dentes.","Esculpir as papilas interdentais.","Marcar as bossas radiculares com leveza."]},
    {"n":9,"t":"Prova e acabamento da cera","d":10,"c":["Revisar simetria, volumes e lisura antes da inclusão.","Preparar a peça para a prova clínica, quando indicada."],"e":["Alisar a cera com chama e algodão.","Revisar o conjunto em vista frontal e oclusal.","Registrar os ajustes pedidos na prova."]}]},
  {"n":4,"t":"Inclusão e acrilização","lv":"Intermediário","l":[
    {"n":10,"t":"Inclusão em mufla","d":15,"c":["Incluir o modelo encerado na mufla seguindo a técnica escolhida.","Proteger os dentes e a escultura durante a inclusão."],"e":["Isolar e posicionar o modelo na mufla.","Completar as camadas de gesso.","Aguardar a presa conforme o fabricante."]},
    {"n":11,"t":"Eliminação da cera e prensagem","d":15,"c":["Eliminar a cera e preparar o molde.","Manipular e prensar a resina conforme as instruções do fabricante."],"e":["Eliminar a cera com água quente.","Aplicar o isolante.","Prensar a resina e conferir o excesso."]},
    {"n":12,"t":"Polimerização e desinclusão","d":12,"c":["Seguir o ciclo de polimerização indicado para a resina.","Desincluir sem fraturar a prótese."],"e":["Executar o ciclo de polimerização.","Resfriar conforme a orientação.","Desincluir e limpar a peça."]}]},
  {"n":5,"t":"Caracterização e acabamento","lv":"Avançado","l":[
    {"n":13,"t":"Caracterização gengival","d":18,"c":["Planejar cores para dar profundidade e naturalidade à gengiva.","Aplicar os efeitos com sistema compatível com a resina utilizada."],"e":["Testar as cores em amostra.","Aplicar a caracterização na área planejada.","Comparar com a referência visual."]},
    {"n":14,"t":"Acabamento","d":12,"c":["Remover excessos e regularizar bordas sem perder a escultura.","Preservar as áreas de suporte e o selamento periférico."],"e":["Recortar excessos com fresas adequadas.","Regularizar as bordas.","Conferir a espessura e a lisura."]},
    {"n":15,"t":"Polimento final","d":10,"c":["Obter brilho uniforme na resina e nos dentes.","Evitar o aquecimento excessivo da peça."],"e":["Polir com pastas e escovas apropriadas.","Lavar e inspecionar a peça.","Registrar o resultado com fotos."]}]},
  {"n":6,"t":"Entrega e manutenção","lv":"Avançado","l":[
    {"n":16,"t":"Conferência final","d":10,"c":["Checar oclusão, bordas, superfície interna e estética antes da entrega.","Preparar a prótese para envio ao consultório."],"e":["Revisar a peça com a lista de conferência.","Embalar em meio adequado.","Preencher a ficha de entrega."]},
    {"n":17,"t":"Ajustes e reembasamento","d":12,"c":["Conhecer os ajustes mais comuns após a instalação.","Entender quando indicar reembasamento."],"e":["Analisar um caso com áreas de compressão.","Planejar o ajuste.","Registrar o procedimento."]},
    {"n":18,"t":"Projeto final: prótese total dupla","d":25,"c":["Executar uma prótese total dupla do plano de cera ao polimento.","Documentar cada etapa com fotos."],"e":["Executar o caso completo.","Fotografar cada etapa.","Apresentar o resultado para avaliação."]}]}
  ]$j$;
begin
  insert into public.ita_courses (slug, title, subtitle, description, image_url, highlights, price_monthly_cents, price_full_cents, access_days, position, published, phases)
  values ('protese-total', 'Prótese Total do Início ao Fim',
          'Do plano de cera à prótese polida, com o método do laboratório',
          'Curso online de prótese total dupla: plano de cera e linhas de referência, montagem dos dentes, enceramento e escultura gengival, acrilização, caracterização e acabamento, com demonstrações na bancada e exercícios práticos.',
          '/loja/curso-protese-total.jpg',
          array['18 videoaulas em 6 módulos', 'Do plano de cera à entrega', 'Animação 3D de cada fase', 'Projeto prático final'],
          null, null, 365, 2, false,
          $p$[
            {"module": 1, "model": "/3d/plano-cera.glb", "title": "Plano de cera e linhas de referência",
             "text": "Os planos de cera em oclusão trazem as referências do dentista: linha média, linhas dos caninos, linha alta do sorriso e plano oclusal."},
            {"module": 2, "model": "/3d/fases/protese-total-2.glb", "title": "Dentes montados em cera",
             "text": "Os dentes artificiais ocupam o lugar do plano de cera, seguindo as linhas de referência e o plano oclusal."},
            {"module": 3, "model": "/3d/fases/protese-total-3.glb", "title": "Enceramento e escultura gengival",
             "text": "A cera da base ganha papilas, contorno cervical e bossas radiculares: é aqui que a gengiva começa a parecer natural."},
            {"module": 4, "model": "/3d/fases/protese-total-4.glb", "title": "Prótese acrilizada",
             "text": "Depois da inclusão e da prensagem, a cera vira resina acrílica rosa, com toda a escultura preservada."},
            {"module": 5, "model": "/3d/fases/protese-total-5.glb", "title": "Caracterização e acabamento",
             "text": "Cores de profundidade, gengiva marginal e polimento dão vida e brilho à prótese."},
            {"module": 6, "model": "/3d/fases/protese-total-6.glb", "title": "Prótese pronta para entrega",
             "text": "Fora dos modelos, a prótese total dupla é conferida, embalada e enviada ao consultório."}
          ]$p$::jsonb)
  on conflict (slug) do nothing
  returning id into v_course;
  if v_course is null then return; end if;

  for m in select * from jsonb_array_elements(data) loop
    insert into public.ita_course_modules (course_id, position, title, level)
    values (v_course, (m->>'n')::int, m->>'t', m->>'lv') returning id into v_mod;
    for l in select * from jsonb_array_elements(m->'l') loop
      insert into public.ita_course_lessons (module_id, position, title, topics, exercise, duration_min, is_preview)
      values (v_mod, (l->>'n')::int, l->>'t',
              array(select jsonb_array_elements_text(l->'c')), array(select jsonb_array_elements_text(l->'e')),
              (l->>'d')::int, (l->>'n')::int = 1);
    end loop;
  end loop;
end $$;
