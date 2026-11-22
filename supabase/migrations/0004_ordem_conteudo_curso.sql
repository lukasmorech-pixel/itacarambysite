-- Itacaramby: aplica a ordem dos módulos e aulas de um curso numa só operação.
-- Os módulos ficam 1..N e as aulas são numeradas em sequência no curso inteiro (Aula 1..N),
-- na ordem dos arrays recebidos. Usado pelo editor de conteúdo do painel.

create or replace function public.ita_course_apply_order(p_course uuid, p_modules uuid[], p_lessons uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.ita_is_admin() then
    raise exception 'sem permissão';
  end if;

  -- 1) afasta as posições atuais para não bater nas restrições de unicidade
  update ita_course_modules set position = position + 100000 where course_id = p_course;
  update ita_course_lessons l set position = l.position + 100000
    from ita_course_modules m where m.id = l.module_id and m.course_id = p_course;

  -- 2) grava a ordem nova
  update ita_course_modules m set position = o.n
    from unnest(p_modules) with ordinality as o(id, n)
    where m.id = o.id and m.course_id = p_course;
  update ita_course_lessons l set position = o.n
    from unnest(p_lessons) with ordinality as o(id, n), ita_course_modules m
    where l.id = o.id and m.id = l.module_id and m.course_id = p_course;
end;
$$;

revoke all on function public.ita_course_apply_order(uuid, uuid[], uuid[]) from public, anon;
grant execute on function public.ita_course_apply_order(uuid, uuid[], uuid[]) to authenticated;
