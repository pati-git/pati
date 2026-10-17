create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.categories (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text, position int not null default 0, created_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), category_id uuid references public.categories(id) on delete set null, name text not null, description text, price numeric(12,0), image_url text, featured boolean not null default false, available boolean not null default true, created_at timestamptz not null default now());
grant select on public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant all on public.categories, public.products to service_role;
alter table public.categories enable row level security;
alter table public.products enable row level security;
create policy "public read cat" on public.categories for select using (true);
create policy "admin write cat" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read prod" on public.products for select using (true);
create policy "admin write prod" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "admin read imgs" on storage.objects for select to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin upload imgs" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin update imgs" on storage.objects for update to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin delete imgs" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));

insert into public.categories (name, slug, description, position) values
('Vêtements','vetements','Pulls, tops et cardigans tricotés main',1),
('Sacs','sacs','Sacs à main, cabas et pochettes en crochet',2),
('Accessoires','accessoires','Bonnets, écharpes, bijoux et petits trésors',3),
('Créations personnalisées','personnalise','Des pièces uniques imaginées avec vous',4);

insert into public.products (category_id, name, description, price, image_url, featured) values
((select id from public.categories where slug='vetements'),'Cardigan Terracotta','Cardigan ample en maille épaisse, coloris terracotta.',25000,'/images/cardigan.jpg',true),
((select id from public.categories where slug='sacs'),'Sac Cabas Sable','Grand cabas en crochet, parfait pour le quotidien.',15000,'/images/sac.jpg',true),
((select id from public.categories where slug='accessoires'),'Bonnet Côtelé','Bonnet unisexe en laine douce, maille côtelée.',7000,'/images/bonnet.jpg',true),
((select id from public.categories where slug='personnalise'),'Pièce sur mesure','Votre idée, vos couleurs : contactez-nous pour créer ensemble.',null,'/images/custom.jpg',false);