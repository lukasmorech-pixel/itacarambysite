-- Itacaramby: cria o banco completo (tabelas, segurança, armazenamento e conteúdo inicial).
-- ANTES de rodar: crie seu usuário em Authentication > Users > Add user (marque Auto Confirm User).
-- Rode tudo de uma vez no SQL Editor do projeto novo.

-- ===================== 0001_painel_admin.sql =====================
-- Itacaramby: tabelas do painel admin, segurança (RLS), armazenamento de fotos e conteúdo inicial.

-- ============ ADMINISTRADORES ============
create table if not exists public.ita_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.ita_admins enable row level security;

create or replace function public.ita_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.ita_admins where user_id = (select auth.uid()));
$$;

create policy "admin lê admins" on public.ita_admins for select to authenticated using (public.ita_is_admin());

-- ============ CONFIGURAÇÕES (textos e contatos) ============
create table if not exists public.ita_site_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.ita_site_settings enable row level security;
create policy "público lê configurações" on public.ita_site_settings for select to anon, authenticated using (true);
create policy "admin edita configurações" on public.ita_site_settings for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

-- ============ SERVIÇOS ============
create table if not exists public.ita_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  text text not null default '',
  items text[] not null default '{}',
  image_url text not null default '',
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ita_services enable row level security;
create policy "público lê serviços publicados" on public.ita_services for select to anon, authenticated using (published or public.ita_is_admin());
create policy "admin edita serviços" on public.ita_services for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

-- ============ GALERIA ============
create table if not exists public.ita_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text not null default '',
  image_url text not null,
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ita_gallery enable row level security;
create policy "público lê galeria publicada" on public.ita_gallery for select to anon, authenticated using (published or public.ita_is_admin());
create policy "admin edita galeria" on public.ita_gallery for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

-- ============ PARCEIROS ============
create table if not exists public.ita_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null default '',
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ita_partners enable row level security;
create policy "público lê parceiros publicados" on public.ita_partners for select to anon, authenticated using (published or public.ita_is_admin());
create policy "admin edita parceiros" on public.ita_partners for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

-- ============ DEPOIMENTOS ============
create table if not exists public.ita_testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  name text not null,
  role text not null default '',
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ita_testimonials enable row level security;
create policy "público lê depoimentos publicados" on public.ita_testimonials for select to anon, authenticated using (published or public.ita_is_admin());
create policy "admin edita depoimentos" on public.ita_testimonials for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

-- ============ MENSAGENS DO FORMULÁRIO ============
create table if not exists public.ita_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  clinic text not null default '' check (char_length(clinic) <= 160),
  phone text not null default '' check (char_length(phone) <= 40),
  subject text not null default '' check (char_length(subject) <= 80),
  message text not null check (char_length(message) between 1 and 4000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.ita_messages enable row level security;
-- O público só pode ENVIAR (nunca ler) mensagens.
create policy "público envia mensagem" on public.ita_messages for insert to anon, authenticated with check (read = false);
create policy "admin lê mensagens" on public.ita_messages for select to authenticated using (public.ita_is_admin());
create policy "admin atualiza mensagens" on public.ita_messages for update to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());
create policy "admin apaga mensagens" on public.ita_messages for delete to authenticated using (public.ita_is_admin());
create index if not exists ita_messages_created_at_idx on public.ita_messages (created_at desc);

-- ============ PERMISSÕES (as políticas RLS acima continuam valendo) ============
grant select on public.ita_site_settings, public.ita_services, public.ita_gallery, public.ita_partners, public.ita_testimonials to anon, authenticated;
grant insert on public.ita_messages to anon, authenticated;
grant select, insert, update, delete on public.ita_site_settings, public.ita_services, public.ita_gallery, public.ita_partners, public.ita_testimonials, public.ita_messages to authenticated;
grant select on public.ita_admins to authenticated;
revoke all on function public.ita_is_admin() from public;
grant execute on function public.ita_is_admin() to anon, authenticated;

-- ============ ARMAZENAMENTO DE FOTOS ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('itacaramby', 'itacaramby', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "itacaramby: admin envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'itacaramby' and public.ita_is_admin());
create policy "itacaramby: admin atualiza fotos" on storage.objects for update to authenticated
  using (bucket_id = 'itacaramby' and public.ita_is_admin());
create policy "itacaramby: admin apaga fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'itacaramby' and public.ita_is_admin());

-- ============ CONTEÚDO INICIAL (o que já está no site) ============
insert into public.ita_site_settings (id, data) values (1, $json${
  "cro": "CRO 430",
  "city": "Anápolis - GO",
  "hero": {
    "eyebrow": "ESTÉTICA • PRECISÃO • COMPROMISSO",
    "title1": "O sorriso do seu paciente",
    "title2": "começa na nossa bancada.",
    "text": "Coroas, facetas, protocolos e próteses totais e removíveis feitas com materiais de primeira linha e acabamento estético. Envie seu caso pelo WhatsApp e receba no prazo."
  },
  "about": {
    "title": "Onde a técnica encontra o detalhe.",
    "paragraphs": [
      "O Itacaramby é um laboratório de prótese dentária em Anápolis dedicado à estética. Trabalhamos lado a lado com o dentista, do planejamento à entrega, para que cada peça chegue ao consultório pronta para o paciente.",
      "Seguimos investindo em cursos, equipamentos e materiais de qualidade — E.max, Rosetta, Signum, Resilab, metalocerâmica e ligas metálicas — para entregar trabalhos com adaptação precisa e aparência natural."
    ],
    "stats": [
      {"value": "CRO 430", "label": "laboratório registrado"},
      {"value": "5 dias", "label": "prazo a partir de 5 dias úteis"},
      {"value": "30+", "label": "tipos de trabalho"}
    ]
  },
  "owner": {
    "name": "Cesar Itacaramby",
    "role": "Técnico em Prótese Dentária · Responsável técnico",
    "photo": "/img/responsavel.png"
  },
  "contact": {
    "whatsapp": "5562984490810",
    "whatsappLabel": "(62) 98449-0810",
    "email": "itacaramby76@outlook.com",
    "instagram": "",
    "address": "Rua Dinamarca, Qd. 37, Lt. 14, nº 14 — Vila Santa Isabel, Anápolis - GO, CEP 75083-323"
  },
  "leadTimes": [
    {"item": "N.M.F / R.M.F", "days": "5 dias úteis"},
    {"item": "Montagem de dentes", "days": "5 dias úteis"},
    {"item": "Acrilização", "days": "5 dias úteis"},
    {"item": "Metal C.M.C", "days": "7 dias úteis"},
    {"item": "Grade da PPR", "days": "10 dias úteis"},
    {"item": "C.M.C direta", "days": "10 dias úteis"},
    {"item": "Estrutura metálica de protocolo", "days": "10 dias úteis"},
    {"item": "Metal C.M.C sobre implante", "days": "10 dias úteis"}
  ],
  "verse": {
    "text": "Confia os teus cuidados ao Senhor, e ele te sustentará; jamais permitirá que o justo seja abalado.",
    "ref": "Salmos 55.22"
  }
}$json$::jsonb)
on conflict (id) do nothing;

insert into public.ita_services (title, text, items, image_url, position)
select * from (values
  ('E.max e Rosetta', 'Cerâmicas de alta estética para coroas, facetas e lentes.', array['Coroa','Onlay / Inlay','Faceta ou lente','Fragmento','E.max'], '/img/dissilicato.png', 1),
  ('Metalocerâmica', 'Resistência e estética para unitários, pontes e implantes.', array['Coroa metalocerâmica','Coroa sobre implante','Protocolo metalocerâmico','Protocolo com gengiva cerâmica'], '/img/coroas-implante.png', 2),
  ('Signum e Resilab', 'Resinas laboratoriais para coroas e restaurações indiretas.', array['Coroa Signum','Coroa Resilab','Onlay / Inlay Signum','Onlay / Inlay Resilab'], '/img/ceramica.png', 3),
  ('Protocolos sobre implantes', 'Reabilitações fixas sobre implantes, do provisório ao definitivo.', array['Protocolo em resina','Protocolo provisório','Barra de protocolo','Barra com O-ring'], '/img/protocolo-ceramica.png', 4),
  ('Próteses totais', 'Dentaduras com acabamento rosa, caracterizado ou customizado.', array['Prótese total rosa','Prótese total caracterizada','Prótese total customizada','Prótese total imediata','Clonagem de PT'], '/img/protese-total.png', 5),
  ('Removíveis e estruturas metálicas', 'PPR e núcleos em liga de prata, cromo e metal amarelo.', array['Prótese parcial removível','N.M.F e R.M.F (prata, cromo, metal amarelo)','Coping metálico'], '/img/ppr.png', 6),
  ('Placas, guias e outros', 'Trabalhos complementares para o dia a dia do consultório.', array['Guia cirúrgico','Placa de clareamento','Placa de bruxismo (silicone ou acrílica)','Veneer em Art Glass ou resina acrílica'], '/img/protocolo-resina.png', 7),
  ('Trabalhos fracionados', 'Etapas avulsas para complementar o seu fluxo.', array['Provisório','Moldeira individual','Montagem e prensagem (PT/PPR)','Troca de dentes','Aplicação de cerâmica'], '', 8)
) as v(title, text, items, image_url, position)
where not exists (select 1 from public.ita_services);

insert into public.ita_gallery (title, tag, image_url, position)
select * from (values
  ('Coroas sobre implante', 'Metalocerâmica', '/img/coroas-implante.png', 1),
  ('Protocolo com gengiva', 'Implantes', '/img/protocolo-ceramica.png', 2),
  ('Coroas em cerâmica', 'Cerâmica', '/img/ceramica.png', 3),
  ('Prótese total', 'PT', '/img/protese-total.png', 4),
  ('Protocolo em resina', 'Implantes', '/img/protocolo-resina.png', 5),
  ('Prótese parcial removível', 'PPR', '/img/ppr.png', 6),
  ('Onlays em dissilicato', 'E.max', '/img/dissilicato.png', 7)
) as v(title, tag, image_url, position)
where not exists (select 1 from public.ita_gallery);

-- ===================== 0002_loja.sql =====================
-- Itacaramby: loja (modelos de estudo físicos/digitais e cursos) e pedidos.

-- ============ PRODUTOS (modelos de estudo) ============
create table if not exists public.ita_products (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('fisico', 'digital')),
  name text not null,
  description text not null default '',
  price_cents int not null check (price_cents >= 0),
  image_url text not null default '',
  file_path text not null default '',          -- arquivo do produto digital (bucket privado)
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ita_products enable row level security;
create policy "público lê produtos publicados" on public.ita_products for select to anon, authenticated using (published or public.ita_is_admin());
create policy "admin edita produtos" on public.ita_products for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

-- ============ CURSOS ============
create table if not exists public.ita_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  image_url text not null default '',
  highlights text[] not null default '{}',
  price_monthly_cents int,                       -- null = sem opção mensal
  price_full_cents int,                          -- null = sem opção de compra única
  access_days int not null default 365,          -- validade da compra única
  position int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ita_courses enable row level security;
create policy "público lê cursos publicados" on public.ita_courses for select to anon, authenticated using (published or public.ita_is_admin());
create policy "admin edita cursos" on public.ita_courses for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

-- ============ PEDIDOS ============
create table if not exists public.ita_orders (
  id uuid primary key default gen_random_uuid(),
  number serial,
  token uuid not null default gen_random_uuid(),     -- dá acesso à página do pedido
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_cpf text not null default '',
  delivery text not null check (delivery in ('envio', 'retirada', 'nenhuma')),
  address jsonb,
  subtotal_cents int not null,
  shipping_cents int not null default 0,
  total_cents int not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'enviado', 'entregue', 'cancelado')),
  gateway text not null default 'demo',
  gateway_ref text not null default '',
  admin_notes text not null default '',
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.ita_orders enable row level security;
create policy "admin gerencia pedidos" on public.ita_orders for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());
create index if not exists ita_orders_created_idx on public.ita_orders (created_at desc);

create table if not exists public.ita_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ita_orders (id) on delete cascade,
  item_type text not null check (item_type in ('produto', 'curso')),
  product_id uuid references public.ita_products (id) on delete set null,
  course_id uuid references public.ita_courses (id) on delete set null,
  plan text check (plan in ('mensal', 'completo')),
  kind text,                                        -- fisico/digital (produtos)
  name text not null,
  unit_price_cents int not null,
  quantity int not null default 1 check (quantity between 1 and 50)
);
alter table public.ita_order_items enable row level security;
create policy "admin gerencia itens" on public.ita_order_items for all to authenticated using (public.ita_is_admin()) with check (public.ita_is_admin());

grant select on public.ita_products, public.ita_courses to anon, authenticated;
grant select, insert, update, delete on public.ita_products, public.ita_courses, public.ita_orders, public.ita_order_items to authenticated;
grant usage, select on sequence public.ita_orders_number_seq to authenticated;

-- ============ CRIAR PEDIDO (preços sempre vêm do banco, nunca do navegador) ============
create or replace function public.ita_create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  it jsonb;
  v_order_id uuid;
  v_token uuid;
  v_number int;
  v_subtotal int := 0;
  v_shipping int := 0;
  v_has_physical boolean := false;
  v_delivery text := coalesce(payload->>'delivery', 'nenhuma');
  v_qty int;
  p record;
  c record;
  v_price int;
  v_plan text;
  items_out jsonb := '[]'::jsonb;
begin
  if coalesce(trim(payload->>'name'), '') = '' or coalesce(trim(payload->>'email'), '') = '' or coalesce(trim(payload->>'phone'), '') = '' then
    raise exception 'Preencha nome, e-mail e telefone.';
  end if;
  if jsonb_array_length(coalesce(payload->'items', '[]'::jsonb)) = 0 then
    raise exception 'Carrinho vazio.';
  end if;

  for it in select * from jsonb_array_elements(payload->'items') loop
    if it->>'type' = 'produto' then
      select * into p from public.ita_products where id = (it->>'id')::uuid and published;
      if not found then raise exception 'Produto indisponível.'; end if;
      v_qty := case when p.kind = 'digital' then 1 else greatest(1, least(50, coalesce((it->>'qty')::int, 1))) end;
      if p.kind = 'fisico' then v_has_physical := true; end if;
      v_subtotal := v_subtotal + p.price_cents * v_qty;
      items_out := items_out || jsonb_build_object('item_type', 'produto', 'product_id', p.id, 'kind', p.kind, 'name', p.name, 'unit', p.price_cents, 'qty', v_qty);
    elsif it->>'type' = 'curso' then
      select * into c from public.ita_courses where id = (it->>'id')::uuid and published;
      if not found then raise exception 'Curso indisponível.'; end if;
      v_plan := it->>'plan';
      v_price := case when v_plan = 'mensal' then c.price_monthly_cents when v_plan = 'completo' then c.price_full_cents end;
      if v_price is null then raise exception 'Plano indisponível para este curso.'; end if;
      v_subtotal := v_subtotal + v_price;
      items_out := items_out || jsonb_build_object('item_type', 'curso', 'course_id', c.id, 'plan', v_plan,
        'name', c.title || case when v_plan = 'mensal' then ' — assinatura mensal' else ' — curso completo' end, 'unit', v_price, 'qty', 1);
    else
      raise exception 'Item inválido.';
    end if;
  end loop;

  if v_has_physical then
    if v_delivery not in ('envio', 'retirada') then raise exception 'Escolha envio ou retirada.'; end if;
    if v_delivery = 'envio' then
      v_shipping := coalesce((select (data->'store'->>'shippingFlatCents')::int from public.ita_site_settings where id = 1), 0);
      if coalesce(trim(payload->'address'->>'cep'), '') = '' or coalesce(trim(payload->'address'->>'street'), '') = '' then
        raise exception 'Informe o endereço de entrega.';
      end if;
    end if;
  else
    v_delivery := 'nenhuma';
  end if;

  insert into public.ita_orders (customer_name, customer_email, customer_phone, customer_cpf, delivery, address,
                                 subtotal_cents, shipping_cents, total_cents, user_id)
  values (left(trim(payload->>'name'), 120), left(lower(trim(payload->>'email')), 160), left(trim(payload->>'phone'), 40),
          left(regexp_replace(coalesce(payload->>'cpf', ''), '\D', '', 'g'), 14), v_delivery,
          case when v_delivery = 'envio' then payload->'address' else null end,
          v_subtotal, v_shipping, v_subtotal + v_shipping, (select auth.uid()))
  returning id, token, number into v_order_id, v_token, v_number;

  insert into public.ita_order_items (order_id, item_type, product_id, course_id, plan, kind, name, unit_price_cents, quantity)
  select v_order_id, x->>'item_type', (x->>'product_id')::uuid, (x->>'course_id')::uuid, x->>'plan', x->>'kind', x->>'name',
         (x->>'unit')::int, (x->>'qty')::int
  from jsonb_array_elements(items_out) x;

  return jsonb_build_object('id', v_order_id, 'token', v_token, 'number', v_number, 'total_cents', v_subtotal + v_shipping);
end;
$$;

-- ============ CONSULTAR PEDIDO (com o token do link) ============
create or replace function public.ita_get_order(p_id uuid, p_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'status', o.status, 'created_at', o.created_at, 'paid_at', o.paid_at,
    'customer_name', o.customer_name, 'delivery', o.delivery, 'address', o.address,
    'subtotal_cents', o.subtotal_cents, 'shipping_cents', o.shipping_cents, 'total_cents', o.total_cents,
    'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'type', i.item_type, 'kind', i.kind, 'plan', i.plan,
                         'unit_price_cents', i.unit_price_cents, 'quantity', i.quantity, 'product_id', i.product_id) order by i.name)
                       from public.ita_order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.ita_orders o
  where o.id = p_id and o.token = p_token;
$$;

revoke all on function public.ita_create_order(jsonb) from public;
revoke all on function public.ita_get_order(uuid, uuid) from public;
grant execute on function public.ita_create_order(jsonb) to anon, authenticated;
grant execute on function public.ita_get_order(uuid, uuid) to anon, authenticated;

-- ============ ARQUIVOS DIGITAIS (bucket privado) ============
insert into storage.buckets (id, name, public, file_size_limit)
values ('itacaramby-arquivos', 'itacaramby-arquivos', false, 209715200)
on conflict (id) do nothing;
create policy "itacaramby: admin envia arquivos" on storage.objects for insert to authenticated
  with check (bucket_id = 'itacaramby-arquivos' and public.ita_is_admin());
create policy "itacaramby: admin lê arquivos" on storage.objects for select to authenticated
  using (bucket_id = 'itacaramby-arquivos' and public.ita_is_admin());
create policy "itacaramby: admin apaga arquivos" on storage.objects for delete to authenticated
  using (bucket_id = 'itacaramby-arquivos' and public.ita_is_admin());

-- ============ CONFIGURAÇÕES DA LOJA (frete fixo, retirada) ============
update public.ita_site_settings
set data = data || jsonb_build_object('store', jsonb_build_object(
  'shippingFlatCents', 3500,
  'pickupNote', 'Retirada no laboratório: Rua Dinamarca, Qd. 37, Lt. 14, nº 14 — Vila Santa Isabel, Anápolis - GO. Combine o horário pelo WhatsApp.'))
where id = 1 and not (data ? 'store');

-- ============ EXEMPLOS (valores A CONFIRMAR — editar no painel) ============
insert into public.ita_products (kind, name, description, price_cents, image_url, position)
select * from (values
  ('fisico', 'Modelo de estudo — protocolo superior', 'Modelo físico de protocolo superior sobre implantes para estudo de anatomia e caracterização gengival. (valor de exemplo)', 18000, '/img/protocolo-ceramica.png', 1),
  ('fisico', 'Modelo de estudo — coroas e pontes', 'Modelo físico com preparos e coroas para treino de escultura, acabamento e polimento. (valor de exemplo)', 12000, '/img/ceramica.png', 2),
  ('digital', 'Arquivo STL — protocolo superior', 'Arquivo 3D (STL) do protocolo superior para impressão e estudo. Download liberado após o pagamento. (valor de exemplo)', 4900, '/img/protocolo-resina.png', 3)
) as v(kind, name, description, price_cents, image_url, position)
where not exists (select 1 from public.ita_products);

insert into public.ita_courses (slug, title, subtitle, description, image_url, highlights, price_monthly_cents, price_full_cents, access_days, position)
select 'masterclass-protocolo-natural', 'Masterclass Protocolo Natural',
  'A arte da caracterização em prótese acrílica sobre implantes',
  'Treinamento online do básico ao avançado: caracterização interna, externa e combinada de protocolos acrílicos, com teoria, demonstrações na bancada e exercícios práticos.',
  '/img/protocolo-ceramica.png',
  array['30 videoaulas em 8 módulos', '8 a 12 horas de conteúdo', 'Apostila do aluno e fichas de apoio', 'Do básico ao avançado', 'Projeto prático final'],
  9700, 69700, 365, 1
where not exists (select 1 from public.ita_courses where slug = 'masterclass-protocolo-natural');

-- ===================== 0003_cursos_conteudo.sql =====================
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

-- ===================== ADMINISTRADOR =====================
-- Dá acesso ao painel para o seu usuário (troque o e-mail se for outro).
insert into public.ita_admins (user_id)
select id from auth.users where lower(email) = lower('lucasorechio@gmail.com')
on conflict (user_id) do nothing;

select 'Pronto! Admins: ' || (select count(*) from public.ita_admins) || ' · Aulas: ' || (select count(*) from public.ita_course_lessons) as resultado;