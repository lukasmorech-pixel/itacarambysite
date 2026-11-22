-- REMOVE do projeto da ETCV (coracao-valente) tudo o que era do Itacaramby.
-- Rodar SOMENTE depois que o site do Itacaramby estiver funcionando no projeto Supabase próprio.
-- Não mexe em nenhuma tabela, função ou arquivo da ETCV (só objetos com prefixo ita_ e os buckets itacaramby).

begin;

-- regras das pastas do Itacaramby
-- (as pastas "itacaramby" e "itacaramby-arquivos" estão vazias; apague-as pela tela Storage do Supabase,
--  porque o Supabase não permite apagar storage por SQL)
drop policy if exists "itacaramby: admin envia fotos" on storage.objects;
drop policy if exists "itacaramby: admin atualiza fotos" on storage.objects;
drop policy if exists "itacaramby: admin apaga fotos" on storage.objects;
drop policy if exists "itacaramby: admin envia arquivos" on storage.objects;
drop policy if exists "itacaramby: admin lê arquivos" on storage.objects;
drop policy if exists "itacaramby: admin apaga arquivos" on storage.objects;

-- funções e tabelas do Itacaramby
drop function if exists public.ita_create_order(jsonb);
drop function if exists public.ita_get_order(uuid, uuid);
drop table if exists public.ita_order_items, public.ita_orders,
  public.ita_course_lessons, public.ita_course_modules, public.ita_courses, public.ita_products,
  public.ita_messages, public.ita_testimonials, public.ita_partners, public.ita_gallery,
  public.ita_services, public.ita_site_settings, public.ita_admins cascade;
drop function if exists public.ita_is_admin();

commit;

select count(*) as objetos_ita_restantes
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname like 'ita\_%';
