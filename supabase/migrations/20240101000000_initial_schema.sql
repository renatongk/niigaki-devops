-- CEASA Multi-tenant SaaS Database Schema
-- This migration creates all tables with Row Level Security (RLS) policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- TENANT (Client/Company)
-- =====================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) NOT NULL UNIQUE, -- CNPJ
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    asaas_customer_id VARCHAR(100),
    subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'suspended')),
    subscription_plan VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- USER PROFILES (linked to Supabase Auth)
-- =====================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'store_operator' CHECK (role IN ('admin', 'manager', 'buyer', 'store_operator')),
    store_id UUID, -- Will be linked to stores table after creation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- STORES
-- =====================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Add foreign key to user_profiles after stores table exists
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL;

-- =====================
-- PRODUCTS
-- =====================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(20) NOT NULL DEFAULT 'un', -- kg, un, cx, etc
    default_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =====================
-- SUPPLIERS
-- =====================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20), -- CPF/CNPJ
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    bank_info TEXT,
    pix_key VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- ORDERS (Store order lists)
-- =====================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'purchasing', 'purchased', 'distributed', 'cancelled')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, order_number)
);

-- =====================
-- ORDER ITEMS
-- =====================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    requested_quantity DECIMAL(10, 2) NOT NULL,
    approved_quantity DECIMAL(10, 2),
    unit_price DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- DAILY STOCK (Available at CEASA)
-- =====================
CREATE TABLE daily_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stock_date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    supplier_id UUID REFERENCES suppliers(id),
    available_quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, stock_date, product_id, supplier_id)
);

-- =====================
-- PURCHASES (From CEASA)
-- =====================
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    purchase_number VARCHAR(50) NOT NULL,
    purchase_date DATE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
    payment_method VARCHAR(50),
    notes TEXT,
    buyer_id UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, purchase_number)
);

-- =====================
-- PURCHASE ITEMS
-- =====================
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- DISTRIBUTIONS (To stores)
-- =====================
CREATE TABLE distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    distribution_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'partial')),
    notes TEXT,
    distributed_by UUID NOT NULL REFERENCES user_profiles(id),
    received_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- DISTRIBUTION ITEMS
-- =====================
CREATE TABLE distribution_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distribution_id UUID NOT NULL REFERENCES distributions(id) ON DELETE CASCADE,
    purchase_item_id UUID NOT NULL REFERENCES purchase_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10, 2) NOT NULL,
    received_quantity DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- FINANCIAL TRANSACTIONS
-- =====================
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('purchase', 'sale', 'return', 'refund', 'packaging', 'other')),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    transaction_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- SUPPLIER PAYMENTS
-- =====================
CREATE TABLE supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    purchase_id UUID REFERENCES purchases(id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- MERCHANDISE RETURNS
-- =====================
CREATE TABLE merchandise_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id),
    return_number VARCHAR(50) NOT NULL,
    return_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('to_supplier', 'from_store')),
    supplier_id UUID REFERENCES suppliers(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
    total_value DECIMAL(12, 2),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, return_number)
);

-- =====================
-- MERCHANDISE RETURN ITEMS
-- =====================
CREATE TABLE merchandise_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES merchandise_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- PACKAGING TYPES (Returnable packaging)
-- =====================
CREATE TABLE packaging_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    deposit_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- =====================
-- PACKAGING MOVEMENTS
-- =====================
CREATE TABLE packaging_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    packaging_type_id UUID NOT NULL REFERENCES packaging_types(id),
    store_id UUID REFERENCES stores(id),
    supplier_id UUID REFERENCES suppliers(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('sent', 'received', 'returned', 'lost')),
    quantity INTEGER NOT NULL,
    movement_date DATE NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- PACKAGING BALANCES
-- =====================
CREATE TABLE packaging_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    packaging_type_id UUID NOT NULL REFERENCES packaging_types(id),
    store_id UUID REFERENCES stores(id),
    supplier_id UUID REFERENCES suppliers(id),
    balance INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, packaging_type_id, store_id, supplier_id)
);

-- =====================
-- SUBSCRIPTIONS (Asaas integration)
-- =====================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asaas_subscription_id VARCHAR(100),
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'overdue', 'cancelled')),
    billing_type VARCHAR(20) DEFAULT 'monthly' CHECK (billing_type IN ('monthly', 'yearly')),
    next_due_date DATE,
    value DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_store ON user_profiles(store_id);
CREATE INDEX idx_stores_tenant ON stores(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_daily_stock_tenant_date ON daily_stock(tenant_id, stock_date);
CREATE INDEX idx_purchases_tenant ON purchases(tenant_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_distributions_tenant ON distributions(tenant_id);
CREATE INDEX idx_distributions_store ON distributions(store_id);
CREATE INDEX idx_financial_transactions_tenant ON financial_transactions(tenant_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_supplier_payments_tenant ON supplier_payments(tenant_id);
CREATE INDEX idx_merchandise_returns_tenant ON merchandise_returns(tenant_id);
CREATE INDEX idx_packaging_movements_tenant ON packaging_movements(tenant_id);

-- =====================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT tenant_id INTO tenant FROM user_profiles WHERE id = auth.uid();
    RETURN tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants: Only admins can view their own tenant
CREATE POLICY tenant_select ON tenants FOR SELECT
    USING (id = get_current_tenant_id());

CREATE POLICY tenant_update ON tenants FOR UPDATE
    USING (id = get_current_tenant_id() AND is_tenant_admin());

-- User Profiles: Users can only see profiles from their tenant
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin());

CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE
    USING (tenant_id = get_current_tenant_id() AND (is_tenant_admin() OR id = auth.uid()));

CREATE POLICY user_profiles_delete ON user_profiles FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Stores: Users can only see stores from their tenant
CREATE POLICY stores_select ON stores FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY stores_insert ON stores FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin());

CREATE POLICY stores_update ON stores FOR UPDATE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

CREATE POLICY stores_delete ON stores FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Products: Users can only see products from their tenant
CREATE POLICY products_select ON products FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY products_insert ON products FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY products_update ON products FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY products_delete ON products FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Suppliers: Users can only see suppliers from their tenant
CREATE POLICY suppliers_select ON suppliers FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY suppliers_insert ON suppliers FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY suppliers_update ON suppliers FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY suppliers_delete ON suppliers FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Orders: Users can only see orders from their tenant
CREATE POLICY orders_select ON orders FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY orders_insert ON orders FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY orders_update ON orders FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY orders_delete ON orders FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Order Items: Based on parent order
CREATE POLICY order_items_select ON order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY order_items_insert ON order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY order_items_update ON order_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY order_items_delete ON order_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.tenant_id = get_current_tenant_id()
    ));

-- Daily Stock: Users can only see stock from their tenant
CREATE POLICY daily_stock_select ON daily_stock FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY daily_stock_insert ON daily_stock FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY daily_stock_update ON daily_stock FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY daily_stock_delete ON daily_stock FOR DELETE
    USING (tenant_id = get_current_tenant_id());

-- Purchases: Users can only see purchases from their tenant
CREATE POLICY purchases_select ON purchases FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY purchases_insert ON purchases FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY purchases_update ON purchases FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY purchases_delete ON purchases FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Purchase Items: Based on parent purchase
CREATE POLICY purchase_items_select ON purchase_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY purchase_items_insert ON purchase_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY purchase_items_update ON purchase_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY purchase_items_delete ON purchase_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.tenant_id = get_current_tenant_id()
    ));

-- Distributions: Users can only see distributions from their tenant
CREATE POLICY distributions_select ON distributions FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY distributions_insert ON distributions FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY distributions_update ON distributions FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY distributions_delete ON distributions FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Distribution Items: Based on parent distribution
CREATE POLICY distribution_items_select ON distribution_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM distributions WHERE distributions.id = distribution_items.distribution_id AND distributions.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY distribution_items_insert ON distribution_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM distributions WHERE distributions.id = distribution_items.distribution_id AND distributions.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY distribution_items_update ON distribution_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM distributions WHERE distributions.id = distribution_items.distribution_id AND distributions.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY distribution_items_delete ON distribution_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM distributions WHERE distributions.id = distribution_items.distribution_id AND distributions.tenant_id = get_current_tenant_id()
    ));

-- Financial Transactions: Users can only see transactions from their tenant
CREATE POLICY financial_transactions_select ON financial_transactions FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY financial_transactions_insert ON financial_transactions FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY financial_transactions_update ON financial_transactions FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY financial_transactions_delete ON financial_transactions FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Supplier Payments: Users can only see payments from their tenant
CREATE POLICY supplier_payments_select ON supplier_payments FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY supplier_payments_insert ON supplier_payments FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY supplier_payments_update ON supplier_payments FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY supplier_payments_delete ON supplier_payments FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Merchandise Returns: Users can only see returns from their tenant
CREATE POLICY merchandise_returns_select ON merchandise_returns FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY merchandise_returns_insert ON merchandise_returns FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY merchandise_returns_update ON merchandise_returns FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY merchandise_returns_delete ON merchandise_returns FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Merchandise Return Items: Based on parent return
CREATE POLICY merchandise_return_items_select ON merchandise_return_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM merchandise_returns WHERE merchandise_returns.id = merchandise_return_items.return_id AND merchandise_returns.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY merchandise_return_items_insert ON merchandise_return_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM merchandise_returns WHERE merchandise_returns.id = merchandise_return_items.return_id AND merchandise_returns.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY merchandise_return_items_update ON merchandise_return_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM merchandise_returns WHERE merchandise_returns.id = merchandise_return_items.return_id AND merchandise_returns.tenant_id = get_current_tenant_id()
    ));

CREATE POLICY merchandise_return_items_delete ON merchandise_return_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM merchandise_returns WHERE merchandise_returns.id = merchandise_return_items.return_id AND merchandise_returns.tenant_id = get_current_tenant_id()
    ));

-- Packaging Types: Users can only see packaging types from their tenant
CREATE POLICY packaging_types_select ON packaging_types FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_types_insert ON packaging_types FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_types_update ON packaging_types FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_types_delete ON packaging_types FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Packaging Movements: Users can only see movements from their tenant
CREATE POLICY packaging_movements_select ON packaging_movements FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_movements_insert ON packaging_movements FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_movements_update ON packaging_movements FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_movements_delete ON packaging_movements FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Packaging Balances: Users can only see balances from their tenant
CREATE POLICY packaging_balances_select ON packaging_balances FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_balances_insert ON packaging_balances FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_balances_update ON packaging_balances FOR UPDATE
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY packaging_balances_delete ON packaging_balances FOR DELETE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- Subscriptions: Users can only see their tenant's subscription
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY subscriptions_insert ON subscriptions FOR INSERT
    WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_admin());

CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE
    USING (tenant_id = get_current_tenant_id() AND is_tenant_admin());

-- =====================
-- TRIGGERS FOR UPDATED_AT
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_stock_updated_at BEFORE UPDATE ON daily_stock FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_items_updated_at BEFORE UPDATE ON purchase_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributions_updated_at BEFORE UPDATE ON distributions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distribution_items_updated_at BEFORE UPDATE ON distribution_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_payments_updated_at BEFORE UPDATE ON supplier_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchandise_returns_updated_at BEFORE UPDATE ON merchandise_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchandise_return_items_updated_at BEFORE UPDATE ON merchandise_return_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packaging_types_updated_at BEFORE UPDATE ON packaging_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packaging_movements_updated_at BEFORE UPDATE ON packaging_movements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- FUNCTIONS FOR PACKAGING BALANCE
-- =====================
CREATE OR REPLACE FUNCTION update_packaging_balance()
RETURNS TRIGGER AS $$
DECLARE
    delta INTEGER;
BEGIN
    -- Calculate delta based on movement type
    IF NEW.movement_type IN ('received', 'returned') THEN
        delta = NEW.quantity;
    ELSE -- sent, lost
        delta = -NEW.quantity;
    END IF;

    -- Update or insert balance
    INSERT INTO packaging_balances (tenant_id, packaging_type_id, store_id, supplier_id, balance, last_updated)
    VALUES (NEW.tenant_id, NEW.packaging_type_id, NEW.store_id, NEW.supplier_id, delta, NOW())
    ON CONFLICT (tenant_id, packaging_type_id, store_id, supplier_id)
    DO UPDATE SET balance = packaging_balances.balance + delta, last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_packaging_balance
AFTER INSERT ON packaging_movements
FOR EACH ROW EXECUTE FUNCTION update_packaging_balance();
