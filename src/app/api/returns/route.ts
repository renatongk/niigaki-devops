import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/returns - List merchandise returns
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const type = searchParams.get('type');
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
      .from('merchandise_returns')
      .select(`
        *,
        store:store_id(id, name),
        supplier:supplier_id(id, name),
        created_by_user:created_by(id, name),
        approved_by_user:approved_by(id, name),
        items:merchandise_return_items(
          id,
          product:product_id(id, name, code, unit),
          quantity,
          unit_price,
          reason
        )
      `)
      .order('return_date', { ascending: false });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (startDate) {
      query = query.gte('return_date', startDate);
    }
    if (endDate) {
      query = query.lte('return_date', endDate);
    }

    const { data: returns, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/returns - Create a merchandise return
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
    const { store_id, return_date, type, supplier_id, reason, notes, items } = body;

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Generate return number
    const returnNumber = `DEV-${Date.now()}`;

    // Calculate total value
    const totalValue = items?.reduce(
      (sum: number, item: { quantity: number; unit_price?: number }) =>
        sum + item.quantity * (item.unit_price || 0),
      0
    ) || 0;

    // Create return
    const { data: returnData, error: returnError } = await supabase
      .from('merchandise_returns')
      .insert({
        tenant_id: profile.tenant_id,
        store_id,
        return_number: returnNumber,
        return_date,
        type,
        supplier_id,
        reason,
        notes,
        total_value: totalValue,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (returnError) {
      return NextResponse.json({ error: returnError.message }, { status: 400 });
    }

    // Create return items
    if (items && items.length > 0) {
      const returnItems = items.map(
        (item: { product_id: string; quantity: number; unit_price?: number; reason?: string; notes?: string }) => ({
          return_id: returnData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          reason: item.reason,
          notes: item.notes,
        })
      );

      const { error: itemsError } = await supabase.from('merchandise_return_items').insert(returnItems);

      if (itemsError) {
        // Rollback
        await supabase.from('merchandise_returns').delete().eq('id', returnData.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    // Fetch complete return
    const { data: completeReturn } = await supabase
      .from('merchandise_returns')
      .select(`
        *,
        store:store_id(id, name),
        supplier:supplier_id(id, name),
        items:merchandise_return_items(
          id,
          product:product_id(id, name, code),
          quantity,
          unit_price,
          reason
        )
      `)
      .eq('id', returnData.id)
      .single();

    return NextResponse.json(completeReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
