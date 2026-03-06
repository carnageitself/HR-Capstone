import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.PIPELINE_API_URL || "http://localhost:8000";

async function proxy(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const { route } = await params;
  const path = "/api/" + route.join("/");
  const url = new URL(path, API_BASE);

  // Forward query params
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {};

  let body: BodyInit | undefined;
  if (req.method === "POST") {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      // File upload — re-build FormData from the incoming request
      // and forward to FastAPI with proper multipart encoding
      const formData = await req.formData();
      const outForm = new FormData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          // Preserve original filename
          const file = value as File;
          outForm.append(key, file, file.name);
        } else {
          outForm.append(key, value);
        }
      }
      body = outForm;
      // Don't set Content-Type — fetch will set it with the correct boundary
    } else {
      body = await req.text();
      headers["Content-Type"] = "application/json";
    }
  }

  try {
    const res = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    const text = await res.text();

    // Try parsing as JSON, fall back to wrapping raw text
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(
        { error: "Pipeline API error", detail: text.slice(0, 500), status: res.status },
        { status: res.status }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Pipeline API unreachable", detail: String(err) },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;

// Ensure enough time for pipeline polling and file uploads
export const maxDuration = 60;