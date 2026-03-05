/**
 * app/page.tsx  — Server Component (root page = dashboard)
 */

import { loadDashboardData } from "@/lib/loadDashboardData";
import { HRDashboardClient } from "../components/HRDashboardClient";


export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await loadDashboardData();
  return <HRDashboardClient data={data} />;
}