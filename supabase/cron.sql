-- Run once after the duo-reminders function is deployed (not a migration: it needs a secret).
-- 1. Pick a long random secret, set it as the Edge Function secret DUO_CRON_SECRET, and store the same value in Vault:
--      select vault.create_secret('<same secret>', 'duo_cron_secret');
-- 2. Then schedule the 5-minute run:
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('duo-reminders', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://cwtloacfsvyjemywmotl.supabase.co/functions/v1/duo-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-duo-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'duo_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000)
$$);
-- To stop reminders: select cron.unschedule('duo-reminders');
