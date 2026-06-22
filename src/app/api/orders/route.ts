import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Format orders for the UI
    const formattedOrders = orders.map(o => ({
      id: o.id,
      customerName: o.customer.name,
      phone: o.customer.phone,
      address: o.customer.address || '',
      district: o.customer.district || '',
      product: o.product.name,
      quantity: o.quantity,
      amount: o.amount,
      deliveryCharge: o.deliveryCharge,
      status: o.status.toLowerCase(), // UI expects lowercase statuses
      source: o.customData ? (o.customData as any).source || 'Website' : 'Website',
      courierName: o.courierName,
      trackingNo: o.courierTracking,
      createdAt: o.createdAt.toISOString(),
      shippedAt: o.deliveredAt ? o.deliveredAt.toISOString() : undefined
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // This API can handle creating a new order from Dashboard or syncing
    const { 
      customerName, phone, address, district, 
      product, quantity, amount, deliveryCharge, 
      status, source 
    } = body

    // 1. Find or create customer
    let cust = await prisma.customer.findUnique({ where: { phone } })
    if (!cust) {
      cust = await prisma.customer.create({
        data: { name: customerName, phone, address, district }
      })
    } else {
      // Update details if empty
      if (!cust.address && address) {
        cust = await prisma.customer.update({
          where: { id: cust.id },
          data: { address, district, name: customerName }
        })
      }
    }

    // 2. Find or create product
    let prod = await prisma.product.findFirst({ where: { name: product } })
    if (!prod) {
      prod = await prisma.product.create({
        data: { name: product, price: amount, bondhumartId: 'P-' + Date.now() }
      })
    }

    // 3. Create Order
    const newOrder = await prisma.order.create({
      data: {
        bondhumartId: 'ORD-' + Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
        customerId: cust.id,
        productId: prod.id,
        quantity: Number(quantity) || 1,
        amount: Number(amount),
        deliveryCharge: Number(deliveryCharge),
        status: status === 'new' ? 'Pending' : (status === 'confirmed' ? 'Confirmed' : status),
        customData: { source: source || 'Manual' }
      }
    })

    return NextResponse.json({ success: true, orderId: newOrder.id })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
