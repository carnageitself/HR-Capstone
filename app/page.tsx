/**
 * app/dashboard/page.tsx — Server Component
 *
 * Loads live data from Supabase and triggers the automation orchestrator
 * in the background on every visit. All automations are self-healing:
 * they only run if their data is stale (past today's 4am cutoff).
 */

import { HRDashboardClient } from "@/components/HRDashboardClient";
import { loadDashboardData } from "@/lib/loadDashboardData";

import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Load fresh data from Supabase
  const data = await loadDashboardData();

  // Fire the automation orchestrator — non-blocking, runs in background
  // Checks: AI insights, action queue, weekly email, sentiment drift, rising stars
  triggerOrchestrator().catch(err =>
    console.error("[page] Orchestrator trigger failed:", err)
  );

  return <HRDashboardClient data={data} />;
}

/**
 * Fires the automation orchestrator as a fire-and-forget background request.
 * The orchestrator checks all automation triggers and only runs stale ones.
 */
async function triggerOrchestrator(): Promise<void> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // Non-blocking — we don't await this
    void fetch(`${origin}/api/automation`, {
      method: "GET",
      // Short timeout so it doesn't block anything
      signal: AbortSignal.timeout(5000),
    }).catch(() => {/* orchestrator runs in background, failures are non-fatal */});
  } catch {
    // Silently ignore — orchestrator failure should never break the dashboard
  }
}