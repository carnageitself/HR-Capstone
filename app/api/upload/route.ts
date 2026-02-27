import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getCompany, saveCompanyData, loadCompanyData } from "@/lib/dataManager";
import { smartMerge, getCSVHeaders, countCSVRecords, validateCSVColumns } from "@/lib/csvAppender";

const REQUIRED_COLUMNS: Record<string, string[]> = {
  awards: ["award_id", "recipient_id", "nominator_id", "award_title", "award_message", "category_id", "reasoning", "award_date", "monetary_value_usd", "award_status"],
  employees: ["employee_id", "first_name", "last_name", "department_id", "job_title"],
  departments: ["department_id", "department_name"],
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const companyId = formData.get("companyId") as string;
    const fileType = formData.get("fileType") as "awards" | "employees" | "departments";

    if (!file || !companyId || !fileType) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: file, companyId, fileType" },
        { status: 400 }
      );
    }

    const company = await getCompany(companyId);
    if (!company) {
      return NextResponse.json(
        { ok: false, error: `Company "${companyId}" not found` },
        { status: 404 }
      );
    }

    const fileContent = await file.text();

    const validation = validateCSVColumns(fileContent, REQUIRED_COLUMNS[fileType]);
    if (!validation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing required columns: ${validation.missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const existingData = await loadCompanyData(companyId, fileType);

    const mergedData = smartMerge(
      fileType,
      existingData,
      fileContent
    );

    await saveCompanyData(companyId, fileType, mergedData, false);

    const headers = getCSVHeaders(mergedData);
    const recordCount = countCSVRecords(mergedData);

    return NextResponse.json({
      ok: true,
      fileName: file.name,
      fileType,
      rowCount: recordCount,
      headers,
      companyId,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
