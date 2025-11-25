// Database types for the CEASA multi-tenant SaaS application

export interface Tenant {
  id: string;
  name: string;
  document: string; // CNPJ
  email: string;
  phone?: string;
  address?: string;
  asaas_customer_id?: string;
  subscription_status: 'active' | 'inactive' | 'trial' | 'suspended';
  subscription_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'buyer' | 'store_operator';
  store_id?: string; // If user is linked to a specific store
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  category: string;
  unit: string; // kg, un, cx, etc
  default_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  document: string; // CPF/CNPJ
  email?: string;
  phone?: string;
  address?: string;
  bank_info?: string;
  pix_key?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Order created by store for what they need
export interface Order {
  id: string;
  tenant_id: string;
  store_id: string;
  order_number: string;
  order_date: string;
  status: 'pending' | 'approved' | 'purchasing' | 'purchased' | 'distributed' | 'cancelled';
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  requested_quantity: number;
  approved_quantity?: number;
  unit_price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Daily stock available at CEASA
export interface DailyStock {
  id: string;
  tenant_id: string;
  stock_date: string;
  product_id: string;
  supplier_id?: string;
  available_quantity: number;
  unit_price: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Purchase made by buyer at CEASA
export interface Purchase {
  id: string;
  tenant_id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_method?: string;
  notes?: string;
  buyer_id: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Distribution of purchased items to stores
export interface Distribution {
  id: string;
  tenant_id: string;
  purchase_id: string;
  store_id: string;
  distribution_date: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'partial';
  notes?: string;
  distributed_by: string;
  received_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DistributionItem {
  id: string;
  distribution_id: string;
  purchase_item_id: string;
  product_id: string;
  quantity: number;
  received_quantity?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Financial transactions
export interface FinancialTransaction {
  id: string;
  tenant_id: string;
  store_id?: string;
  type: 'income' | 'expense';
  category: 'purchase' | 'sale' | 'return' | 'refund' | 'packaging' | 'other';
  amount: number;
  description: string;
  reference_type?: string; // purchase, distribution, return, etc
  reference_id?: string;
  transaction_date: string;
  payment_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Supplier payments
export interface SupplierPayment {
  id: string;
  tenant_id: string;
  supplier_id: string;
  purchase_id?: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Merchandise returns (devoluções)
export interface MerchandiseReturn {
  id: string;
  tenant_id: string;
  store_id: string;
  return_number: string;
  return_date: string;
  type: 'to_supplier' | 'from_store';
  supplier_id?: string;
  reason: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  total_value?: number;
  notes?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MerchandiseReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  quantity: number;
  unit_price?: number;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Returnable packaging (embalagens retornáveis)
export interface PackagingType {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  deposit_value: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackagingMovement {
  id: string;
  tenant_id: string;
  packaging_type_id: string;
  store_id?: string;
  supplier_id?: string;
  movement_type: 'sent' | 'received' | 'returned' | 'lost';
  quantity: number;
  movement_date: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PackagingBalance {
  id: string;
  tenant_id: string;
  packaging_type_id: string;
  store_id?: string;
  supplier_id?: string;
  balance: number;
  last_updated: string;
}

// Subscription (Asaas integration)
export interface Subscription {
  id: string;
  tenant_id: string;
  asaas_subscription_id: string;
  plan: string;
  status: 'active' | 'inactive' | 'overdue' | 'cancelled';
  billing_type: 'monthly' | 'yearly';
  next_due_date: string;
  value: number;
  created_at: string;
  updated_at: string;
}
