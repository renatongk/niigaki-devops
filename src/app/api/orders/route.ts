import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/orders - List all orders for the current tenant
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        store:store_id(id, name, code),
        created_by_user:created_by(id, name),
        approved_by_user:approved_by(id, name),
        items:order_items(
          id,
          product:product_id(id, name, code, unit),
          requested_quantity,
          approved_quantity,
          unit_price
        )
      `)
      .order('order_date', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { store_id, order_date, notes, items } = body;

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Generate order number
    const orderNumber = `PED-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: profile.tenant_id,
        store_id,
        order_number: orderNumber,
        order_date,
        notes,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    // Create order items
    if (items && items.length > 0) {
      const orderItems = items.map((item: { product_id: string; requested_quantity: number; notes?: string }) => ({
        order_id: order.id,
        product_id: item.product_id,
        requested_quantity: item.requested_quantity,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) {
        // Rollback: delete the order
        await supabase.from('orders').delete().eq('id', order.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    // Fetch the complete order with items
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`
        *,
        store:store_id(id, name, code),
        items:order_items(
          id,
          product:product_id(id, name, code, unit),
          requested_quantity,
          approved_quantity
        )
      `)
      .eq('id', order.id)
      .single();

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
