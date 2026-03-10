// app/api/automation/rising-star-alerts/route.ts
//
// Daily check: identifies employees with slope > 0.5 who have appeared as
// rising stars for 2+ consecutive daily runs. Saves alert records for display
// in the dashboard and inclusion in the weekly email.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadDashboardData } from "@/lib/loadDashboardData";

export const maxDuration = 30;

const ALERTS_PATH   = path.join(process.cwd(), "data", "rising-star-alerts.json");
const PREV_PATH     = path.join(process.cwd(), "data", "rising-star-prev.json");

interface RisingStarAlert {
  id: string;
  name: string;
  dept: string;
  seniority: string;
  slope: number;
  consecutiveDays: number;
  firstDetected: string;
  lastChecked: string;
  recent: number;
  total: number;
  alertLevel: "watch" | "notify" | "urgent";
}

interface AlertsFile {
  alerts: RisingStarAlert[];
  lastChecked: string;
}

interface PrevFile {
  risingStarIds: string[];
  checkedAt: string;
}

function readAlerts(): AlertsFile {
  try {
    if (!fs.existsSync(ALERTS_PATH)) return { alerts: [], lastChecked: "" };
    return JSON.parse(fs.readFileSync(ALERTS_PATH, "utf-8")) as AlertsFile;
  } catch { return { alerts: [], lastChecked: "" }; }
}

function readPrev(): PrevFile {
  try {
    if (!fs.existsSync(PREV_PATH)) return { risingStarIds: [], checkedAt: "" };
    return JSON.parse(fs.readFileSync(PREV_PATH, "utf-8")) as PrevFile;
  } catch { return { risingStarIds: [], checkedAt: "" }; }
}

function write(filePath: string, data: unknown): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) { console.error(`[rising-star-alerts] Write failed (${filePath}):`, err); }
}

export async function GET() {
  try {
    const data   = await loadDashboardData();
    const rising = data.intelligence.risingStars.filter(p => p.slope > 0.3);

    const prev          = readPrev();
    const prevIds       = new Set(prev.risingStarIds);
    const existingAlerts = readAlerts();
    const alertMap      = new Map(existingAlerts.alerts.map(a => [a.id, a]));
    const now           = new Date().toISOString();

    // Update or create alert for each current rising star
    for (const star of rising) {
      const existing = alertMap.get(star.id);
      const wasRisingYesterday = prevIds.has(star.id);

      if (existing) {
        // Update consecutive days if they appeared yesterday
        const consecutiveDays = wasRisingYesterday
          ? existing.consecutiveDays + 1
          : 1; // reset if they disappeared

        const alertLevel: RisingStarAlert["alertLevel"] =
          consecutiveDays >= 7 ? "urgent" :
          consecutiveDays >= 3 ? "notify" : "watch";

        alertMap.set(star.id, {
          ...existing,
          slope: star.slope,
          recent: star.recent,
          total: star.total,
          consecutiveDays,
          lastChecked: now,
          alertLevel,
        });
      } else {
        // New rising star
        alertMap.set(star.id, {
          id: star.id,
          name: star.name,
          dept: star.dept,
          seniority: star.seniority,
          slope: star.slope,
          consecutiveDays: 1,
          firstDetected: now,
          lastChecked: now,
          recent: star.recent,
          total: star.total,
          alertLevel: "watch",
        });
      }
    }

    // Remove employees no longer rising
    const currentIds = new Set(rising.map(s => s.id));
    for (const id of alertMap.keys()) {
      if (!currentIds.has(id)) alertMap.delete(id);
    }

    const alerts = Array.from(alertMap.values())
      .sort((a, b) => b.consecutiveDays - a.consecutiveDays);

    const alertsFile: AlertsFile = { alerts, lastChecked: now };
    const prevFile: PrevFile = { risingStarIds: rising.map(s => s.id), checkedAt: now };

    write(ALERTS_PATH, alertsFile);
    write(PREV_PATH, prevFile);

    const notifyCount = alerts.filter(a => a.alertLevel !== "watch").length;
    if (notifyCount > 0) {
      console.log(`[rising-star-alerts] ${notifyCount} employee(s) flagged for manager notification`);
    }

    return NextResponse.json({ ok: true, total: alerts.length, notify: notifyCount, lastChecked: now });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}