import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { children: true, parent: true, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, parentId } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and Slug are required" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, slug, parentId: parentId || null },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update category
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, slug, parentId } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, parentId: parentId || null },
    });
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
