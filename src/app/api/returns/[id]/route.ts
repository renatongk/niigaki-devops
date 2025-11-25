import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/returns/[id] - Get a specific return
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

    const { data: returnData, error } = await supabase
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
          reason,
          notes
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(returnData);
  } catch (error) {
    console.error('Error fetching return:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/returns/[id] - Update a return (approve/reject/process)
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
    const { status, approved_by, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (approved_by) updateData.approved_by = approved_by;
    if (notes !== undefined) updateData.notes = notes;

    const { data: returnData, error } = await supabase
      .from('merchandise_returns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(returnData);
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
