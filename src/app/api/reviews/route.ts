import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all reviews
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create review (admin manual or customer)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, customerName, customerImage, rating, comment, images, adminCreated } = body;

    if (!productId || !customerName || !comment) {
      return NextResponse.json({ error: "productId, customerName, and comment are required" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerName,
        customerImage: customerImage || null,
        rating: rating || 5,
        comment,
        images: images || null,
        status: adminCreated ? "Approved" : "Pending",
        adminCreated: adminCreated || false,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT approve/reject/update review
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, comment, rating } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (comment) data.comment = comment;
    if (rating) data.rating = rating;

    const review = await prisma.review.update({ where: { id }, data });
    return NextResponse.json(review);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE review
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
