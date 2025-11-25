import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/distributions/[id] - Get a specific distribution
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

    const { data: distribution, error } = await supabase
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
          received_quantity,
          notes
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(distribution);
  } catch (error) {
    console.error('Error fetching distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/distributions/[id] - Update a distribution (confirm receipt)
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
    const { status, received_by, items } = body;

    // Update distribution
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (received_by) updateData.received_by = received_by;

    const { data: distribution, error: distError } = await supabase
      .from('distributions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 400 });
    }

    // Update items with received quantities
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.id) {
          await supabase
            .from('distribution_items')
            .update({ received_quantity: item.received_quantity })
            .eq('id', item.id);
        }
      }
    }

    return NextResponse.json(distribution);
  } catch (error) {
    console.error('Error updating distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
