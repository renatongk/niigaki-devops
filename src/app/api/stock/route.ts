import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/stock - List daily stock for the current tenant
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const stockDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: stock, error } = await supabase
      .from('daily_stock')
      .select(`
        *,
        product:product_id(id, name, code, unit, category),
        supplier:supplier_id(id, name)
      `)
      .eq('stock_date', stockDate)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stock - Add item to daily stock
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
    const { stock_date, product_id, supplier_id, available_quantity, unit_price, notes } = body;

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: stockItem, error } = await supabase
      .from('daily_stock')
      .insert({
        tenant_id: profile.tenant_id,
        stock_date,
        product_id,
        supplier_id,
        available_quantity,
        unit_price,
        notes,
        created_by: user.id,
      })
      .select(`
        *,
        product:product_id(id, name, code, unit),
        supplier:supplier_id(id, name)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(stockItem, { status: 201 });
  } catch (error) {
    console.error('Error creating stock item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
