import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, name, tenantName, document } = await request.json();

    const supabase = await createClient();

    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    // Create the tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        document,
        email,
        subscription_status: 'trial',
      })
      .select()
      .single();

    if (tenantError) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: tenantError.message }, { status: 400 });
    }

    // Create the user profile as admin
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authData.user.id,
      tenant_id: tenantData.id,
      email,
      name,
      role: 'admin',
      is_active: true,
    });

    if (profileError) {
      // Rollback
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Registration successful. Please check your email to confirm your account.',
      user: authData.user,
      tenant: tenantData,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
