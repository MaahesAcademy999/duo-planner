-- Duo "Posted today" tracker: Clip Farmer (on Sun's PC) reports each clip it posts or Sun marks as posted.
-- Only adds new duo_post_* / duo_feed_* objects. Tables are locked (RLS on, no policies); everything goes through RPCs.
--   duo_feed_post      called by the PC with a feed key (can only add post rows to its own workspace)
--   duo_post_progress  called by Duo for a signed-in member: the last N days of posts

create table if not exists public.duo_feed_keys (
  key_hash text primary key,
  room_id uuid not null references public.duo_rooms(id) on delete cascade,
  label text not null default 'Clip Farmer',
  created_at timestamptz not null default now()
);
alter table public.duo_feed_keys enable row level security;
revoke all on public.duo_feed_keys from anon, authenticated;

create table if not exists public.duo_post_log (
  id bigserial primary key,
  room_id uuid not null references public.duo_rooms(id) on delete cascade,
  clip_key text not null,
  clip_title text,
  campaign text,
  platform text not null check (platform in ('tiktok','youtube','instagram','x')),
  via text not null default 'manual' check (via in ('manual','auto')),
  posted_at timestamptz not null default now(),
  unique (room_id, clip_key, platform)
);
create index if not exists duo_post_log_room_time on public.duo_post_log(room_id, posted_at desc);
alter table public.duo_post_log enable row level security;
revoke all on public.duo_post_log from anon, authenticated;

create or replace function public.duo_feed_post(p_key text, p_clip_key text, p_clip_title text, p_campaign text,
                                                p_platform text, p_via text default 'manual', p_posted_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_room uuid;
begin
  if coalesce(length(p_key),0) not between 32 and 128 then return jsonb_build_object('error','bad key'); end if;
  select room_id into v_room from public.duo_feed_keys
   where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');
  if v_room is null then return jsonb_build_object('error','unknown key'); end if;
  if coalesce(length(p_clip_key),0) not between 1 and 200 or p_platform not in ('tiktok','youtube','instagram','x') then
    return jsonb_build_object('error','bad post');
  end if;
  insert into public.duo_post_log(room_id, clip_key, clip_title, campaign, platform, via, posted_at)
  values (v_room, p_clip_key, left(p_clip_title, 200), left(p_campaign, 120), p_platform,
          case when p_via = 'auto' then 'auto' else 'manual' end,
          least(coalesce(p_posted_at, now()), now()))
  on conflict (room_id, clip_key, platform) do nothing;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.duo_post_progress(p_room uuid, p_days int default 14)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  if auth.uid() is null then return jsonb_build_object('error','Sign in first'); end if;
  if not public.duo_is_member(p_room) then return jsonb_build_object('error','No access to this workspace'); end if;
  return jsonb_build_object('ok', true, 'posts', coalesce((
    select jsonb_agg(jsonb_build_object('clip', clip_key, 'title', clip_title, 'campaign', campaign,
                                        'platform', platform, 'via', via, 'at', posted_at) order by posted_at desc)
      from public.duo_post_log
     where room_id = p_room and posted_at > now() - make_interval(days => least(greatest(coalesce(p_days,14),1),60))
  ), '[]'::jsonb));
end $$;

revoke all on function public.duo_feed_post(text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.duo_post_progress(uuid, int) from public, anon;
grant execute on function public.duo_feed_post(text, text, text, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.duo_post_progress(uuid, int) to authenticated;
