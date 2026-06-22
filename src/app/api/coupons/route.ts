import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all coupons
export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { products: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(coupons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create coupon
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, discountType, discountValue, minOrderAmount, isActive, showOnLanding, productIds } = body;

    if (!code || discountValue === undefined) {
      return NextResponse.json({ error: "Code and discountValue are required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType: discountType || "Fixed",
        discountValue,
        minOrderAmount: minOrderAmount || null,
        isActive: isActive !== undefined ? isActive : true,
        showOnLanding: showOnLanding || false,
        products: productIds?.length ? { connect: productIds.map((id: string) => ({ id })) } : undefined,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update coupon
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, discountType, discountValue, minOrderAmount, isActive, showOnLanding, productIds } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code?.toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        isActive,
        showOnLanding,
        products: productIds ? { set: productIds.map((pid: string) => ({ id: pid })) } : undefined,
      },
    });
    return NextResponse.json(coupon);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE coupon
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
