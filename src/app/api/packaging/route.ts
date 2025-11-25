import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/packaging - List packaging types and balances
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const includeBalances = searchParams.get('include_balances') === 'true';

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (includeBalances) {
      // Get packaging types with their balances
      const { data: packagingTypes, error } = await supabase
        .from('packaging_types')
        .select(`
          *,
          balances:packaging_balances(
            id,
            store:store_id(id, name),
            supplier:supplier_id(id, name),
            balance
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(packagingTypes);
    } else {
      const { data: packagingTypes, error } = await supabase
        .from('packaging_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(packagingTypes);
    }
  } catch (error) {
    console.error('Error fetching packaging types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/packaging - Create a new packaging type
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
    const { name, code, deposit_value, description } = body;

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: packagingType, error } = await supabase
      .from('packaging_types')
      .insert({
        tenant_id: profile.tenant_id,
        name,
        code,
        deposit_value,
        description,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(packagingType, { status: 201 });
  } catch (error) {
    console.error('Error creating packaging type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
