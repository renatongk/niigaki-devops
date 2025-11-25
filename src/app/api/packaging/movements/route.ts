import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/packaging/movements - List packaging movements
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const packagingTypeId = searchParams.get('packaging_type_id');
    const storeId = searchParams.get('store_id');
    const supplierId = searchParams.get('supplier_id');
    const movementType = searchParams.get('movement_type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('packaging_movements')
      .select(`
        *,
        packaging_type:packaging_type_id(id, name, code),
        store:store_id(id, name),
        supplier:supplier_id(id, name),
        created_by_user:created_by(id, name)
      `)
      .order('movement_date', { ascending: false });

    if (packagingTypeId) {
      query = query.eq('packaging_type_id', packagingTypeId);
    }
    if (storeId) {
      query = query.eq('store_id', storeId);
    }
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (movementType) {
      query = query.eq('movement_type', movementType);
    }
    if (startDate) {
      query = query.gte('movement_date', startDate);
    }
    if (endDate) {
      query = query.lte('movement_date', endDate);
    }

    const { data: movements, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching packaging movements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/packaging/movements - Create a packaging movement
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
    const {
      packaging_type_id,
      store_id,
      supplier_id,
      movement_type,
      quantity,
      movement_date,
      reference_type,
      reference_id,
      notes,
    } = body;

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // The trigger will automatically update the balance
    const { data: movement, error } = await supabase
      .from('packaging_movements')
      .insert({
        tenant_id: profile.tenant_id,
        packaging_type_id,
        store_id,
        supplier_id,
        movement_type,
        quantity,
        movement_date,
        reference_type,
        reference_id,
        notes,
        created_by: user.id,
      })
      .select(`
        *,
        packaging_type:packaging_type_id(id, name, code),
        store:store_id(id, name),
        supplier:supplier_id(id, name)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Error creating packaging movement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
