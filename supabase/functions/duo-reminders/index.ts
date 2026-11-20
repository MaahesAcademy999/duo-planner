/* duo-reminders — sends Duo phone reminders over Web Push.
   GET                         → { publicKey } so the app can subscribe (the VAPID public key is public by design)
   POST x-duo-cron: <secret>   → every 5 minutes from pg_cron: send whatever is due, once each
   POST Bearer <user token> {test:true} → send a test notification to the signed-in user's own devices
   Deploy with verify_jwt = false: the cron call has no user token, so this function checks callers itself.
   Keys live in Supabase Vault (see migration duo_push_config): the VAPID pair is generated here on first run,
   so nobody ever handles the private key. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
   Only duo_* tables are read or written. */
import { sendPush, b64u, type Vapid } from './webpush.ts';
import { dueNotes } from './reminders.ts';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID: Vapid = { publicKey: '', privateKey: '', subject: 'https://maahesacademy999.github.io/duo-planner/' };
let CRON_SECRET = '';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(`db ${path.split('?')[0]} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
async function loadConfig() {
  if (VAPID.publicKey && VAPID.privateKey && CRON_SECRET) return;
  let c = await db('rpc/duo_push_config', { method: 'POST', body: '{}' });
  if (!c.publicKey || !c.privateKey) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
    const pub = b64u(await crypto.subtle.exportKey('raw', kp.publicKey));
    const priv = (await crypto.subtle.exportKey('jwk', kp.privateKey)).d!;
    await db('rpc/duo_push_set_vapid', { method: 'POST', body: JSON.stringify({ p_public: pub, p_private: priv }) });
    c = await db('rpc/duo_push_config', { method: 'POST', body: '{}' }); // re-read: another run may have stored first
  }
  VAPID.publicKey = c.publicKey || '';
  VAPID.privateKey = c.privateKey || '';
  CRON_SECRET = c.cronSecret || '';
}
const inList = (ids: string[]) => `(${ids.map(encodeURIComponent).join(',')})`;

function safeEqual(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

type Sub = { id: string; user_id: string; room_id: string; endpoint: string; p256dh: string; auth: string; prefs: Record<string, unknown> };

async function deliver(sub: Sub, payload: unknown, topic?: string) {
  const r = await sendPush(sub, payload, VAPID, { topic });
  if (r.gone) await db(`duo_push_subs?id=eq.${sub.id}`, { method: 'DELETE' });
  else if (!r.ok) console.error('push failed', r.status, r.text);
  return r;
}

async function runCron() {
  const subs: Sub[] = await db('duo_push_subs?select=id,user_id,room_id,endpoint,p256dh,auth,prefs');
  if (!subs.length) return { subs: 0, sent: 0 };
  const roomIds = [...new Set(subs.map(s => s.room_id))];
  const rooms: { id: string; data: Record<string, unknown> }[] = await db(`duo_rooms?select=id,data&id=in.${inList(roomIds)}`);
  const members: { room_id: string; user_id: string; slot: string }[] = await db(`duo_members?select=room_id,user_id,slot&room_id=in.${inList(roomIds)}`);
  const since = new Date(Date.now() - 3 * 864e5).toISOString();
  const log: { sub_id: string; key: string }[] = await db(`duo_push_log?select=sub_id,key&sent_at=gte.${since}&sub_id=in.${inList(subs.map(s => s.id))}`);
  const sentKeys = new Set(log.map(l => `${l.sub_id}|${l.key}`));
  const roomData = new Map(rooms.map(r => [r.id, r.data]));
  const now = new Date();
  let sent = 0;
  for (const sub of subs) {
    const slot = members.find(m => m.room_id === sub.room_id && m.user_id === sub.user_id)?.slot;
    const data = roomData.get(sub.room_id);
    if (!slot || !data) continue; // no longer a member of that workspace
    for (const n of dueNotes(data, slot, sub.prefs, now)) {
      if (sentKeys.has(`${sub.id}|${n.key}`)) continue;
      // claim first so overlapping runs can't double-send
      const claimed = await db('duo_push_log?on_conflict=sub_id,key', {
        method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ sub_id: sub.id, key: n.key }),
      });
      if (!claimed || !claimed.length) continue;
      const r = await deliver(sub, { title: n.title, body: n.body, url: n.url, tag: n.tag }, n.tag);
      if (r.ok) sent++;
      if (r.gone) break;
      if (!r.ok) await db(`duo_push_log?sub_id=eq.${sub.id}&key=eq.${encodeURIComponent(n.key)}`, { method: 'DELETE' }); // retry next run
    }
  }
  await db(`duo_push_log?sent_at=lt.${new Date(Date.now() - 14 * 864e5).toISOString()}`, { method: 'DELETE' });
  return { subs: subs.length, sent };
}

async function userFrom(req: Request): Promise<string | null> {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tok) return null;
  const r = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: SERVICE, Authorization: `Bearer ${tok}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return typeof u.id === 'string' ? u.id : null;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    await loadConfig();
    if (!VAPID.publicKey || !VAPID.privateKey) return json({ error: 'Reminders are not set up on the server yet' }, 503);
    if (req.method === 'GET') return json({ publicKey: VAPID.publicKey });
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (safeEqual(req.headers.get('x-duo-cron') || '', CRON_SECRET)) return json(await runCron());
    const uid = await userFrom(req);
    if (!uid) return json({ error: 'Sign in first' }, 401);
    const subs: Sub[] = await db(`duo_push_subs?select=id,user_id,room_id,endpoint,p256dh,auth,prefs&user_id=eq.${uid}`);
    if (!subs.length) return json({ error: 'Reminders are not turned on for this account yet' }, 404);
    let sent = 0;
    for (const s of subs) if ((await deliver(s, { title: '🔔 Duo reminders are on', body: 'This is what a reminder looks like. Tap to open Duo.', url: './#/dash', tag: 'test' })).ok) sent++;
    return json({ sent, devices: subs.length });
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong sending reminders' }, 500);
  }
});
