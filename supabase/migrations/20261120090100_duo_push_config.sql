-- Keys for phone reminders live in Supabase Vault, never in the app or the repo.
-- The duo-reminders function creates its own VAPID key pair on first run (so no person ever sees the private key)
-- and reads keys through these service-role-only functions. The cron secret is random and created here.

create or replace function public.duo_push_config()
returns jsonb language sql stable security definer set search_path to '' as $$
  select jsonb_build_object(
    'publicKey',  (select decrypted_secret from vault.decrypted_secrets where name = 'duo_vapid_public'),
    'privateKey', (select decrypted_secret from vault.decrypted_secrets where name = 'duo_vapid_private'),
    'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'duo_cron_secret'))
$$;

-- store the generated VAPID pair once; never overwrites (a new pair would break every phone's subscription)
create or replace function public.duo_push_set_vapid(p_public text, p_private text)
returns jsonb language plpgsql security definer set search_path to '' as $$
begin
  perform pg_advisory_xact_lock(hashtext('duo_vapid'));
  if not exists (select 1 from vault.secrets where name = 'duo_vapid_public') then
    perform vault.create_secret(p_public, 'duo_vapid_public', 'Duo reminders VAPID public key');
    perform vault.create_secret(p_private, 'duo_vapid_private', 'Duo reminders VAPID private key');
  end if;
  return jsonb_build_object('publicKey', (select decrypted_secret from vault.decrypted_secrets where name = 'duo_vapid_public'));
end $$;

revoke all on function public.duo_push_config() from public, anon, authenticated;
revoke all on function public.duo_push_set_vapid(text, text) from public, anon, authenticated;
grant execute on function public.duo_push_config() to service_role;
grant execute on function public.duo_push_set_vapid(text, text) to service_role;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'duo_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'duo_cron_secret', 'Duo reminders cron secret');
  end if;
end $$;
