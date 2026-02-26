/**
 * app/page.tsx  — Server Component (root page = dashboard)
 */

import { loadDashboardData } from "@/lib/loadDashboardData";
import { HRDashboardClient } from "./components/HRDashboardClient";


export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const data = loadDashboardData();
  return <HRDashboardClient data={data} />;
}