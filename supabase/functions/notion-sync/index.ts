// Duo → Notion one-way sync.
// Runs on a schedule (pg_cron + pg_net, see supabase/migrations/*_notion_sync.sql).
// Reads the "Master" workspace from duo_rooms with the service role and mirrors it into the
// Duo Hub databases in Notion: Opportunities (Mind Web map), Tasks and Clipping Campaigns.
// Duo is the source of truth: edits made in Notion to synced rows are overwritten on the next change.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets):
//   NOTION_TOKEN   internal integration token; the Duo Hub page must be shared with that integration
//   SYNC_SECRET    shared secret the cron job sends in the x-sync-secret header
// Optional:
//   DUO_ROOM_NAME  workspace to sync (default "Master")
//   NOTION_DB_OPPORTUNITIES / NOTION_DB_TASKS / NOTION_DB_CLIPS  database ids (defaults below)
import { createClient } from "jsr:@supabase/supabase-js@2";
import { desiredRows, plain, text, type Kind } from "./map.ts";

const NOTION_VERSION = "2022-06-28";
const DB = {
  node: Deno.env.get("NOTION_DB_OPPORTUNITIES") ?? "41e728ab51cf8196b9b7d1d647d85ed1",
  task: Deno.env.get("NOTION_DB_TASKS") ?? "41e728ab51cf81cba4edcdcdb2ead043",
  clip: Deno.env.get("NOTION_DB_CLIPS") ?? "41e728ab51cf815f86efcbfc71aaa681",
} as const;
const ID_PROP = "Duo ID";
const TIME_BUDGET_MS = 110_000; // stay well under the Free plan's 150 s wall clock
const MIN_GAP_MS = 340; // Notion allows ~3 requests/second

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

// ---------- Notion client with pacing and retry ----------
let lastCall = 0;
async function notion(method: string, path: string, body?: unknown): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    const res = await fetch(`https://api.notion.com/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${Deno.env.get("NOTION_TOKEN")}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      const ra = Number(res.headers.get("retry-after")) || 2 ** attempt;
      await new Promise((r) => setTimeout(r, ra * 1000));
      continue;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Notion ${method} ${path} → ${res.status}: ${json.message ?? ""}`);
    return json;
  }
}

async function hash(o: unknown) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(JSON.stringify(o)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Make sure each database has the hidden-in-plain-sight "Duo ID" column used to match rows.
async function ensureIdProp(kind: Kind) {
  const db = await notion("GET", `databases/${DB[kind]}`);
  if (!db.properties?.[ID_PROP]) await notion("PATCH", `databases/${DB[kind]}`, { properties: { [ID_PROP]: { rich_text: {} } } });
}

// Index of existing pages in a database, used once to adopt the rows made by the first snapshot.
async function indexDb(kind: Kind) {
  const byDuoId = new Map<string, string>();
  const byMatch = new Map<string, string[]>();
  let cursor: string | undefined;
  do {
    const r = await notion("POST", `databases/${DB[kind]}/query`, { page_size: 100, start_cursor: cursor });
    for (const p of r.results) {
      const pr = p.properties;
      const duoId = plain(pr[ID_PROP]);
      if (duoId) { byDuoId.set(duoId, p.id); continue; }
      if (kind === "node") {
        const k = [plain(pr.Name), pr.Type?.select?.name ?? "", pr.Category?.select?.name ?? "", plain(pr.Subcategory)].join("|");
        byMatch.set(k, [...(byMatch.get(k) ?? []), p.id]);
      }
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return { byDuoId, byMatch };
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("SYNC_SECRET");
  if (!secret || req.headers.get("x-sync-secret") !== secret) return new Response("forbidden", { status: 403 });
  if (!Deno.env.get("NOTION_TOKEN")) return Response.json({ error: "NOTION_TOKEN is not set" }, { status: 500 });
  const started = Date.now();
  const force = new URL(req.url).searchParams.has("force");
  const roomName = Deno.env.get("DUO_ROOM_NAME") ?? "Master";

  const { data: room, error } = await sb.from("duo_rooms").select("id,rev,data").eq("name", roomName).limit(1).maybeSingle();
  if (error || !room) return Response.json({ error: error?.message ?? `workspace "${roomName}" not found` }, { status: 500 });

  const { data: state } = await sb.from("duo_notion_sync_state").select("*").eq("room_id", room.id).maybeSingle();
  if (!force && state?.synced_rev === room.rev && state?.complete) {
    return Response.json({ skipped: true, rev: room.rev });
  }

  const summary = { created: 0, updated: 0, archived: 0, unchanged: 0, adopted: 0, pending: 0 };
  let lastError: string | null = null;
  try {
    const rows = desiredRows(room.data ?? {});
    const { data: mapped } = await sb.from("duo_notion_sync_items").select("item_key,page_id,hash").eq("room_id", room.id);
    const known = new Map((mapped ?? []).map((m) => [m.item_key, m]));
    const save = (item_key: string, page_id: string, h: string) =>
      sb.from("duo_notion_sync_items").upsert({ room_id: room.id, item_key, page_id, hash: h, updated_at: new Date().toISOString() });

    // First contact with a database: add the Duo ID column and adopt matching snapshot rows.
    const indexes = new Map<Kind, Awaited<ReturnType<typeof indexDb>>>();
    for (const kind of Object.keys(DB) as Kind[]) {
      if (rows.some((r) => r.kind === kind && !known.has(r.key))) {
        await ensureIdProp(kind);
        indexes.set(kind, await indexDb(kind));
      }
    }

    const outOfTime = () => Date.now() - started > TIME_BUDGET_MS;
    for (const r of rows) {
      const props = { ...r.props, [ID_PROP]: text(r.id) };
      const h = await hash(props);
      const m = known.get(r.key);
      if (m && m.hash === h) { summary.unchanged++; continue; }
      if (outOfTime()) { summary.pending++; continue; }
      let pageId = m?.page_id;
      if (!pageId) {
        const idx = indexes.get(r.kind);
        pageId = idx?.byDuoId.get(r.id);
        if (!pageId && r.match) {
          const cands = idx?.byMatch.get(r.match);
          if (cands?.length) { pageId = cands.shift(); summary.adopted++; }
        }
      }
      if (pageId) {
        await notion("PATCH", `pages/${pageId}`, { properties: props, archived: false });
        summary.updated++;
      } else {
        const p = await notion("POST", "pages", { parent: { database_id: DB[r.kind] }, properties: props });
        pageId = p.id;
        summary.created++;
      }
      await save(r.key, pageId!, h);
    }

    // Anything we synced before that is gone from Duo (deleted or archived) → move to Notion trash.
    const live = new Set(rows.map((r) => r.key));
    for (const [key, m] of known) {
      if (live.has(key)) continue;
      if (outOfTime()) { summary.pending++; continue; }
      try { await notion("PATCH", `pages/${m.page_id}`, { archived: true }); } catch (e) {
        if (!String(e).includes("404")) throw e;
      }
      await sb.from("duo_notion_sync_items").delete().eq("room_id", room.id).eq("item_key", key);
      summary.archived++;
    }
  } catch (e) {
    lastError = String(e instanceof Error ? e.message : e);
  }

  const complete = !lastError && summary.pending === 0;
  await sb.from("duo_notion_sync_state").upsert({
    room_id: room.id,
    synced_rev: room.rev,
    complete,
    last_run_at: new Date().toISOString(),
    last_error: lastError,
    last_summary: summary,
  });
  return Response.json({ rev: room.rev, complete, error: lastError, ...summary }, { status: lastError ? 500 : 200 });
});
