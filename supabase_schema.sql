create extension if not exists pgcrypto;
create table if not exists restaurants (id uuid primary key default gen_random_uuid(), name text not null, image text, category text default 'Mexicana', eta_min int default 18, eta_max int default 30, fee int default 25, rating numeric default 4.6);
create table if not exists menu_items (id uuid primary key default gen_random_uuid(), restaurant_id uuid references restaurants(id) on delete cascade, name text not null, price int not null, tags text[] default '{}');
create table if not exists orders (id uuid primary key default gen_random_uuid(), type text not null check (type in ('comida','mandado')), restaurant_id uuid references restaurants(id) on delete set null, address text not null, details text, payment_method text not null, total int not null default 0, status text not null default 'placed' check (status in ('placed','accepted','preparing','pickup','delivered','cancelled')));
create table if not exists order_items (id uuid primary key default gen_random_uuid(), order_id uuid references orders(id) on delete cascade, name text not null, unit_price int not null, qty int not null default 1);
create table if not exists delivery_tasks (id uuid primary key default gen_random_uuid(), order_id uuid references orders(id) on delete cascade, what text, from_address text, to_address text, km int);
alter table restaurants enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table delivery_tasks enable row level security;
create policy if not exists "restaurants read" on restaurants for select using (true);
create policy if not exists "menu read" on menu_items for select using (true);
create policy if not exists "orders insert service only" on orders for insert to service_role with check (true);
create policy if not exists "order items insert service only" on order_items for insert to service_role with check (true);
create policy if not exists "delivery tasks insert service only" on delivery_tasks for insert to service_role with check (true);
create policy if not exists "orders select public" on orders for select using (true);
create policy if not exists "order items select public" on order_items for select using (true);
create policy if not exists "delivery tasks select public" on delivery_tasks for select using (true);
insert into restaurants (id,name,image,category,eta_min,eta_max,fee,rating) values
 ('11111111-1111-1111-1111-111111111111','Tacos Providencia','https://picsum.photos/seed/tacos/640/360','Mexicana',18,30,29,4.7),
 ('22222222-2222-2222-2222-222222222222','Burger Chapu','https://picsum.photos/seed/chapu/640/360','Hamburguesas',22,35,35,4.8),
 ('33333333-3333-3333-3333-333333333333','Pizzería Arcos','https://picsum.photos/seed/pizza-gdl/640/360','Pizza',20,32,32,4.6)
on conflict (id) do nothing;
insert into menu_items (restaurant_id,name,price,tags) values
 ('11111111-1111-1111-1111-111111111111','Tacos al pastor (5u)',89, array['Top']),
 ('11111111-1111-1111-1111-111111111111','Quesadilla de asada',79, '{}'),
 ('11111111-1111-1111-1111-111111111111','Gringa',95, array['Popular']),
 ('11111111-1111-1111-1111-111111111111','Agua de horchata',39, '{}'),
 ('22222222-2222-2222-2222-222222222222','Clásica 150g',139, '{}'),
 ('22222222-2222-2222-2222-222222222222','Doble queso 180g',169, array['Top']),
 ('22222222-2222-2222-2222-222222222222','Papas gajo',59, '{}'),
 ('22222222-2222-2222-2222-222222222222','Refresco 355ml',29, '{}'),
 ('33333333-3333-3333-3333-333333333333','Margarita',129, array['Veggie']),
 ('33333333-3333-3333-3333-333333333333','Pepperoni',149, array['Top']),
 ('33333333-3333-3333-3333-333333333333','Hawaiana',149, '{}'),
 ('33333333-3333-3333-3333-333333333333','Limonada',35, '{}');
