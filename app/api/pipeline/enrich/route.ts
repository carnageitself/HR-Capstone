import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "papaparse";

interface Employee {
  employee_id: string;
  name?: string;
  title?: string;
  department?: string;
  seniority?: string;
  skills?: string;
}

interface Award {
  award_id: string;
  award_date?: string;
  award_title?: string;
  award_message?: string;
  value?: string;
  recipient_id?: string;
  nominator_id?: string;
}

interface EnrichedAward {
  award_id: string;
  award_date: string;
  award_title: string;
  message: string;
  value: string;
  recipient_id: string;
  recipient_name: string;
  recipient_title: string;
  recipient_department: string;
  recipient_seniority: string;
  recipient_skills: string;
  nominator_id: string;
  nominator_name: string;
  nominator_title: string;
  nominator_department: string;
  nominator_seniority: string;
  category_id: string;
  category_name: string;
  subcategory_id: string;
  subcategory_name: string;
  reasoning: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, runName } = body;

    if (!companyId || !runName) {
      return NextResponse.json(
        { ok: false, error: "Missing companyId or runName" },
        { status: 400 }
      );
    }

    const companyDir = path.resolve(process.cwd(), "data", "companies", companyId);
    const runDir = path.resolve(process.cwd(), "outputs", "runs", runName);

    // Load employees CSV
    const employeesCsvPath = path.join(companyDir, "employees.csv");
    const employees: Employee[] = [];
    const employeeMap: Record<string, Employee> = {};
    try {
      const content = await fs.readFile(employeesCsvPath, "utf-8");
      const parsed = parse(content, { header: true, dynamicTyping: false });
      const emps = (parsed.data as Record<string, string>[]).filter((e) => e && e.employee_id);
      for (const emp of emps) {
        const firstName = emp.first_name || emp.firstName || "";
        const lastName = emp.last_name || emp.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const e: Employee = {
          employee_id: emp.employee_id || "",
          name: fullName || emp.name || emp.employee_name || "",
          title: emp.job_title || emp.title || "",
          department: emp.department_id || emp.department || "",
          seniority: emp.seniority || "",
          skills: emp.skills || "",
        };
        if (e.employee_id) {
          employeeMap[e.employee_id] = e;
          employees.push(e);
        }
      }
    } catch (e) {
      console.error("Failed to load employees.csv:", e);
    }

    // Load awards CSV
    const awardsCsvPath = path.join(companyDir, "awards.csv");
    const awards: Award[] = [];
    try {
      const content = await fs.readFile(awardsCsvPath, "utf-8");
      const parsed = parse(content, { header: true, dynamicTyping: false });
      awards.push(...(parsed.data as Award[]));
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: `Failed to load awards.csv: ${e}` },
        { status: 400 }
      );
    }

    // Load taxonomy
    let taxonomy: any = null;
    try {
      const taxonomyPath = path.join(runDir, "final_taxonomy.json");
      const content = await fs.readFile(taxonomyPath, "utf-8");
      taxonomy = JSON.parse(content);
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: `Failed to load taxonomy: ${e}` },
        { status: 400 }
      );
    }

    // Build category keyword index
    const categoryKeywords: Record<string, { name: string; keywords: Set<string> }> = {};
    const categories = taxonomy.categories || [];

    for (const cat of categories) {
      const catId = cat.id;
      const catName = cat.name || "";
      const catDesc = cat.description || "";
      const keywords = new Set<string>();

      // Add category name and description keywords
      const catText = (catName + " " + catDesc).toLowerCase();
      for (const word of catText.split(/\s+/)) {
        const clean = word.replace(/[.,!?;:()]/g, "");
        if (clean.length > 3) {
          keywords.add(clean);
        }
      }

      // Add subcategory keywords
      for (const subcat of cat.subcategories || []) {
        const subcatName = (subcat.name || "").toLowerCase();
        for (const word of subcatName.split(/\s+/)) {
          const clean = word.replace(/[.,!?;:()]/g, "");
          if (clean.length > 3) {
            keywords.add(clean);
          }
        }
      }

      categoryKeywords[catId] = {
        name: catName,
        keywords,
      };
    }

    // Classify awards
    const enriched: EnrichedAward[] = [];

    for (const award of awards) {
      const recipientId = award.recipient_id || "";
      const nominatorId = award.nominator_id || "";
      const recipient = employeeMap[recipientId] || {
        employee_id: recipientId,
        name: "",
        title: "",
        department: "",
        seniority: "",
        skills: "",
      };
      const nominator = employeeMap[nominatorId] || {
        employee_id: nominatorId,
        name: "",
        title: "",
        department: "",
        seniority: "",
        skills: "",
      };

      // Classify award
      const message = ((award.award_title || "") + " " + (award.award_message || "")).toLowerCase();
      let bestCategory = categories[0]?.id || "";
      let bestCategoryName = categories[0]?.name || "";
      let bestScore = 0;

      for (const catId in categoryKeywords) {
        const catInfo = categoryKeywords[catId];
        let score = 0;
        for (const keyword of catInfo.keywords) {
          if (message.includes(keyword)) {
            score++;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestCategory = catId;
          bestCategoryName = catInfo.name;
        }
      }

      enriched.push({
        award_id: award.award_id || "",
        award_date: award.award_date || "",
        award_title: award.award_title || "",
        message: award.award_message || "",
        value: award.value || "",
        recipient_id: recipientId,
        recipient_name: recipient.name || "",
        recipient_title: recipient.title || "",
        recipient_department: recipient.department || "",
        recipient_seniority: recipient.seniority || "",
        recipient_skills: recipient.skills || "",
        nominator_id: nominatorId,
        nominator_name: nominator.name || "",
        nominator_title: nominator.title || "",
        nominator_department: nominator.department || "",
        nominator_seniority: nominator.seniority || "",
        category_id: bestCategory,
        category_name: bestCategoryName,
        subcategory_id: "",
        subcategory_name: "",
        reasoning: "",
      });
    }

    // Write enriched CSV
    const enrichedPath = path.join(companyDir, "awards_enriched.csv");
    const headers = [
      "award_id", "award_date", "award_title", "message", "value",
      "recipient_id", "recipient_name", "recipient_title", "recipient_department", "recipient_seniority", "recipient_skills",
      "nominator_id", "nominator_name", "nominator_title", "nominator_department", "nominator_seniority",
      "category_id", "category_name", "subcategory_id", "subcategory_name", "reasoning",
    ];

    const rows = [headers.join(",")];
    for (const e of enriched) {
      const values = headers.map((h) => {
        const val = (e as unknown as Record<string, string>)[h] || "";
        // Escape quotes in CSV
        return `"${val.replace(/"/g, '""')}"`;
      });
      rows.push(values.join(","));
    }

    await fs.writeFile(enrichedPath, rows.join("\n"), "utf-8");

    return NextResponse.json({
      ok: true,
      rowsWritten: enriched.length,
      filePath: enrichedPath,
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
