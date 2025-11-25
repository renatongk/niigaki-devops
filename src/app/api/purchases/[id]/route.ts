import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/purchases/[id] - Get a specific purchase
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

    const { data: purchase, error } = await supabase
      .from('purchases')
      .select(`
        *,
        supplier:supplier_id(id, name, document, pix_key, bank_info),
        buyer:buyer_id(id, name),
        items:purchase_items(
          id,
          product:product_id(id, name, code, unit),
          quantity,
          unit_price,
          total_price,
          notes
        ),
        distributions:distributions(
          id,
          store:store_id(id, name),
          distribution_date,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/purchases/[id] - Update a purchase
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
    const { payment_status, payment_method, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (payment_status) updateData.payment_status = payment_status;
    if (payment_method) updateData.payment_method = payment_method;
    if (notes !== undefined) updateData.notes = notes;

    const { data: purchase, error } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/purchases/[id] - Delete a purchase
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete purchases' }, { status: 403 });
    }

    // Check if purchase has distributions
    const { data: distributions } = await supabase
      .from('distributions')
      .select('id')
      .eq('purchase_id', id)
      .limit(1);

    if (distributions && distributions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete purchase with distributions' },
        { status: 400 }
      );
    }

    // Delete purchase items first
    await supabase.from('purchase_items').delete().eq('purchase_id', id);

    // Delete purchase
    const { error } = await supabase.from('purchases').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
