import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { parse } from "papaparse";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runName = searchParams.get("runName");

  if (!runName) {
    return NextResponse.json(
      { ok: false, error: "Missing runName parameter" },
      { status: 400 }
    );
  }

  try {
    const runPath = path.resolve(process.cwd(), "outputs", "runs", runName);

    // Try to load phase_1_taxonomy to get categories
    let taxonomyPath = path.join(runPath, "final_taxonomy.json");
    let taxonomy: any = null;

    try {
      const content = await fs.readFile(taxonomyPath, "utf-8");
      taxonomy = JSON.parse(content);
    } catch (e) {
      taxonomyPath = path.join(runPath, "phase_1_taxonomy.json");
      try {
        const content = await fs.readFile(taxonomyPath, "utf-8");
        taxonomy = JSON.parse(content);
      } catch (e2) {
        // No taxonomy found
      }
    }

    // Build category map
    const categoryMap: Record<string, string> = {};
    if (taxonomy) {
      // Handle both formats: wrapped (phase_1_taxonomy.json) and flat (final_taxonomy.json)
      const categories = taxonomy.taxonomy?.categories || taxonomy.categories || [];
      for (const cat of categories) {
        categoryMap[cat.id] = cat.name;
      }
    }

    // Load original awards CSV
    // Try to determine company from run name (e.g., "int_tech_groq_groq" → "int_tech")
    const parts = runName.split("_");
    let companyId = parts.slice(0, -2).join("_") || parts[0] || "default";

    let awardsPath = path.join(
      process.cwd(),
      "data",
      "companies",
      companyId,
      "awards.csv"
    );

    let awards: any[] = [];
    try {
      const csvContent = await fs.readFile(awardsPath, "utf-8");
      const parsed = parse(csvContent, { header: true, dynamicTyping: false });
      awards = parsed.data || [];
    } catch {
      // If company-specific awards not found, try other variations
      const companiesDir = path.join(process.cwd(), "data", "companies");
      try {
        const entries = await fs.readdir(companiesDir);
        // Try to find any company with awards.csv
        for (const entry of entries) {
          const entryPath = path.join(companiesDir, entry, "awards.csv");
          try {
            const csvContent = await fs.readFile(entryPath, "utf-8");
            const parsed = parse(csvContent, { header: true, dynamicTyping: false });
            awards = parsed.data || [];
            if (awards.length > 0) break;
          } catch {
            // Continue to next entry
          }
        }
      } catch {
        // No awards found
      }
    }

    // Classify awards based on simple keyword matching with taxonomy
    const classified = awards
      .filter((a: any) => a.award_id)
      .map((award: any) => {
        const message = (award.award_message || award.award_title || "").toLowerCase();

        // Simple classification: match keywords in message to category descriptions
        let bestCategory = "A"; // default
        let confidence = 0.5;

        if (taxonomy) {
          // Handle both formats
          const categories = taxonomy.taxonomy?.categories || taxonomy.categories || [];
          let bestScore = 0;

          for (const cat of categories) {
            const catText = (
              cat.name +
              " " +
              (cat.description || "")
            ).toLowerCase();
            const keywordsFromDesc = catText.split(/\W+/).filter((w: string) => w.length > 3);

            let score = 0;
            for (const keyword of keywordsFromDesc) {
              if (message.includes(keyword)) {
                score++;
              }
            }

            if (score > bestScore) {
              bestScore = score;
              bestCategory = cat.id;
              confidence = Math.min(0.95, 0.5 + score * 0.15);
            }
          }
        }

        return {
          award_id: award.award_id,
          award_title: award.award_title,
          award_message: award.award_message,
          category_id: bestCategory,
          category_name: categoryMap[bestCategory] || "Uncategorized",
          confidence: confidence.toFixed(2),
        };
      });

    return NextResponse.json({
      ok: true,
      runName,
      taxonomy: taxonomy?.taxonomy || taxonomy,
      classifications: classified,
      categoryMap,
    });
  } catch (error) {
    console.error("Classification load error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
