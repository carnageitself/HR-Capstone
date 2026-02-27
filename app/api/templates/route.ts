import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileType = searchParams.get("fileType") || "awards";

  const templates: Record<string, string> = {
    awards: `award_id,recipient_id,nominator_id,award_title,award_message,category_id,reasoning,award_date,monetary_value_usd,award_status
AW001,E101,E102,Code Review Champion,Sarah consistently provides thoughtful code reviews that improve team quality.,B,Improved code quality through detailed reviews,2025-01-15,500,Approved
AW002,E103,E104,Strategic Vision Implementation,Jessica led the Q1 product strategy that resulted in a 35% increase in user engagement.,A,Delivered strategic vision on time,2025-01-20,750,Approved
AW003,E105,E106,Dashboard Automation Project,Robert automated 80% of our monthly reporting dashboards saving 40 hours per month.,B,Process automation and efficiency,2025-01-25,400,Approved`,

    employees: `employee_id,first_name,last_name,department_id,job_title
E101,Sarah,Johnson,D01,Senior Developer
E102,Mike,Chen,D01,Staff Engineer
E103,Jessica,Williams,D02,Product Manager
E104,David,Brown,D02,Senior PM
E105,Robert,Martinez,D03,Data Analyst`,

    departments: `department_id,department_name
D01,Engineering
D02,Product
D03,Analytics
D04,Marketing
D05,Customer Support`,
  };

  const content = templates[fileType] || templates.awards;
  const fileName = `sample_${fileType}.csv`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
