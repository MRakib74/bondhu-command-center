import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, secretKey, baseUrl, orders } = body;

    // For Pathao:
    // apiKey = Access Token
    // secretKey = Store ID
    const accessToken = apiKey ? apiKey.trim() : '';
    const storeId = secretKey ? secretKey.trim() : '';

    if (!accessToken || !storeId) {
      return NextResponse.json({ error: 'Pathao Access Token (in API Key field) and Store ID (in Secret Key field) are required.' }, { status: 400 });
    }

    const apiUrl = baseUrl ? baseUrl.replace(/\/$/, '') : 'https://api-hermes.pathao.com';

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'No orders provided for courier entry.' }, { status: 400 });
    }

    // Pathao supports bulk order creation directly
    const pathaoOrders = orders.map((order: any) => ({
      store_id: storeId,
      merchant_order_id: order.id,
      recipient_name: order.customerName || 'Customer',
      recipient_phone: order.phone,
      recipient_address: `${order.address} ${order.district || ''}`.trim() || 'No Address',
      delivery_type: 48, // 48 hours regular delivery
      item_type: 2, // 2 = parcel
      special_instruction: `Product: ${order.product}`,
      item_quantity: Number(order.quantity) || 1,
      item_weight: "0.5", // default weight
      amount_to_collect: Number(order.amount) + Number(order.deliveryCharge || 0),
      item_description: `Product: ${order.product} (x${order.quantity})`
    }));

    const response = await fetch(`${apiUrl}/aladdin/api/v1/orders/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ orders: pathaoOrders })
    });

    const data = await response.json();

    const results: any[] = [];
    const errors: any[] = [];

    // Pathao bulk response usually returns success/error for each order
    if (response.ok && data.code === 200 && data.data?.data) {
      // Loop through Pathao response data
      data.data.data.forEach((resItem: any) => {
        if (resItem.consignment_id) {
          results.push({
            orderId: resItem.merchant_order_id,
            tracking_code: resItem.consignment_id, // Pathao uses consignment_id as tracking code
            consignment_id: resItem.consignment_id,
            status: 'success'
          });
        } else {
          errors.push({
            orderId: resItem.merchant_order_id,
            error: resItem.error_message || 'Failed to create order'
          });
        }
      });
    } else {
      // Handle global error or different response structure
      return NextResponse.json({ 
        error: data.message || JSON.stringify(data.errors) || 'Pathao API request failed' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error: any) {
    console.error('Pathao proxy error:', error);
    return NextResponse.json({ error: 'Internal server error while communicating with Pathao API' }, { status: 500 });
  }
}
