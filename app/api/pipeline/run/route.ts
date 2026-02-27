import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { promises as fs } from "fs";
import { getCompany, loadCompanyData } from "@/lib/dataManager";

const PIPELINE_DIR = path.resolve(process.cwd(), "taxonomy_pipeline");
const PIPELINE_SCRIPT = path.join(PIPELINE_DIR, "run_pipeline.py");

interface PipelineRunRequest {
  runName: string;
  provider: "groq" | "gemini";
  companyId: string;
  skipPhase2?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: PipelineRunRequest = await req.json();
    const { runName, provider, companyId, skipPhase2 } = body;

    if (!runName || !provider || !companyId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing required fields: runName, provider, companyId",
        },
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

    const awardsData = await loadCompanyData(companyId, "awards");
    if (!awardsData || awardsData.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: `No awards data found for company "${companyId}"` },
        { status: 400 }
      );
    }

    const outputDir = path.resolve(process.cwd(), "outputs", "runs", runName);
    await fs.mkdir(outputDir, { recursive: true });

    const statusFilePath = path.join(outputDir, "status.json");

    const args = [
      PIPELINE_SCRIPT,
      "--run-name",
      runName,
      "--provider",
      provider,
      "--awards-csv",
      path.join(process.cwd(), company.data_dir, "awards.csv"),
      "--status-file",
      statusFilePath,
    ];

    if (skipPhase2) {
      args.push("--skip-phase2");
    }

    const logFilePath = path.join(outputDir, "pipeline.log");

    const proc = spawn("python", args, {
      cwd: PIPELINE_DIR,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        OLLAMA_URL: process.env.OLLAMA_URL,
      },
    });

    // Capture stdout/stderr to log file asynchronously
    if (proc.stdout) {
      proc.stdout.on("data", (chunk) => {
        fs.appendFile(logFilePath, chunk).catch(console.error);
      });
    }
    if (proc.stderr) {
      proc.stderr.on("data", (chunk) => {
        fs.appendFile(logFilePath, chunk).catch(console.error);
      });
    }

    proc.unref();

    return NextResponse.json(
      {
        ok: true,
        runName,
        provider,
        companyId,
        outputDir,
        statusFile: statusFilePath,
        message: "Pipeline started successfully",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Pipeline run error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
