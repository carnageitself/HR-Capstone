import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface PipelineRun {
  name: string;
  taxonomy?: any;
  phase2?: any;
  summary?: any;
}

async function loadJsonFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const runsDir = path.resolve(process.cwd(), "outputs", "runs");

    try {
      await fs.access(runsDir);
    } catch {
      return NextResponse.json({
        ok: true,
        runs: [],
        message: "No runs directory found",
      });
    }

    const entries = await fs.readdir(runsDir, { withFileTypes: true });
    const runDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    const runs: PipelineRun[] = [];

    for (const runName of runDirs) {
      const runPath = path.join(runsDir, runName);

      // Try final_taxonomy first (after Phase 3), then phase_1_taxonomy
      let taxonomy = await loadJsonFile(
        path.join(runPath, "final_taxonomy.json")
      );
      if (!taxonomy) {
        taxonomy = await loadJsonFile(
          path.join(runPath, "phase_1_taxonomy.json")
        );
      }

      const phase2 = await loadJsonFile(
        path.join(runPath, "phase_2_results.json")
      );
      const summary = await loadJsonFile(
        path.join(runPath, "pipeline_summary.json")
      );

      if (taxonomy || phase2 || summary) {
        runs.push({
          name: runName,
          taxonomy,
          phase2,
          summary,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      runs,
      count: runs.length,
    });
  } catch (error) {
    console.error("Runs list error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
