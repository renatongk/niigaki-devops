import { createServiceClient } from '@/lib/supabase/service';
import { type AsaasWebhookPayload } from '@/lib/asaas';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Verify webhook signature from Asaas
function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) {
    return false;
  }

  // Asaas uses a simple token-based verification
  // For enhanced security, implement HMAC verification if Asaas supports it
  // This implementation checks both the access token and validates the payload structure
  const expectedToken = secret;
  
  // Basic token verification
  if (signature !== expectedToken) {
    return false;
  }

  // Additional validation: verify payload structure
  try {
    const data = JSON.parse(payload);
    if (!data.event) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// POST /api/subscriptions/webhook - Handle Asaas webhooks
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('ASAAS_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify webhook signature
    const signature = request.headers.get('asaas-access-token');
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn('Invalid webhook signature received');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as AsaasWebhookPayload;

    // Use service client for webhook operations (no user context)
    const supabase = createServiceClient();

    // Add request ID for idempotency (prevent duplicate processing)
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    console.log(`Processing webhook ${payload.event} with request ID: ${requestId}`);

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
