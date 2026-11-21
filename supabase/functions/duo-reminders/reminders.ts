/* Pure reminder logic: given a workspace, a partner slot, preferences and "now", decide which notifications are due.
   No I/O here, so it can be tested without a database or push service. */

export type Prefs = { digest: boolean; digestHour: number; timed: boolean; before: number; checkin: boolean; checkinHour: number };
export const DEFAULT_PREFS: Prefs = { digest: true, digestHour: 8, timed: true, before: 15, checkin: true, checkinHour: 20 };

export type Note = { key: string; title: string; body: string; url: string; tag: string };

type Any = Record<string, any>;

export function cleanPrefs(p: Any | null | undefined): Prefs {
  const n = (v: unknown, lo: number, hi: number, d: number) => { const x = Math.round(Number(v)); return Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  p = p || {};
  return {
    digest: p.digest !== false,
    digestHour: n(p.digestHour, 0, 23, DEFAULT_PREFS.digestHour),
    timed: p.timed !== false,
    before: n(p.before, 0, 180, DEFAULT_PREFS.before),
    checkin: p.checkin !== false,
    checkinHour: n(p.checkinHour, 0, 23, DEFAULT_PREFS.checkinHour),
  };
}

/** Local date, weekday and minute-of-day in a time zone. */
export function localNow(now: Date, tz: string): { date: string; weekday: string; minutes: number } {
  let zone = tz;
  try { new Intl.DateTimeFormat('en-US', { timeZone: zone }); } catch { zone = 'UTC'; }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: parts.weekday, minutes: (+parts.hour % 24) * 60 + +parts.minute };
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Read the start time out of the free-text time field: "3pm", "3:30 PM", "15:00", "9am–11am", "9.15". */
export function parseTime(s: unknown): number | null {
  const m = String(s ?? '').trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!m) return null;
  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  const ap = (m[3] || '').toLowerCase()[0];
  if (min > 59 || h > 23) return null;
  if (ap) { if (h < 1 || h > 12) return null; if (ap === 'p' && h < 12) h += 12; if (ap === 'a' && h === 12) h = 0; }
  return h * 60 + min;
}

const fmtMin = (m: number) => { const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 || 12}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`; };
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const mine = (owner: unknown, slot: string) => !owner || owner === 'both' || owner === slot;
const list = (xs: string[], max = 3) => xs.slice(0, max).join(', ') + (xs.length > max ? ` +${xs.length - max} more` : '');

type Due = { label: string; date: string; url: string; task?: boolean };

/** Everything with a calendar date that belongs to this partner. */
function dated(data: Any, slot: string): Due[] {
  const out: Due[] = [];
  for (const t of data.tasks || []) if (!t.done && isDate(t.due) && mine(t.owner, slot)) out.push({ label: t.title || 'Task', date: t.due, url: './#/tasks', task: true });
  for (const c of data.clips || []) {
    const items: Any[] = c.items || [];
    const allPaid = items.length > 0 && items.every(i => i.stage === 'paid');
    if (isDate(c.deadline) && !allPaid && mine(c.owner, slot)) out.push({ label: `${c.name || 'Campaign'} deadline`, date: c.deadline, url: './#/clips' });
    for (const i of items) if (isDate(i.due) && !['submitted', 'paid'].includes(i.stage) && mine(i.owner ?? c.owner, slot))
      out.push({ label: `${i.hook || 'Clip'} (${c.name || 'campaign'})`, date: i.due, url: './#/clips' });
  }
  return out;
}

export function dueNotes(data: Any, slot: string, prefsIn: Any, now: Date): Note[] {
  const prefs = cleanPrefs(prefsIn);
  const { date, weekday, minutes } = localNow(now, data.tz || 'UTC');
  const days: Any[] = (data.days || []).filter((d: Any) => !d.archived);
  const todayIds = new Set(days.filter(d => String(d.name || '').trim().toLowerCase() === weekday.toLowerCase()).map(d => d.id));
  const todays = (data.tasks || []).filter((t: Any) => !t.done && mine(t.owner, slot) && ((t.dayId && todayIds.has(t.dayId)) || t.due === date));
  const notes: Note[] = [];

  /* 1. timed reminders: a task for today with a start time, sent `before` minutes ahead */
  if (prefs.timed) for (const t of todays) {
    const at = parseTime(t.time);
    if (at === null) continue;
    if (minutes >= at - prefs.before && minutes <= at) {
      const left = at - minutes;
      notes.push({ key: `t:${t.id}:${date}`, title: `⏰ ${t.title || 'Task'}`, body: left <= 0 ? `Starting now (${fmtMin(at)})` : `Starts in ${left} min, at ${fmtMin(at)}`, url: './#/tasks', tag: `t-${t.id}` });
    }
  }

  /* 2. morning summary: once a day, in the two hours after the chosen hour, only if there is something to say */
  const start = prefs.digestHour * 60;
  if (prefs.digest && minutes >= start && minutes < start + 120) {
    const ds = dated(data, slot);
    const tomorrow = addDays(date, 1);
    const lines: string[] = [];
    if (todays.length) lines.push(`${todays.length} task${todays.length > 1 ? 's' : ''} today: ${list(todays.map((t: Any) => t.title || 'Task'))}`);
    const today = ds.filter(d => d.date === date && !d.task); // tasks due today are already in the line above
    if (today.length) lines.push(`Due today: ${list(today.map(d => d.label))}`);
    const tom = ds.filter(d => d.date === tomorrow);
    if (tom.length) lines.push(`Due tomorrow: ${list(tom.map(d => d.label))}`);
    const late = ds.filter(d => d.date < date);
    if (late.length) lines.push(`Overdue: ${list(late.map(d => d.label))}`);
    if (lines.length) notes.push({ key: `d:${date}`, title: '☀ Today in Duo', body: lines.join('\n'), url: './#/dash', tag: 'digest' });
  }

  /* 3. research check-in nudge: once a day after the chosen hour, for split topics where this partner owns a part and hasn't checked in today */
  const ciStart = prefs.checkinHour * 60;
  if (prefs.checkin && minutes >= ciStart && minutes < ciStart + 120) {
    const filled = (n: Any) => n && ['l', 's', 'q', 'n'].some(k => String(n[k] || '').trim());
    const counts = (c: Any) => !!c && Object.values(c.notes || {}).some(filled);
    const ci = (tid: string, s: string) => (data.checkins || []).find((c: Any) => c.id === `ci-${tid}-${date}-${s}`);
    const other = slot === 'A' ? 'B' : 'A';
    const owed = (data.research || []).filter((t: Any) => t.status !== 'done' && (t.subs || []).some((s: Any) => s.owner === slot || s.owner === 'both') && !counts(ci(t.id, slot)));
    if (owed.length) {
      const pname = ((data.partners || []).find((p: Any) => p.id === other) || {}).name || 'Your partner';
      const waiting = owed.filter((t: Any) => counts(ci(t.id, other)));
      notes.push({ key: `r:${date}`, title: '🧩 Research check-in', tag: 'checkin', url: './#/research',
        body: `Share what you learned today on ${list(owed.map((t: Any) => t.title || 'your topic'), 2)}.` + (waiting.length ? ` ${pname} already checked in, so you can compare notes.` : '') });
    }
  }
  return notes;
}
