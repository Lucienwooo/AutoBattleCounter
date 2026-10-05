create table if not exists public.auto_battle_counter_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.auto_battle_counter_data enable row level security;

create policy "Users can read their own counter data"
  on public.auto_battle_counter_data
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own counter data"
  on public.auto_battle_counter_data
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own counter data"
  on public.auto_battle_counter_data
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);