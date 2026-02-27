import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runName = searchParams.get("runName");

    if (!runName) {
      return NextResponse.json(
        { ok: false, error: "Missing runName parameter" },
        { status: 400 }
      );
    }

    const statusFilePath = path.resolve(
      process.cwd(),
      "outputs",
      "runs",
      runName,
      "status.json"
    );

    try {
      const statusContent = await fs.readFile(statusFilePath, "utf-8");
      const status = JSON.parse(statusContent);
      return NextResponse.json({ ok: true, status });
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        return NextResponse.json(
          {
            ok: true,
            status: {
              phase: 0,
              status: "not_started",
              provider: "groq",
              runName,
              message: "Pipeline has not started yet",
            },
          }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Status check error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
