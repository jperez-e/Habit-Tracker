-- 0. Limpieza (Ejecuta esto si tienes errores al crear usuarios)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

-- 1. Crear tabla de hábitos (Simplificada para mayor robustez)
create table if not exists habits (
  id text not null primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text,
  color text,
  notes text,
  archived boolean default false,
  reminder_enabled boolean default false,
  reminder_time text,
  completed_dates text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Habilitar RLS
alter table habits enable row level security;

-- 3. Políticas para habits (Asegúrate de borrar las anteriores antes de pegar esto)
create policy "Los usuarios pueden ver sus propios hábitos" 
  on habits for select using (auth.uid() = user_id);

create policy "Los usuarios pueden insertar sus propios hábitos" 
  on habits for insert with check (auth.uid() = user_id);

create policy "Los usuarios pueden actualizar sus propios hábitos" 
  on habits for update using (auth.uid() = user_id);

create policy "Los usuarios pueden borrar sus propios hábitos" 
  on habits for delete using (auth.uid() = user_id);
