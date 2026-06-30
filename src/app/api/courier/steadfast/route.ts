import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, secretKey, baseUrl, orders } = body;

    const safeApiKey = apiKey ? apiKey.trim() : '';
    const safeSecretKey = secretKey ? secretKey.trim() : '';

    if (!safeApiKey || !safeSecretKey) {
      return NextResponse.json({ error: 'Steadfast API Key and Secret Key are required.' }, { status: 400 });
    }

    const apiUrl = baseUrl ? baseUrl.replace(/\/$/, '') : 'https://portal.packzy.com/api/v1';

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'No orders provided for courier entry.' }, { status: 400 });
    }

    const results = [];
    const errors = [];

    // Process orders one by one to Steadfast
    for (const order of orders) {
      try {
        const steadfastPayload = {
          invoice: order.id,
          recipient_name: order.customerName || 'Customer',
          recipient_phone: order.phone,
          recipient_address: `${order.address} ${order.district || ''}`.trim() || 'No Address',
          cod_amount: Number(order.amount) + Number(order.deliveryCharge || 0),
          note: `Product: ${order.product} (x${order.quantity})`
        };

        const response = await fetch(`${apiUrl}/create_order`, {
          method: 'POST',
          headers: {
            'Api-Key': safeApiKey,
            'Secret-Key': safeSecretKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(steadfastPayload)
        });

        const data = await response.json();

        if (response.ok) {
          results.push({
            orderId: order.dbId || order.id,
            tracking_code: data.consignment?.tracking_code || data.tracking_code || 'TRACK-' + Date.now(),
            consignment_id: data.consignment?.consignment_id || data.consignment_id,
            status: 'success'
          });
        } else {
          errors.push({
            orderId: order.dbId || order.id,
            error: data.message || JSON.stringify(data) || 'Failed to create order'
          });
        }
      } catch (err: any) {
        errors.push({
          orderId: order.dbId || order.id,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error: any) {
    console.error('Steadfast proxy error:', error);
    return NextResponse.json({ error: 'Internal server error while communicating with Steadfast API' }, { status: 500 });
  }
}
