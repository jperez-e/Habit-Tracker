-- Ejecuta este script en Supabase SQL Editor para habilitar frecuencia avanzada.
-- Es seguro correrlo varias veces (usa IF NOT EXISTS).

alter table public.habits
  add column if not exists frequency_type text default 'daily',
  add column if not exists specific_days integer[] default '{}',
  add column if not exists times_per_week integer default 3,
  add column if not exists rest_dates text[] default '{}';

-- Opcional: índice para consultas por usuario y frecuencia.
create index if not exists habits_user_frequency_idx on public.habits(user_id, frequency_type);
