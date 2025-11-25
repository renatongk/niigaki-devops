// Asaas API integration for subscription management
// Documentation: https://docs.asaas.com/

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

interface AsaasCustomer {
  id?: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

interface AsaasSubscription {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  nextDueDate: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
  interest?: {
    value: number;
  };
  fine?: {
    value: number;
  };
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}

interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

async function asaasRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.description || 'Asaas API error');
  }

  return response.json();
}

// Customer Management
export async function createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>('/customers', 'POST', customer);
}

export async function getCustomer(customerId: string): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>(`/customers/${customerId}`);
}

export async function updateCustomer(customerId: string, customer: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
  return asaasRequest<AsaasCustomer>(`/customers/${customerId}`, 'PUT', customer);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  return asaasRequest<void>(`/customers/${customerId}`, 'DELETE');
}

// Subscription Management
export async function createSubscription(subscription: AsaasSubscription): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>('/subscriptions', 'POST', subscription);
}

export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
}

export async function updateSubscription(subscriptionId: string, subscription: Partial<AsaasSubscription>): Promise<AsaasSubscription> {
  return asaasRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`, 'PUT', subscription);
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  return asaasRequest<void>(`/subscriptions/${subscriptionId}`, 'DELETE');
}

export async function listSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
  return asaasRequest<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments`);
}

// Payment Management
export async function createPayment(payment: AsaasPayment): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>('/payments', 'POST', payment);
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>(`/payments/${paymentId}`);
}

export async function getPaymentPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string }> {
  return asaasRequest<{ encodedImage: string; payload: string }>(`/payments/${paymentId}/pixQrCode`);
}

export async function getPaymentBoletoBarcode(paymentId: string): Promise<{ identificationField: string; barCode: string }> {
  return asaasRequest<{ identificationField: string; barCode: string }>(`/payments/${paymentId}/identificationField`);
}

// Webhook payload type
export interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    value: number;
    netValue: number;
    status: string;
    dueDate: string;
    paymentDate?: string;
    externalReference?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    status: string;
    externalReference?: string;
  };
}

// Plans configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Básico',
    value: 99.90,
    maxStores: 3,
    maxUsers: 5,
    features: ['Controle de pedidos', 'Estoque básico', 'Relatórios simples'],
  },
  professional: {
    name: 'Profissional',
    value: 199.90,
    maxStores: 10,
    maxUsers: 20,
    features: ['Todos do Básico', 'Financeiro completo', 'Controle de devoluções', 'Embalagens retornáveis'],
  },
  enterprise: {
    name: 'Enterprise',
    value: 399.90,
    maxStores: -1, // unlimited
    maxUsers: -1, // unlimited
    features: ['Todos do Profissional', 'API de integração', 'Suporte prioritário', 'Customizações'],
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
