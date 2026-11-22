-- Itacaramby: módulos e aulas dos cursos (ementa pública; vídeos e materiais ficam em tabela protegida na Área do Aluno).

create table if not exists public.ita_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.ita_courses (id) on delete cascade,
  position int not null,
  title text not null,
  level text not null default '',
  unique (course_id, position)
);
create table if not exists public.ita_course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.ita_course_modules (id) on delete cascade,
  position int not null,              -- número da aula no curso
  title text not null,
  topics text[] not null default '{}',     -- "Conteúdo"
  exercise text[] not null default '{}',   -- "Passo a passo / exercício"
  duration_min int,
  is_preview boolean not null default false,
  unique (module_id, position)
);
alter table public.ita_course_modules enable row level security;
alter table public.ita_course_lessons enable row level security;
create policy "público lê módulos" on public.ita_course_modules for select to anon, authenticated using (true);
create policy "admin edita módulos" on public.ita_course_modules for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());
create policy "público lê aulas" on public.ita_course_lessons for select to anon, authenticated using (true);
create policy "admin edita aulas" on public.ita_course_lessons for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());
grant select on public.ita_course_modules, public.ita_course_lessons to anon, authenticated;
grant insert, update, delete on public.ita_course_modules, public.ita_course_lessons to authenticated;

-- ============ MASTERCLASS PROTOCOLO NATURAL (roteiro do curso) ============
do $$
declare
  v_course uuid := (select id from public.ita_courses where slug = 'masterclass-protocolo-natural');
  m jsonb;
  l jsonb;
  v_mod uuid;
  data jsonb := $j$[
  {"n":1,"t":"Fundamentos do protocolo acrílico","lv":"Iniciante","l":[
    {"n":1,"t":"Conhecendo a prótese protocolo","d":10,"c":["Reconhecer estrutura de suporte, dentes artificiais, gengiva artificial e componentes protéticos.","Observar contornos, superfícies e transições entre dentes e gengiva."],"e":["Examinar uma prótese sobre a bancada.","Identificar e apontar as regiões principais.","Registrar cinco áreas que poderiam receber individualização estética."]},
    {"n":2,"t":"Anatomia e estética gengival","d":12,"c":["Observar papilas interdentais, contornos cervicais, relevos e variações de tonalidade.","Usar referências anatômicas e fotográficas como apoio ao planejamento visual."],"e":["Comparar imagens de referência com uma prótese.","Identificar volumes e transições.","Desenhar ou marcar as regiões de interesse."]},
    {"n":3,"t":"Planejamento da caracterização","d":10,"c":["Avaliar o substrato e identificar o sistema de caracterização indicado.","Definir cores, distribuição de efeitos e sequência de execução."],"e":["Inspecionar uma prótese sem caracterização.","Registrar o material conhecido ou a confirmar.","Planejar cores e testar em amostra compatível."]}]},
  {"n":2,"t":"Materiais e preparação","lv":"Iniciante","l":[
    {"n":4,"t":"Conhecendo os materiais","d":12,"c":["Reconhecer resinas, pigmentos, caracterizadores, pincéis, espátulas e materiais de acabamento.","Verificar indicação, validade, instruções e compatibilidade."],"e":["Apresentar cada produto e sua finalidade.","Registrar marca, sistema, indicação e instruções.","Separar apenas os produtos indicados para o substrato utilizado."]},
    {"n":5,"t":"Preparação da bancada","d":8,"c":["Organizar a área de trabalho, iluminação, instrumentos e equipamentos de proteção.","Manter produtos identificados e seguir as fichas de segurança aplicáveis."],"e":["Higienizar e organizar a bancada.","Conferir produtos e equipamentos.","Preparar iluminação e área de filmagem."]},
    {"n":6,"t":"Estudo das cores","d":15,"c":["Reconhecer tons rosados, avermelhados, arroxeados, claros e escuros.","Observar sobreposição, contraste e alterações após processamento e acabamento."],"e":["Preparar amostras em materiais compatíveis.","Registrar cor antes e depois do processamento.","Comparar as amostras sob iluminação consistente."]}]},
  {"n":3,"t":"Caracterização interna","lv":"Intermediário","l":[
    {"n":7,"t":"Conceito da caracterização interna","d":10,"c":["Compreender a incorporação de cores e efeitos durante a construção ou estratificação da região gengival.","Distinguir pigmentação, estratificação e coloração de superfície."],"e":["Comparar amostras convencionais e caracterizadas.","Identificar em que etapa os efeitos são incorporados.","Conferir a compatibilidade do sistema."]},
    {"n":8,"t":"Construção da base gengival","d":20,"c":["Selecionar a resina e planejar base, espessura e contornos conforme o projeto.","Seguir o protocolo de manipulação e processamento do fabricante."],"e":["Conferir estrutura e planejamento.","Preparar o material conforme as instruções.","Construir a base e avaliar distribuição, contornos e espessuras."]},
    {"n":9,"t":"Aplicação das cores internas","d":20,"c":["Planejar cor predominante e tonalidades complementares.","Construir transições e controlar intensidade sem comprometer propriedades do material."],"e":["Demonstrar as camadas em amostra ou caso didático.","Registrar sequência e proporções conforme sistema validado.","Avaliar o resultado após processamento."]},
    {"n":10,"t":"Efeitos e detalhes anatômicos","d":15,"c":["Planejar efeitos em regiões cervicais, papilas e áreas de transição.","Buscar harmonia visual e evitar concentração excessiva de pigmentos."],"e":["Demonstrar em amostra os efeitos planejados.","Comparar com referência visual.","Registrar observações e resultado."]},
    {"n":11,"t":"Processamento e avaliação","d":12,"c":["Seguir o processamento, a cura e os cuidados indicados para o sistema.","Avaliar cor, contornos, integridade e defeitos visíveis."],"e":["Demonstrar o processamento conforme o fabricante.","Inspecionar a amostra após a cura.","Registrar alterações e limitações."]}]},
  {"n":4,"t":"Caracterização externa","lv":"Intermediário","l":[
    {"n":12,"t":"Preparação do protocolo acrilizado","d":15,"c":["Identificar o tipo de acrílico e avaliar a condição da superfície.","Selecionar sistema compatível e preparar a superfície conforme as instruções."],"e":["Examinar o protocolo.","Confirmar o substrato.","Demonstrar preparação e teste prévio em amostra."]},
    {"n":13,"t":"Preparação dos caracterizadores","d":12,"c":["Conferir indicação, compatibilidade, validade e modo de preparo dos produtos.","Separar tonalidades e instrumentos necessários."],"e":["Apresentar produtos e instruções.","Preparar os materiais conforme o fabricante.","Demonstrar organização dos pincéis e amostras."]},
    {"n":14,"t":"Aplicação das tonalidades","d":20,"c":["Planejar cor de fundo, áreas de intensidade e transições.","Controlar quantidade de produto e distribuição cromática."],"e":["Demonstrar aplicação em área delimitada.","Mostrar movimentos e quantidade de produto.","Avaliar a harmonia antes da cura ou fixação."]},
    {"n":15,"t":"Texturas e efeitos gengivais","d":15,"c":["Estudar relevos, pequenas variações de superfície e transições anatômicas.","Evitar irregularidades que prejudiquem limpeza, conforto ou integridade."],"e":["Apresentar referências de textura.","Demonstrar efeitos compatíveis com o sistema.","Avaliar o resultado em aumento."]},
    {"n":16,"t":"Proteção e acabamento","d":12,"c":["Verificar cura ou fixação e integridade da camada caracterizada.","Utilizar proteção, selante e acabamento somente quando indicados e compatíveis."],"e":["Conferir as instruções do sistema.","Demonstrar acabamento indicado.","Inspecionar a superfície final."]}]},
  {"n":5,"t":"Anatomia, naturalidade e personalização","lv":"Intermediário","l":[
    {"n":17,"t":"Construção visual das papilas","d":15,"c":["Observar formato, volume e transições das papilas.","Integrar a região aos dentes e ao restante da gengiva artificial."],"e":["Analisar imagens de referência.","Marcar regiões anatômicas no modelo.","Demonstrar planejamento visual."]},
    {"n":18,"t":"Caracterização cervical","d":15,"c":["Estudar a transição entre dentes e gengiva artificial.","Planejar tonalidades e contornos sem criar linhas artificiais marcadas."],"e":["Identificar a região cervical.","Demonstrar transição em amostra.","Comparar antes e depois."]},
    {"n":19,"t":"Profundidade e naturalidade","d":15,"c":["Compreender relações entre áreas claras, escuras e tons intermediários.","Controlar contrastes e intensidade."],"e":["Comparar amostras com diferentes intensidades.","Analisar a percepção visual.","Registrar a combinação escolhida."]},
    {"n":20,"t":"Personalização","d":12,"c":["Adaptar a proposta estética à referência e ao planejamento de cada caso.","Equilibrar caracterização discreta ou mais intensa."],"e":["Comparar exemplos de caracterização.","Identificar diferenças de abordagem.","Justificar a escolha estética."]}]},
  {"n":6,"t":"Acabamento e polimento","lv":"Intermediário","l":[
    {"n":21,"t":"Acabamento anatômico","d":15,"c":["Identificar excessos e regiões que necessitam regularização.","Preservar detalhes, bordas e integridade da prótese."],"e":["Demonstrar instrumentos compatíveis.","Regularizar apenas as áreas indicadas.","Inspecionar as superfícies."]},
    {"n":22,"t":"Polimento","d":15,"c":["Selecionar sequência e materiais compatíveis.","Controlar pressão e temperatura e preservar a caracterização."],"e":["Demonstrar sequência recomendada.","Mostrar controle de pressão e aquecimento.","Comparar a superfície antes e depois."]},
    {"n":23,"t":"Controle de qualidade","d":12,"c":["Inspecionar integridade, superfícies, bordas, acabamento, polimento e limpeza.","Separar avaliação estética de verificações técnicas e clínicas."],"e":["Utilizar checklist de inspeção.","Registrar defeitos ou ajustes.","Documentar resultado final."]}]},
  {"n":7,"t":"Caracterização avançada","lv":"Avançado","l":[
    {"n":24,"t":"Caracterização combinada","d":20,"c":["Integrar técnicas interna e externa quando o planejamento e os materiais permitirem.","Avaliar o resultado após cada etapa antes de prosseguir."],"e":["Apresentar base caracterizada internamente.","Avaliar compatibilidade para complementação externa.","Demonstrar complementação indicada e inspeção."]},
    {"n":25,"t":"Correção e recuperação estética","d":15,"c":["Reconhecer excesso de pigmento, diferenças de tonalidade, transições marcadas e falhas.","Escolher correções que não comprometam o substrato ou a camada caracterizada."],"e":["Apresentar amostras com problemas.","Explicar opções de correção conforme o sistema.","Demonstrar em amostra de teste."]},
    {"n":26,"t":"Elevando o padrão estético","d":12,"c":["Desenvolver observação, equilíbrio, precisão e individualidade.","Evitar excesso de efeitos e priorizar consistência."],"e":["Comparar trabalhos de diferentes níveis.","Identificar detalhes que valorizam o conjunto.","Definir pontos de melhoria."]}]},
  {"n":8,"t":"Projeto prático final","lv":"Projeto final","l":[
    {"n":27,"t":"Planejamento do caso","d":15,"c":["Definir materiais, cores, sequência e objetivos do projeto.","Registrar substrato, sistema de caracterização e limitações."],"e":["Apresentar o protocolo escolhido.","Preencher ficha de planejamento.","Organizar os materiais e a sequência."]},
    {"n":28,"t":"Execução da caracterização","d":40,"c":["Reunir os conhecimentos de caracterização interna e externa.","Explicar cada decisão e respeitar compatibilidade e instruções dos produtos."],"e":["Demonstrar preparação e etapa interna.","Mostrar processamento e avaliação.","Realizar complementação externa somente quando indicada.","Registrar etapas sem ocultar procedimentos relevantes."]},
    {"n":29,"t":"Acabamento e resultado final","d":20,"c":["Finalizar conforme o sistema e realizar inspeção estética e técnica.","Documentar o resultado e as limitações observadas."],"e":["Demonstrar acabamento e polimento.","Inspecionar superfícies e integridade.","Fotografar detalhes do protocolo."]},
    {"n":30,"t":"Apresentação profissional","d":12,"c":["Planejar fotografia, iluminação e registro de detalhes.","Organizar imagens para portfólio e apresentação do trabalho."],"e":["Posicionar a prótese.","Fazer fotos frontais e aproximadas.","Selecionar imagens nítidas e representativas."]}]}
  ]$j$::jsonb;
begin
  if v_course is null or exists (select 1 from public.ita_course_modules where course_id = v_course) then
    return;
  end if;
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
