import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all page designs or a specific one by type
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type) {
      const design = await prisma.pageDesign.findUnique({ where: { type } });
      return NextResponse.json(design);
    }

    const designs = await prisma.pageDesign.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(designs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST/PUT upsert page design (create or update)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, content, isActive } = body;

    if (!type) {
      return NextResponse.json({ error: "Page type is required" }, { status: 400 });
    }

    const design = await prisma.pageDesign.upsert({
      where: { type },
      update: {
        content: content || null,
        isActive: isActive !== undefined ? isActive : true,
      },
      create: {
        type,
        content: content || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(design);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE page design
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.pageDesign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
