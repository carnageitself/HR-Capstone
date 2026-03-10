// app/api/action-queue/refresh/route.ts
//
// Nightly action queue refresh — runs automatically on first visit after 4am.
// - Recomputes action queue from fresh Supabase data
// - Removes items where the underlying issue is now resolved
// - Escalates items outstanding for 7+ days from info→warning, 14+ days warning→critical
// - Deduplicates by id
// - Preserves completed/deferred statuses from HR
//
// GET → run refresh if stale (past today's 4am), return updated queue
// POST → force refresh immediately

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadDashboardData } from "@/lib/loadDashboardData";
import type { ActionItem } from "@/lib/loadDashboardData";

export const maxDuration = 60;

const QUEUE_CACHE_PATH  = path.join(process.cwd(), "data", "action-queue-cache.json");
const STATUS_PATH       = path.join(process.cwd(), "data", "action-queue-status.json");

// ── Cache version — bump when ActionItem shape changes ────────────────────────
const QUEUE_VERSION = 1;

interface QueueCache {
  items: ActionItem[];
  generatedAt: string;
  version: number;
}

interface StatusEntry {
  status: "open" | "completed" | "deferred";
  updatedAt: string;
  deferredUntil?: string;
}

type StatusMap = Record<string, StatusEntry>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function readQueueCache(): QueueCache | null {
  try {
    if (!fs.existsSync(QUEUE_CACHE_PATH)) return null;
    const c = JSON.parse(fs.readFileSync(QUEUE_CACHE_PATH, "utf-8")) as QueueCache;
    if (c.version !== QUEUE_VERSION) return null;
    return c;
  } catch { return null; }
}

function writeQueueCache(items: ActionItem[]): void {
  try {
    const dir = path.dirname(QUEUE_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const cache: QueueCache = { items, generatedAt: new Date().toISOString(), version: QUEUE_VERSION };
    fs.writeFileSync(QUEUE_CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (err) { console.error("[action-queue/refresh] Write failed:", err); }
}

function readStatuses(): StatusMap {
  try {
    if (!fs.existsSync(STATUS_PATH)) return {};
    return JSON.parse(fs.readFileSync(STATUS_PATH, "utf-8")) as StatusMap;
  } catch { return {}; }
}

function isStale(cache: QueueCache | null): boolean {
  if (!cache) return true;
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(4, 0, 0, 0);
  if (now < cutoff) cutoff.setDate(cutoff.getDate() - 1);
  return new Date(cache.generatedAt) < cutoff;
}

// ── Escalate urgency based on how long an item has been outstanding ───────────
function escalateUrgency(item: ActionItem, statuses: StatusMap, prevItems: ActionItem[]): ActionItem {
  const entry = statuses[item.id];
  // If HR marked it completed or deferred, don't escalate
  if (entry?.status === "completed" || entry?.status === "deferred") return item;

  const prev = prevItems.find(p => p.id === item.id);
  if (!prev) return item; // new item, no escalation yet

  // How many days has this been in the queue?
  const prevCache = readQueueCache();
  if (!prevCache) return item;
  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(prevCache.generatedAt).getTime()) / 86400000
  );

  // Escalation rules
  let { urgency } = item;
  if (daysSinceAdded >= 14 && urgency === "warning") urgency = "critical";
  else if (daysSinceAdded >= 7  && urgency === "info")    urgency = "warning";

  return { ...item, urgency };
}

// ── Deduplicate by id ─────────────────────────────────────────────────────────
function deduplicateById(items: ActionItem[]): ActionItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ── Run the full refresh ──────────────────────────────────────────────────────
async function runRefresh(): Promise<ActionItem[]> {
  const data = await loadDashboardData();
  const freshItems = data.actionQueue ?? [];
  const statuses   = readStatuses();
  const prevCache  = readQueueCache();
  const prevItems  = prevCache?.items ?? [];

  // 1. Start with fresh items from Supabase loader (already computed)
  // 2. Deduplicate
  let items = deduplicateById(freshItems);

  // 3. Remove items that have been completed AND the underlying data confirms resolution
  //    e.g. invisible contributor who has now received an award → their id won't
  //    appear in freshItems anymore, so they're naturally dropped.
  //    For items still in freshItems, check if HR marked them completed.
  const completedIds = new Set(
    Object.entries(statuses)
      .filter(([, v]) => v.status === "completed")
      .map(([id]) => id)
  );

  // Keep completed items out of the active queue (they're done)
  items = items.filter(item => !completedIds.has(item.id));

  // 4. Escalate urgency for items outstanding 7+ / 14+ days
  items = items.map(item => escalateUrgency(item, statuses, prevItems));

  // 5. Re-sort: critical → warning → info, then by dept
  const ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) =>
    (ORDER[a.urgency] ?? 2) - (ORDER[b.urgency] ?? 2) || a.dept.localeCompare(b.dept)
  );

  writeQueueCache(items);
  return items;
}

// ── GET — serve cached queue, refresh in background if stale ─────────────────
let refreshInFlight = false;

export async function GET() {
  const cache = readQueueCache();

  if (isStale(cache) && !refreshInFlight) {
    // Background refresh — non-blocking
    refreshInFlight = true;
    void (async () => {
      try { await runRefresh(); }
      catch (err) { console.error("[action-queue/refresh] Background refresh failed:", err); }
      finally { refreshInFlight = false; }
    })();
  }

  if (!cache) {
    return NextResponse.json({ items: [], generatedAt: null, refreshing: true });
  }

  return NextResponse.json({
    items: cache.items,
    generatedAt: cache.generatedAt,
    stale: isStale(cache),
    refreshing: refreshInFlight,
    counts: {
      critical: cache.items.filter(i => i.urgency === "critical").length,
      warning:  cache.items.filter(i => i.urgency === "warning").length,
      info:     cache.items.filter(i => i.urgency === "info").length,
      total:    cache.items.length,
    },
  });
}

// ── POST — force refresh immediately ─────────────────────────────────────────
export async function POST(_req: NextRequest) {
  try {
    const items = await runRefresh();
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      counts: {
        critical: items.filter(i => i.urgency === "critical").length,
        warning:  items.filter(i => i.urgency === "warning").length,
        info:     items.filter(i => i.urgency === "info").length,
        total:    items.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}