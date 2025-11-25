import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/distributions - List distributions for the current tenant
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const purchaseId = searchParams.get('purchase_id');
    const storeId = searchParams.get('store_id');
    const status = searchParams.get('status');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('distributions')
      .select(`
        *,
        purchase:purchase_id(id, purchase_number, supplier:supplier_id(name)),
        store:store_id(id, name, code),
        distributed_by_user:distributed_by(id, name),
        received_by_user:received_by(id, name),
        items:distribution_items(
          id,
          product:product_id(id, name, code, unit),
          quantity,
          received_quantity
        )
      `)
      .order('distribution_date', { ascending: false });

    if (purchaseId) {
      query = query.eq('purchase_id', purchaseId);
    }
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: distributions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(distributions);
  } catch (error) {
    console.error('Error fetching distributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/distributions - Create a new distribution
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
    const { purchase_id, store_id, distribution_date, notes, items } = body;

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Create distribution
    const { data: distribution, error: distError } = await supabase
      .from('distributions')
      .insert({
        tenant_id: profile.tenant_id,
        purchase_id,
        store_id,
        distribution_date,
        notes,
        distributed_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 400 });
    }

    // Create distribution items
    if (items && items.length > 0) {
      const distItems = items.map(
        (item: { purchase_item_id: string; product_id: string; quantity: number; notes?: string }) => ({
          distribution_id: distribution.id,
          purchase_item_id: item.purchase_item_id,
          product_id: item.product_id,
          quantity: item.quantity,
          notes: item.notes,
        })
      );

      const { error: itemsError } = await supabase.from('distribution_items').insert(distItems);

      if (itemsError) {
        // Rollback
        await supabase.from('distributions').delete().eq('id', distribution.id);
        return NextResponse.json({ error: itemsError.message }, { status: 400 });
      }
    }

    // Fetch complete distribution
    const { data: completeDistribution } = await supabase
      .from('distributions')
      .select(`
        *,
        store:store_id(id, name),
        items:distribution_items(
          id,
          product:product_id(id, name, code),
          quantity,
          received_quantity
        )
      `)
      .eq('id', distribution.id)
      .single();

    return NextResponse.json(completeDistribution, { status: 201 });
  } catch (error) {
    console.error('Error creating distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
