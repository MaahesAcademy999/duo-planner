// Maps Duo workspace state to the Notion rows the hub should hold. Pure, no I/O, so it can be tested anywhere.
export type Kind = "node" | "task" | "clip";

// ---------- property helpers ----------
export const title = (s: string) => ({ title: [{ text: { content: clip(s) } }] });
export const text = (s: string) => ({ rich_text: s ? [{ text: { content: clip(s) } }] : [] });
// Notion select options can't contain commas ("Content, UGC & Marketing" → "Content UGC & Marketing").
const optName = (s: string) => s.replace(/,\s*/g, " ").trim().slice(0, 100);
const select = (s: string | null | undefined) => ({ select: s ? { name: optName(s) } : null });
const num = (n: number | null) => ({ number: n });
const url = (s: string | undefined) => ({ url: s ? s : null });
const clip = (s: string) => String(s ?? "").slice(0, 1900);
export const plain = (p: any) => (p?.title ?? p?.rich_text ?? []).map((t: any) => t.plain_text).join("");

const OWNER: Record<string, string> = { A: "Partner A", B: "Partner B", both: "Both" };
const STATUS: Record<string, string> = {
  idea: "Idea", researching: "Researching", needs_req: "Needs requirements", ready: "Ready to test",
  testing: "Testing", active: "Active", paused: "Paused", completed: "Completed", declined: "Not pursuing",
};
const KIND: Record<string, string> = { category: "Category", sub: "Subcategory", path: "Path", project: "Project" };
const PERM: Record<string, string> = {
  unknown: "Not checked", requested: "Requested", granted: "Granted by creator",
  campaign: "Covered by campaign terms", denied: "Denied",
};
const cap = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

// ---------- Duo state → desired Notion rows ----------
export type Row = { kind: Kind; key: string; id: string; props: Record<string, unknown>; match?: string };

export function desiredRows(S: any): Row[] {
  const nodes: any[] = (S.nodes ?? []).filter((n: any) => !n.archived);
  const byId = new Map<string, any>((S.nodes ?? []).map((n: any) => [n.id, n]));
  const chain = (n: any) => {
    const out: any[] = [];
    for (let c = n, i = 0; c && i < 50; c = byId.get(c.parent), i++) out.unshift(c);
    return out; // [top category, ..., n]
  };
  const rows: Row[] = [];
  for (const n of nodes) {
    const ch = chain(n);
    const category = ch[0]?.label ?? "";
    const subcategory = ch.length > 1 ? ch[1].label : "";
    const type = KIND[n.kind] ?? "Path";
    rows.push({
      kind: "node", key: `node:${n.id}`, id: n.id,
      match: [n.label, type, optName(category), n.kind === "category" ? "" : subcategory].join("|"),
      props: {
        Name: title(n.label ?? ""),
        Type: select(type),
        Category: select(category),
        Subcategory: text(n.kind === "category" ? "" : subcategory),
        Status: select(STATUS[n.status] ?? "Idea"),
        Owner: select(OWNER[n.owner ?? "both"]),
        Priority: select(cap(n.priority)),
        Decision: select(cap(n.card?.decision)),
        "Next action": text(n.card?.nextAction ?? ""),
      },
    });
  }
  const days = new Map<string, any>((S.days ?? []).map((d: any) => [d.id, d]));
  for (const t of S.tasks ?? []) {
    rows.push({
      kind: "task", key: `task:${t.id}`, id: t.id,
      props: {
        Task: title(t.title ?? ""),
        Done: { checkbox: !!t.done },
        Day: select(days.get(t.dayId)?.name ?? "Unscheduled"),
        Owner: select(OWNER[t.owner ?? "both"]),
        Opportunity: text(byId.get(t.nodeId)?.label ?? ""),
        Notes: text(t.notes ?? ""),
        "Trading mode": select(t.mode || null),
      },
    });
  }
  for (const c of S.clips ?? []) {
    const items: any[] = c.items ?? [];
    const subs: any[] = (c.subs ?? []).filter((s: any) => !s.item || !items.some((i) => i.id === s.item));
    const paid = items.reduce((a, i) => a + (+i.paid || 0), 0) + subs.reduce((a, s) => a + (+s.paid || 0), 0);
    rows.push({
      kind: "clip", key: `clip:${c.id}`, id: c.id,
      props: {
        Campaign: title(c.name ?? ""),
        Platform: select(c.host || "Other"),
        Owner: select(OWNER[c.owner ?? "both"]),
        Permission: select(PERM[c.perm ?? "unknown"]),
        Clips: num(items.length),
        Approved: num(items.filter((i) => ["approved", "submitted", "paid"].includes(i.stage)).length),
        Paid: num(paid),
        Deadline: { date: c.deadline ? { start: c.deadline } : null },
        "Campaign page": url(c.campaignUrl),
        "Submit page": url(c.submitUrl),
      },
    });
  }
  return rows;
}
