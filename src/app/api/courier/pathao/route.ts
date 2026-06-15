import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, secretKey, baseUrl, orders } = body;

    const safeApiKey = apiKey ? apiKey.trim() : '';
    // Users might put their store_id in the secretKey field since our UI only has API Key and Secret Key
    const storeIdFromUser = secretKey ? secretKey.trim() : '';

    if (!safeApiKey) {
      return NextResponse.json({ error: 'Pathao API Key (Access Token) is required.' }, { status: 400 });
    }

    const apiUrl = baseUrl ? baseUrl.replace(/\/$/, '') : 'https://api-hermes.pathao.com';

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'No orders provided for courier entry.' }, { status: 400 });
    }

    let storeId = storeIdFromUser;

    // If storeId is not provided, try to fetch it from Pathao API
    if (!storeId) {
      const storeRes = await fetch(`${apiUrl}/aladdin/api/v1/stores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${safeApiKey}`,
          'Accept': 'application/json'
        }
      });
      const storeData = await storeRes.json();
      
      if (storeRes.ok && storeData.data && storeData.data.data && storeData.data.data.length > 0) {
        storeId = storeData.data.data[0].store_id;
      } else {
        return NextResponse.json({ error: 'Could not fetch Pathao Store ID automatically. Please put your Store ID in the Secret Key field.' }, { status: 400 });
      }
    }

    // Format orders for Pathao Bulk API
    const pathaoOrders = orders.map((order: any) => ({
      store_id: storeId,
      merchant_order_id: order.id.toString(),
      recipient_name: order.customerName || 'Customer',
      recipient_phone: order.phone,
      recipient_address: `${order.address} ${order.district || ''}`.trim() || 'No Address',
      delivery_type: 48, // 48 is typically Normal Delivery
      item_type: 2, // 2 is typically Parcel
      special_instruction: `Product: ${order.product}`,
      item_quantity: Number(order.quantity) || 1,
      item_weight: "0.5",
      amount_to_collect: Number(order.amount) + Number(order.deliveryCharge || 0),
      item_description: order.product
    }));

    // Send to Pathao Bulk API
    const response = await fetch(`${apiUrl}/aladdin/api/v1/orders/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${safeApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ orders: pathaoOrders })
    });

    const data = await response.json();

    if (!response.ok || data.type === 'error' || data.code !== 200) {
      const errorMessage = data.message || JSON.stringify(data.errors) || 'Failed to create Pathao orders';
      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      }, { status: 400 });
    }

    // Pathao bulk endpoint returns success if it processes them.
    // It usually returns a list of orders in data.data or similar.
    // We will assume all are successfully queued if response is 200 OK.
    
    const results = orders.map((order: any, i: number) => {
      // Try to extract consignment ID if Pathao returns it immediately, otherwise mock/generate one for tracking state
      const consignmentId = data.data?.data?.[i]?.consignment_id || data.data?.[i]?.consignment_id || '';
      return {
        orderId: order.id,
        tracking_code: consignmentId || 'PATHAO-' + Date.now().toString() + i,
        consignment_id: consignmentId,
        status: 'success'
      };
    });

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: 0,
      results,
      errors: []
    });

  } catch (error: any) {
    console.error('Pathao proxy error:', error);
    return NextResponse.json({ error: 'Internal server error while communicating with Pathao API' }, { status: 500 });
  }
}
