-- Ejecuta esto en Supabase > SQL Editor (solo para desarrollo).
-- Permite leer, crear, editar y borrar a cualquiera que tenga la anon key.
-- Antes de publicar, cambia "using (true)" por reglas con auth.uid() / rol authenticated.

alter table cliente  enable row level security;
alter table destino  enable row level security;
alter table paquetes enable row level security;
alter table reservas enable row level security;

create policy "acceso total" on cliente  for all using (true) with check (true);
create policy "acceso total" on destino  for all using (true) with check (true);
create policy "acceso total" on paquetes for all using (true) with check (true);
create policy "acceso total" on reservas for all using (true) with check (true);
