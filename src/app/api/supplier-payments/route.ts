import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/supplier-payments - List supplier payments
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplier_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('supplier_payments')
      .select(`
        *,
        supplier:supplier_id(id, name, pix_key, bank_info),
        purchase:purchase_id(id, purchase_number),
        created_by_user:created_by(id, name)
      `)
      .order('payment_date', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (startDate) {
      query = query.gte('payment_date', startDate);
    }
    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    const { data: payments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/supplier-payments - Create a supplier payment
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
    const { supplier_id, purchase_id, amount, payment_method, payment_date, reference, notes } = body;

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: payment, error } = await supabase
      .from('supplier_payments')
      .insert({
        tenant_id: profile.tenant_id,
        supplier_id,
        purchase_id,
        amount,
        payment_method,
        payment_date,
        reference,
        notes,
        created_by: user.id,
      })
      .select(`
        *,
        supplier:supplier_id(id, name),
        purchase:purchase_id(id, purchase_number)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update purchase payment status if linked
    if (purchase_id) {
      // Get total payments for this purchase
      const { data: payments } = await supabase
        .from('supplier_payments')
        .select('amount')
        .eq('purchase_id', purchase_id);

      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get purchase total
      const { data: purchase } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('id', purchase_id)
        .single();

      if (purchase) {
        const newStatus = totalPaid >= Number(purchase.total_amount) ? 'paid' : 'partial';
        await supabase
          .from('purchases')
          .update({ payment_status: newStatus })
          .eq('id', purchase_id);
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
