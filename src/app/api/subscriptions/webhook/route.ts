import { createClient } from '@/lib/supabase/server';
import { type AsaasWebhookPayload } from '@/lib/asaas';
import { NextResponse } from 'next/server';

// POST /api/subscriptions/webhook - Handle Asaas webhooks
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AsaasWebhookPayload;

    // Verify webhook secret (in production, implement proper signature verification)
    const webhookSecret = request.headers.get('asaas-access-token');
    if (webhookSecret !== process.env.ASAAS_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    const supabase = await createClient();

    switch (payload.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        // Payment was successful
        if (payload.payment?.subscription) {
          // Update subscription status
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              next_due_date: new Date(
                new Date(payload.payment.dueDate).setMonth(
                  new Date(payload.payment.dueDate).getMonth() + 1
                )
              )
                .toISOString()
                .split('T')[0],
            })
            .eq('asaas_subscription_id', payload.payment.subscription);

          if (!error) {
            // Update tenant status
            const { data: subscription } = await supabase
              .from('subscriptions')
              .select('tenant_id')
              .eq('asaas_subscription_id', payload.payment.subscription)
              .single();

            if (subscription) {
              await supabase
                .from('tenants')
                .update({ subscription_status: 'active' })
                .eq('id', subscription.tenant_id);
            }
          }
        }
        break;
      }

      case 'PAYMENT_OVERDUE': {
        // Payment is overdue
        if (payload.payment?.subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'overdue' })
            .eq('asaas_subscription_id', payload.payment.subscription);

          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('tenant_id')
            .eq('asaas_subscription_id', payload.payment.subscription)
            .single();

          if (subscription) {
            await supabase
              .from('tenants')
              .update({ subscription_status: 'suspended' })
              .eq('id', subscription.tenant_id);
          }
        }
        break;
      }

      case 'SUBSCRIPTION_DELETED':
      case 'SUBSCRIPTION_ENDED': {
        // Subscription cancelled
        if (payload.subscription?.id) {
          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('asaas_subscription_id', payload.subscription.id);

          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('tenant_id')
            .eq('asaas_subscription_id', payload.subscription.id)
            .single();

          if (subscription) {
            await supabase
              .from('tenants')
              .update({ subscription_status: 'inactive' })
              .eq('id', subscription.tenant_id);
          }
        }
        break;
      }

      default:
        console.log('Unhandled webhook event:', payload.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
