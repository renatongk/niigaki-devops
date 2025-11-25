import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/orders/[id] - Get a specific order
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order, error } = await supabase
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
          unit_price,
          notes
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update an order
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes, items, approved_by } = body;

    // Update order
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (approved_by) updateData.approved_by = approved_by;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 });
    }

    // Update order items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.id) {
          // Update existing item
          await supabase
            .from('order_items')
            .update({
              approved_quantity: item.approved_quantity,
              unit_price: item.unit_price,
              notes: item.notes,
            })
            .eq('id', item.id);
        }
      }
    }

    // Fetch complete order
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`
        *,
        store:store_id(id, name, code),
        items:order_items(
          id,
          product:product_id(id, name, code, unit),
          requested_quantity,
          approved_quantity,
          unit_price
        )
      `)
      .eq('id', order.id)
      .single();

    return NextResponse.json(completeOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if order can be deleted (only pending orders)
    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', id)
      .single();

    if (order?.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be deleted' },
        { status: 400 }
      );
    }

    // Delete order items first
    await supabase.from('order_items').delete().eq('order_id', id);

    // Delete order
    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
