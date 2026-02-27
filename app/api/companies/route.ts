import { NextRequest, NextResponse } from "next/server";
import {
  getCompanyList,
  createCompany,
  deleteCompany,
  getCompany,
} from "@/lib/dataManager";

export async function GET(req: NextRequest) {
  try {
    const companies = await getCompanyList();
    return NextResponse.json({ ok: true, companies });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, industry, size } = await req.json();

    if (!name || !industry || !size) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: name, industry, size" },
        { status: 400 }
      );
    }

    const company = await createCompany(name, industry, size);

    return NextResponse.json({ ok: true, company }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing id parameter" },
        { status: 400 }
      );
    }

    await deleteCompany(id);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 400 }
    );
  }
}
