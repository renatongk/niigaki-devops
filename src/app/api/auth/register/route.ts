import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, name, tenantName, document } = await request.json();

    const supabase = await createClient();
    const serviceClient = createServiceClient();

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

    // Create the tenant using service client (bypasses RLS for initial setup)
    const { data: tenantData, error: tenantError } = await serviceClient
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
      // Rollback: delete the auth user using service client
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: tenantError.message }, { status: 400 });
    }

    // Create the user profile as admin using service client
    const { error: profileError } = await serviceClient.from('user_profiles').insert({
      id: authData.user.id,
      tenant_id: tenantData.id,
      email,
      name,
      role: 'admin',
      is_active: true,
    });

    if (profileError) {
      // Rollback using service client
      await serviceClient.from('tenants').delete().eq('id', tenantData.id);
      await serviceClient.auth.admin.deleteUser(authData.user.id);
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
