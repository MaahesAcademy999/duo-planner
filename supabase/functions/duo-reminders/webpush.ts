/* Web Push sender built only on WebCrypto (works in Supabase Edge / Deno and in Node 22).
   - Payload encryption: RFC 8291 (aes128gcm content coding, RFC 8188)
   - Sender identity: VAPID, RFC 8292 (ES256 JWT)
   Keys use the common web-push format: base64url raw public key (65 bytes) + base64url private scalar (32 bytes). */

export type PushSub = { endpoint: string; p256dh: string; auth: string };
export type Vapid = { publicKey: string; privateKey: string; subject: string };

const enc = new TextEncoder();

export function b64u(buf: ArrayBuffer | Uint8Array): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(s: string): Uint8Array {
  const p = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(p + '==='.slice((p.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

/** Encrypt a payload for one subscription (single aes128gcm record). */
export async function encryptPayload(sub: PushSub, plaintext: Uint8Array): Promise<Uint8Array> {
  const uaPublic = unb64u(sub.p256dh);
  const authSecret = unb64u(sub.auth);
  if (uaPublic.length !== 65 || uaPublic[0] !== 4) throw new Error('bad p256dh key');
  if (authSecret.length < 16) throw new Error('bad auth secret');
  const asKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256));
  const ikm = await hkdf(authSecret, ecdh, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const padded = concat(plaintext, new Uint8Array([2])); // 0x02 = last (and only) record
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, padded));
  const rs = 4096;
  const header = concat(salt, new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255, asPublic.length]), asPublic);
  return concat(header, cipher);
}

const keyCache = new Map<string, CryptoKey>();
async function vapidKey(v: Vapid): Promise<CryptoKey> {
  const hit = keyCache.get(v.privateKey);
  if (hit) return hit;
  const pub = unb64u(v.publicKey);
  if (pub.length !== 65) throw new Error('bad VAPID public key');
  const jwk = { kty: 'EC', crv: 'P-256', x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), d: v.privateKey, ext: true };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  keyCache.set(v.privateKey, key);
  return key;
}

/** VAPID Authorization header value for a push service origin. */
export async function vapidAuth(endpoint: string, v: Vapid, now = Date.now()): Promise<string> {
  const aud = new URL(endpoint).origin;
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub: v.subject })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await vapidKey(v), enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${v.publicKey}`;
}

/* Only real browser push services may be called (stops the function being pointed at arbitrary URLs). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];
export function allowedEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === 'https:' && PUSH_HOSTS.some(r => r.test(u.hostname));
  } catch { return false; }
}

export type SendResult = { ok: boolean; status: number; gone: boolean; text?: string };

/** Send one notification. `gone` means the subscription is dead and should be deleted. */
export async function sendPush(sub: PushSub, payload: unknown, v: Vapid, opts: { ttl?: number; urgency?: string; topic?: string } = {}): Promise<SendResult> {
  if (!allowedEndpoint(sub.endpoint)) return { ok: false, status: 0, gone: true, text: 'endpoint not allowed' };
  const body = await encryptPayload(sub, enc.encode(JSON.stringify(payload)));
  const headers: Record<string, string> = {
    Authorization: await vapidAuth(sub.endpoint, v),
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(opts.ttl ?? 6 * 3600),
    Urgency: opts.urgency ?? 'high',
  };
  if (opts.topic) headers.Topic = opts.topic.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
  const r = await fetch(sub.endpoint, { method: 'POST', headers, body });
  const text = r.ok ? undefined : (await r.text()).slice(0, 300);
  return { ok: r.ok, status: r.status, gone: r.status === 404 || r.status === 410, text };
}
