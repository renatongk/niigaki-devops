import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/purchases - List all purchases for the current tenant
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplier_id');
    const paymentStatus = searchParams.get('payment_status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('purchases')
      .select(`
        *,
        supplier:supplier_id(id, name, document),
        buyer:buyer_id(id, name),
        items:purchase_items(
          id,
          product:product_id(id, name, code, unit),
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('purchase_date', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (startDate) {
      query = query.gte('purchase_date', startDate);
    }
    if (endDate) {
      query = query.lte('purchase_date', endDate);
    }

    const { data: purchases, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/purchases - Create a new purchase
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
    const { supplier_id, purchase_date, payment_method, notes, items } = body;

    // Get user's tenant_id and check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!['admin', 'manager', 'buyer'].includes(profile.role)) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    );

    // Generate purchase number
    const purchaseNumber = `COM-${Date.now()}`;

    // Create purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        tenant_id: profile.tenant_id,
        purchase_number: purchaseNumber,
        purchase_date,
        supplier_id,
        total_amount: totalAmount,
        payment_method,
        notes,
        buyer_id: user.id,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (purchaseError) {
      return NextResponse.json({ error: purchaseError.message }, { status: 400 });
    }

    // Create purchase items
    if (items && items.length > 0) {
      const purchaseItems = items.map(
        (item: { product_id: string; quantity: number; unit_price: number; notes?: string }) => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          notes: item.notes,
        })
      );

      const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems);

      if (itemsError) {
        // Rollback: delete the purchase
        await supabase.from('purchases').delete().eq('id', purchase.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    // Fetch the complete purchase with items
    const { data: completePurchase } = await supabase
      .from('purchases')
      .select(`
        *,
        supplier:supplier_id(id, name),
        items:purchase_items(
          id,
          product:product_id(id, name, code, unit),
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', purchase.id)
      .single();

    return NextResponse.json(completePurchase, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
