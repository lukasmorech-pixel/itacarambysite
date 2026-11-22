-- Itacaramby: Área do Aluno — matrículas, conteúdo protegido das aulas, progresso e materiais.

-- ============ MATRÍCULAS ============
-- Uma linha por aluno (e-mail) e curso. A compra paga cria ou estende a matrícula.
create table if not exists public.ita_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.ita_courses (id) on delete cascade,
  email text not null,                                   -- e-mail do pedido (minúsculo)
  user_id uuid references auth.users (id) on delete set null,   -- conta do aluno, quando ligada
  name text not null default '',
  plan text not null default 'completo' check (plan in ('mensal', 'completo', 'cortesia')),
  order_id uuid references public.ita_orders (id) on delete set null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,                                -- null = sem vencimento
  status text not null default 'ativo' check (status in ('ativo', 'cancelado')),
  created_at timestamptz not null default now(),
  unique (course_id, email)
);
create index if not exists ita_enrollments_user_idx on public.ita_enrollments (user_id);
alter table public.ita_enrollments enable row level security;
create policy "admin gerencia matrículas" on public.ita_enrollments for all to authenticated
  using (public.ita_is_admin()) with check (public.ita_is_admin());

-- e-mail CONFIRMADO de quem está logado (o JWT sozinho não garante a confirmação)
create or replace function public.ita_my_email()
returns text language sql stable security definer set search_path = ''
as $$ select lower(email) from auth.users where id = (select auth.uid()) and email_confirmed_at is not null $$;

create policy "aluno vê as próprias matrículas" on public.ita_enrollments for select to authenticated
  using (user_id = (select auth.uid()) or email = public.ita_my_email());

create or replace function public.ita_has_access(p_course uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.ita_is_admin() or exists (
    select 1 from public.ita_enrollments e
    where e.course_id = p_course and e.status = 'ativo' and (e.expires_at is null or e.expires_at > now())
      and (e.user_id = (select auth.uid()) or e.email = public.ita_my_email()))
$$;

-- ============ CONTEÚDO PROTEGIDO DAS AULAS ============
create table if not exists public.ita_lesson_content (
  lesson_id uuid primary key references public.ita_course_lessons (id) on delete cascade,
  video_url text not null default '',           -- link de incorporação (Bunny Stream, YouTube, Vimeo)
  body text not null default '',                -- texto da aula
  materials jsonb not null default '[]'::jsonb, -- [{ "name": "...", "path": "cursos/<curso>/..." }]
  updated_at timestamptz not null default now()
);
alter table public.ita_lesson_content enable row level security;
create policy "admin edita conteúdo" on public.ita_lesson_content for all to authenticated
  using (public.ita_is_admin()) with check (public.ita_is_admin());
create policy "aluno lê conteúdo do curso" on public.ita_lesson_content for select to authenticated
  using (exists (
    select 1 from public.ita_course_lessons l join public.ita_course_modules m on m.id = l.module_id
    where l.id = lesson_id and (l.is_preview or public.ita_has_access(m.course_id))));

-- ============ PROGRESSO ============
create table if not exists public.ita_lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_id uuid not null references public.ita_course_lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.ita_lesson_progress enable row level security;
create policy "aluno vê o próprio progresso" on public.ita_lesson_progress for select to authenticated
  using (user_id = (select auth.uid()) or public.ita_is_admin());
create policy "aluno marca aula" on public.ita_lesson_progress for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "aluno desmarca aula" on public.ita_lesson_progress for delete to authenticated
  using (user_id = (select auth.uid()));

grant select on public.ita_enrollments, public.ita_lesson_content to authenticated;
grant insert, update, delete on public.ita_enrollments, public.ita_lesson_content to authenticated;
grant select, insert, delete on public.ita_lesson_progress to authenticated;

-- ============ PAGAMENTO CONFIRMADO -> LIBERA O CURSO ============
create or replace function public.ita_grant_on_paid()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  it record;
  v_days int;
begin
  if new.status = 'pago' and old.status is distinct from 'pago'
     and old.status in ('pendente', 'cancelado') then
    for it in
      select i.course_id, i.plan, c.access_days from public.ita_order_items i
      join public.ita_courses c on c.id = i.course_id
      where i.order_id = new.id and i.item_type = 'curso'
    loop
      v_days := case when it.plan = 'mensal' then 30 else it.access_days end;
      insert into public.ita_enrollments as e (course_id, email, user_id, name, plan, order_id, expires_at)
      values (it.course_id, lower(new.customer_email), new.user_id, new.customer_name, it.plan, new.id,
              now() + make_interval(days => v_days))
      on conflict (course_id, email) do update
        set plan = excluded.plan,
            order_id = excluded.order_id,
            status = 'ativo',
            user_id = coalesce(e.user_id, excluded.user_id),
            -- renovação soma ao tempo que ainda resta
            expires_at = case when e.expires_at is null then null
                              else greatest(e.expires_at, now()) + make_interval(days => v_days) end;
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists ita_orders_grant on public.ita_orders;
create trigger ita_orders_grant after update of status on public.ita_orders
  for each row execute function public.ita_grant_on_paid();

-- ============ ATIVAR ACESSO PELO LINK DO PEDIDO ============
-- Quem tem o link do pedido (id + token) liga as matrículas daquele pedido à própria conta.
create or replace function public.ita_claim_order(p_id uuid, p_token uuid)
returns int language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  if (select auth.uid()) is null then raise exception 'Entre na sua conta primeiro.'; end if;
  if not exists (select 1 from public.ita_orders where id = p_id and token = p_token) then
    raise exception 'Pedido não encontrado.';
  end if;
  update public.ita_enrollments set user_id = (select auth.uid())
   where order_id = p_id and (user_id is null or user_id = (select auth.uid()));
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.ita_my_email(), public.ita_has_access(uuid), public.ita_claim_order(uuid, uuid) from public, anon;
grant execute on function public.ita_my_email(), public.ita_has_access(uuid), public.ita_claim_order(uuid, uuid) to authenticated;

-- ============ MATERIAIS DAS AULAS (pasta privada cursos/<id do curso>/...) ============
create policy "itacaramby: aluno lê materiais" on storage.objects for select to authenticated
  using (bucket_id = 'itacaramby-arquivos'
         and (storage.foldername(name))[1] = 'cursos'
         and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
         and public.ita_has_access(((storage.foldername(name))[2])::uuid));

-- a função do gatilho não pode ser chamada direto pela API
revoke all on function public.ita_grant_on_paid() from public, anon, authenticated;
