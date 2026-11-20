# Notion hub sync

Duo copies the **Master** workspace into the Notion **Duo Hub** on its own, every 5 minutes.
It is one-way: Duo is the source of truth, so change things in Duo. Edits made to synced rows in Notion
are overwritten the next time that item changes in Duo.

| Notion database | Comes from | Columns |
|---|---|---|
| Opportunities | Mind Web map (not archived) | Name, Type, Category, Subcategory, Status, Owner, Priority, Decision, Next action |
| Tasks | All tasks | Task, Done, Day, Owner, Opportunity, Notes, Trading mode |
| Clipping Campaigns | Clipping campaigns | Campaign, Platform, Owner, Permission, Clips, Approved, Paid, Deadline, Campaign page, Submit page |

Each database gets a **Duo ID** column so rows can be matched even when names repeat. Items deleted or
archived in Duo move to Notion's trash (restorable for 30 days). Rows you add by hand in Notion, with no
Duo ID, are left alone.

## How it works

- `supabase/functions/notion-sync` — Edge Function. Reads `duo_rooms` with the service role, works out
  the rows the hub should have, and creates, updates or archives only what changed (it keeps a hash per
  row in `duo_notion_sync_items`). If the workspace revision hasn't moved since the last complete run it
  exits after one query.
- `supabase/migrations/*_notion_sync.sql` — the two bookkeeping tables (RLS on, no client access) and a
  `pg_cron` job that calls the function every 5 minutes through `pg_net`.
- The Notion token never reaches the browser; it is an Edge Function secret.
- The first run adopts the 205 rows from the earlier snapshot by matching Name + Type + Category +
  Subcategory, so nothing is duplicated. Notion allows about 3 requests a second, so if a run has more
  work than fits in ~110 seconds it stops and the next run carries on.

## Setup (one time)

1. Notion → Settings → Connections → Develop or manage integrations → **New integration** (internal).
   Copy its token.
2. Open the **Duo Hub** page → ••• → Connections → add that integration.
3. Supabase dashboard → Edge Functions → Secrets: add `NOTION_TOKEN` with that token.
4. Apply the migration (it generates the cron secret in Vault) and deploy the function with JWT
   verification off (it checks the `x-sync-secret` header against Vault instead).

Check on it any time:

```sql
select last_run_at, complete, last_error, last_summary from duo_notion_sync_state;
```
