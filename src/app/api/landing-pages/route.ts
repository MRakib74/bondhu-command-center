import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all landing pages
export async function GET() {
  try {
    const pages = await prisma.landingPage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(pages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create landing page
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title, slug, productId, themeColor, bgColor,
      deliveryInside, deliveryOutside, freeDelivery,
      requirePhone, isPublished, blocks,
    } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and Slug are required" }, { status: 400 });
    }

    const page = await prisma.landingPage.create({
      data: {
        title,
        slug,
        productId: productId || null,
        themeColor: themeColor || "#319b03",
        bgColor: bgColor || "#F5F3FF",
        deliveryInside: deliveryInside || 60,
        deliveryOutside: deliveryOutside || 120,
        freeDelivery: freeDelivery || false,
        requirePhone: requirePhone !== undefined ? requirePhone : true,
        isPublished: isPublished || false,
        blocks: blocks || [],
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update landing page
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const page = await prisma.landingPage.update({ where: { id }, data });
    return NextResponse.json(page);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE landing page
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.landingPage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
