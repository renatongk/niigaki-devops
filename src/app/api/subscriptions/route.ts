import { createClient } from '@/lib/supabase/server';
import {
  createCustomer,
  createSubscription,
  cancelSubscription,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from '@/lib/asaas';
import { NextResponse } from 'next/server';

// GET /api/subscriptions - Get current tenant subscription
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      subscription,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subscriptions - Create or update subscription
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage subscriptions' }, { status: 403 });
    }

    const body = await request.json();
    const { plan, billing_type } = body as { plan: SubscriptionPlan; billing_type: 'monthly' | 'yearly' };

    if (!SUBSCRIPTION_PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create customer in Asaas if not exists
    let asaasCustomerId = tenant.asaas_customer_id;
    if (!asaasCustomerId) {
      const customer = await createCustomer({
        name: tenant.name,
        cpfCnpj: tenant.document,
        email: tenant.email,
        phone: tenant.phone || undefined,
        externalReference: tenant.id,
      });
      asaasCustomerId = customer.id;

      // Update tenant with Asaas customer ID
      await supabase
        .from('tenants')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', tenant.id);
    }

    // Calculate value (yearly has 10% discount)
    const planConfig = SUBSCRIPTION_PLANS[plan];
    const value = billing_type === 'yearly' ? planConfig.value * 12 * 0.9 : planConfig.value;

    // Calculate next due date
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 7); // 7 days trial

    // Create subscription in Asaas
    const asaasSubscription = await createSubscription({
      customer: asaasCustomerId!,
      billingType: 'PIX',
      value,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle: billing_type === 'yearly' ? 'YEARLY' : 'MONTHLY',
      description: `Assinatura ${planConfig.name} - CEASA SaaS`,
      externalReference: tenant.id,
    });

    // Save subscription in database
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenant.id,
        asaas_subscription_id: asaasSubscription.id,
        plan,
        status: 'active',
        billing_type,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        value,
      })
      .select()
      .single();

    if (error) {
      // Try to cancel Asaas subscription on error
      if (asaasSubscription.id) {
        await cancelSubscription(asaasSubscription.id);
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Update tenant subscription status
    await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
      })
      .eq('id', tenant.id);

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
