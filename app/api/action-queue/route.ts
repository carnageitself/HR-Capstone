// app/api/action-queue/route.ts
//
// Persists HR action item statuses across sessions.
// Statuses: "open" | "completed" | "deferred"
//
// GET    → returns current status map { [actionId]: { status, updatedAt, deferredUntil? } }
// PATCH  → update one item's status
// DELETE → clear completed items (called after nightly analysis picks them up)
//
// Store: {project_root}/data/action-queue-status.json

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STATUS_PATH = path.join(process.cwd(), "data", "action-queue-status.json");

export type ActionStatus = "open" | "completed" | "deferred";

export interface ActionStatusEntry {
  status: ActionStatus;
  updatedAt: string;         // ISO
  deferredUntil?: string;    // ISO date — deferred items reopen after this date
  note?: string;
}

type StatusMap = Record<string, ActionStatusEntry>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function readStatuses(): StatusMap {
  try {
    if (!fs.existsSync(STATUS_PATH)) return {};
    return JSON.parse(fs.readFileSync(STATUS_PATH, "utf-8")) as StatusMap;
  } catch {
    return {};
  }
}

function writeStatuses(map: StatusMap): void {
  try {
    const dir = path.dirname(STATUS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATUS_PATH, JSON.stringify(map, null, 2), "utf-8");
  } catch (err) {
    console.error("[action-queue] Status write failed:", err);
  }
}

/**
 * Auto-reopen deferred items whose deferredUntil date has passed.
 * Called on every GET so the queue is always fresh.
 */
function autoReopenDeferred(map: StatusMap): StatusMap {
  const now = new Date().toISOString();
  let changed = false;
  for (const [id, entry] of Object.entries(map)) {
    if (entry.status === "deferred" && entry.deferredUntil && entry.deferredUntil <= now) {
      map[id] = { status: "open", updatedAt: now };
      changed = true;
    }
  }
  if (changed) writeStatuses(map);
  return map;
}

// ── GET — return all statuses (auto-reopen expired deferrals) ─────────────────
export async function GET() {
  const statuses = autoReopenDeferred(readStatuses());
  return NextResponse.json(statuses);
}

// ── PATCH — update a single item's status ────────────────────────────────────
export async function PATCH(req: NextRequest) {
  let body: { id: string; status: ActionStatus; note?: string; deferUntilTomorrow?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, status, note, deferUntilTomorrow } = body;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const statuses = readStatuses();

  // Calculate deferral window: next day at 4am (matches the AI refresh window)
  let deferredUntil: string | undefined;
  if (status === "deferred" && deferUntilTomorrow !== false) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(4, 0, 0, 0);
    deferredUntil = tomorrow.toISOString();
  }

  statuses[id] = {
    status,
    updatedAt: new Date().toISOString(),
    ...(deferredUntil ? { deferredUntil } : {}),
    ...(note ? { note } : {}),
  };

  writeStatuses(statuses);
  return NextResponse.json({ ok: true, entry: statuses[id] });
}

// ── DELETE — remove completed items from the status file ─────────────────────
// Called by the AI analysis route after it has read and included them in the briefing.
export async function DELETE() {
  const statuses = readStatuses();
  const cleaned: StatusMap = {};
  for (const [id, entry] of Object.entries(statuses)) {
    // Keep deferred and open items; drop completed ones
    if (entry.status !== "completed") cleaned[id] = entry;
  }
  writeStatuses(cleaned);
  return NextResponse.json({ ok: true, removed: Object.keys(statuses).length - Object.keys(cleaned).length });
}