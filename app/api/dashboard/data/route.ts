import { loadDashboardData } from "@/lib/loadDashboardData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId") || "default";

  try {
    const data = loadDashboardData(companyId);
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error(`Failed to load dashboard data for company ${companyId}:`, error);
    return Response.json({ ok: false, error: "Failed to load dashboard data" }, { status: 500 });
  }
}
