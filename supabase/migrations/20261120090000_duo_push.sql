-- Duo phone reminders: one row per device that turned reminders on, plus a send log so each reminder goes out once.
-- Only touches new duo_push_* objects. Tables are locked (RLS on, no policies); the app goes through the RPCs below,
-- and the duo-reminders Edge Function reads them with the service role.

create table if not exists public.duo_push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.duo_rooms(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists duo_push_subs_user on public.duo_push_subs(user_id);
alter table public.duo_push_subs enable row level security;
revoke all on public.duo_push_subs from anon, authenticated;

create table if not exists public.duo_push_log (
  sub_id uuid not null references public.duo_push_subs(id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (sub_id, key)
);
create index if not exists duo_push_log_sent on public.duo_push_log(sent_at);
alter table public.duo_push_log enable row level security;
revoke all on public.duo_push_log from anon, authenticated;

-- save / update this device's subscription for a workspace the caller belongs to
create or replace function public.duo_push_save(p_room uuid, p_endpoint text, p_p256dh text, p_auth text, p_prefs jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if auth.uid() is null then return jsonb_build_object('error','Sign in first'); end if;
  if not public.duo_is_member(p_room) then return jsonb_build_object('error','No access to this workspace'); end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1000
     or coalesce(length(p_p256dh),0) not between 80 and 100 or coalesce(length(p_auth),0) not between 16 and 40 then
    return jsonb_build_object('error','That notification subscription looks invalid');
  end if;
  insert into public.duo_push_subs(user_id, room_id, endpoint, p256dh, auth, prefs)
  values (auth.uid(), p_room, p_endpoint, p_p256dh, p_auth, coalesce(p_prefs,'{}'::jsonb))
  on conflict (endpoint) do update set user_id = excluded.user_id, room_id = excluded.room_id, p256dh = excluded.p256dh,
    auth = excluded.auth, prefs = excluded.prefs, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- turn reminders off for this device (only your own row)
create or replace function public.duo_push_delete(p_endpoint text)
returns jsonb language sql security definer set search_path to '' as $$
  with d as (delete from public.duo_push_subs where endpoint = p_endpoint and user_id = auth.uid() returning 1)
  select jsonb_build_object('ok', true, 'removed', (select count(*) from d))
$$;

revoke all on function public.duo_push_save(uuid, text, text, text, jsonb) from public, anon;
revoke all on function public.duo_push_delete(text) from public, anon;
grant execute on function public.duo_push_save(uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.duo_push_delete(text) to authenticated;
