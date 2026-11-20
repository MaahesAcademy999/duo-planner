-- Duo → Notion sync: bookkeeping tables + a 5-minute schedule.
-- Only adds new duo_notion_* objects; does not touch any other table.

create table if not exists public.duo_notion_sync_items (
  room_id    uuid not null references public.duo_rooms(id) on delete cascade,
  item_key   text not null,          -- "node:<id>", "task:<id>", "clip:<id>"
  page_id    text not null,          -- Notion page id
  hash       text not null,          -- hash of the last properties sent, to skip unchanged rows
  updated_at timestamptz not null default now(),
  primary key (room_id, item_key)
);

create table if not exists public.duo_notion_sync_state (
  room_id      uuid primary key references public.duo_rooms(id) on delete cascade,
  synced_rev   bigint not null default 0,
  complete     boolean not null default false,
  last_run_at  timestamptz,
  last_error   text,
  last_summary jsonb
);

-- Only the Edge Function (service role) reads or writes these. RLS on with no policies = no client access.
alter table public.duo_notion_sync_items enable row level security;
alter table public.duo_notion_sync_state enable row level security;
revoke all on public.duo_notion_sync_items, public.duo_notion_sync_state from anon, authenticated;

-- Shared secret between the cron job and the function, generated here and kept in Vault.
select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'duo_notion_sync_secret', 'Duo → Notion sync cron secret')
where not exists (select 1 from vault.secrets where name = 'duo_notion_sync_secret');

create or replace function public.duo_notion_sync_secret() returns text
language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'duo_notion_sync_secret'
$$;
revoke all on function public.duo_notion_sync_secret() from public, anon, authenticated;
grant execute on function public.duo_notion_sync_secret() to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The job does nothing heavy when Duo hasn't changed: the function exits early.
select cron.unschedule('duo-notion-sync') where exists (select 1 from cron.job where jobname = 'duo-notion-sync');
select cron.schedule(
  'duo-notion-sync',
  '*/5 * * * *',
  $$
  select net.http_post(
    url     := 'https://cwtloacfsvyjemywmotl.supabase.co/functions/v1/notion-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'duo_notion_sync_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
