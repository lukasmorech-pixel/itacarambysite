-- Itacaramby: modelo 3D opcional por produto (arquivo .glb em /public/3d), mostrado no botão "Ver em 3D" da loja.
alter table public.ita_products add column if not exists model_url text not null default '';
update public.ita_products set model_url = '/3d/estudo-parcial.glb' where name like 'Modelo de estudo — parcialmente desdentado%';
update public.ita_products set model_url = '/3d/estudo-total.glb' where name like 'Modelo de estudo — desdentado total%';
update public.ita_products set model_url = '/3d/estudo-implante.glb' where name like 'Modelo de estudo — protocolo sobre 4 implantes%';
