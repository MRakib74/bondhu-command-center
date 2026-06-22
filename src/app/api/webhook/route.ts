import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// This endpoint receives incoming webhooks from the Bondhumart Laravel site.
export async function POST(req: Request) {
  try {
    // 1. Verify Secret Key to ensure the request is actually from Laravel
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { event, data } = body

    // 2. Handle different event types from Laravel
    switch (event) {
      case "order.created":
        await handleNewOrder(data)
        break
      case "order.updated":
        await handleOrderStatusUpdate(data)
        break
      case "product.updated":
        await handleProductUpdate(data)
        break
      default:
        return NextResponse.json({ message: "Event ignored" }, { status: 200 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error("Webhook Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function handleNewOrder(data: any) {
  // Extract customer and order data
  // Using upsert so if customer exists, we update, else we create
  const customer = await prisma.customer.upsert({
    where: { phone: data.customer.phone },
    update: {
      name: data.customer.name,
      district: data.customer.district,
      address: data.customer.address,
      totalOrders: { increment: 1 },
      totalSpent: { increment: data.amount },
      lastOrderAt: new Date(),
    },
    create: {
      bondhumartId: data.customer.id.toString(),
      name: data.customer.name,
      phone: data.customer.phone,
      district: data.customer.district,
      address: data.customer.address,
      totalOrders: 1,
      totalSpent: data.amount,
      lastOrderAt: new Date(),
    }
  })

  // Ensure product exists
  const product = await prisma.product.upsert({
    where: { bondhumartId: data.product_id.toString() },
    update: {},
    create: {
      bondhumartId: data.product_id.toString(),
      name: "Product #" + data.product_id,
      price: data.amount,
    }
  })

  // Create the Order record
  await prisma.order.create({
    data: {
      bondhumartId: data.order_id.toString(),
      customerId: customer.id,
      productId: product.id,
      amount: data.amount,
      status: "Pending",
    }
  })
}

async function handleOrderStatusUpdate(data: any) {
  // Update order status (e.g., Delivered, Cancelled, Returned)
  await prisma.order.update({
    where: { bondhumartId: data.order_id.toString() },
    data: {
      status: data.status,
      cancelledReason: data.reason || null,
      deliveredAt: data.status === "Delivered" ? new Date() : null,
    }
  })
}

async function handleProductUpdate(data: any) {
  // Update or insert product
  await prisma.product.upsert({
    where: { bondhumartId: data.product_id.toString() },
    update: {
      name: data.name,
      price: data.price,
      stock: data.stock,
      imageUrl: data.image_url,
    },
    create: {
      bondhumartId: data.product_id.toString(),
      name: data.name,
      price: data.price,
      stock: data.stock,
      imageUrl: data.image_url,
    }
  })
}
