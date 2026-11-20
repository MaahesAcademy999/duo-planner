-- Run the duo-reminders function every 5 minutes. The cron secret comes from Vault (created in duo_push_config).
-- To stop reminders: select cron.unschedule('duo-reminders');
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('duo-reminders', '*/5 * * * *', $cron$
  select net.http_post(
    url := 'https://cwtloacfsvyjemywmotl.supabase.co/functions/v1/duo-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-duo-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'duo_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000)
$cron$);
