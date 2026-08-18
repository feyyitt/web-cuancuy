-- =====================================================
-- 💰 CUAN CUY — SUPABASE DATABASE MIGRATION
-- Run this in your Supabase SQL Editor (1-Click Setup)
-- =====================================================

-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- 2. PRODUCTS TABLE (with Bundling & Tier Pricing support)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'single', -- 'single' or 'bundle'
  purchase_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  total_sold INTEGER NOT NULL DEFAULT 0,
  tier_pricing JSONB DEFAULT '[]'::jsonb, -- e.g. [{"min_qty": 2, "price": 10000}]
  bundle_items JSONB DEFAULT '[]'::jsonb, -- e.g. [{"product_id": "...", "quantity": 1}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Auto add columns if table already exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'single';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tier_pricing JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bundle_items JSONB DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
CREATE POLICY "Users can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);


-- 3. SALES TABLE (with historical price snapshot & bundle info)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  purchase_price NUMERIC(15,2) NOT NULL,
  selling_price NUMERIC(15,2) NOT NULL,
  total_revenue NUMERIC(15,2) NOT NULL,
  total_cost NUMERIC(15,2) NOT NULL,
  total_profit NUMERIC(15,2) NOT NULL,
  bundle_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Auto add column if table already exists
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS bundle_info JSONB;

DROP POLICY IF EXISTS "Users can view own sales" ON public.sales;
CREATE POLICY "Users can view own sales"
  ON public.sales FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sales" ON public.sales;
CREATE POLICY "Users can insert own sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sales" ON public.sales;
CREATE POLICY "Users can delete own sales"
  ON public.sales FOR DELETE
  USING (auth.uid() = user_id);


-- 4. CAPITAL TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.capital_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('initial_capital', 'add_capital', 'withdrawal')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.capital_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own capital" ON public.capital_transactions;
CREATE POLICY "Users can view own capital"
  ON public.capital_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own capital" ON public.capital_transactions;
CREATE POLICY "Users can insert own capital"
  ON public.capital_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own capital" ON public.capital_transactions;
CREATE POLICY "Users can update own capital"
  ON public.capital_transactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own capital" ON public.capital_transactions;
CREATE POLICY "Users can delete own capital"
  ON public.capital_transactions FOR DELETE
  USING (auth.uid() = user_id);


-- 5. EXPENSES TABLE (Operational Costs)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);


-- 6. APP SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'IDR',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  theme TEXT DEFAULT 'dark',
  low_stock_threshold INTEGER DEFAULT 10,
  notifications_enabled BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.app_settings;
CREATE POLICY "Users can view own settings"
  ON public.app_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.app_settings;
CREATE POLICY "Users can insert own settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.app_settings;
CREATE POLICY "Users can update own settings"
  ON public.app_settings FOR UPDATE
  USING (auth.uid() = user_id);


-- 7. ATOMIC TRANSACTION: CREATE SALE & DECREMENT STOCK
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_sale(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_product RECORD;
  v_revenue NUMERIC(15,2);
  v_cost NUMERIC(15,2);
  v_profit NUMERIC(15,2);
  v_sale_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock product row for concurrency safety
  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %', v_product.stock;
  END IF;

  -- Calculate financial metrics
  v_revenue := v_product.selling_price * p_quantity;
  v_cost := v_product.purchase_price * p_quantity;
  v_profit := v_revenue - v_cost;

  -- Insert sale record
  INSERT INTO public.sales (
    user_id,
    product_id,
    quantity,
    purchase_price,
    selling_price,
    total_revenue,
    total_cost,
    total_profit
  ) VALUES (
    v_user_id,
    p_product_id,
    p_quantity,
    v_product.purchase_price,
    v_product.selling_price,
    v_revenue,
    v_cost,
    v_profit
  )
  RETURNING id INTO v_sale_id;

  -- Update product stock and total_sold
  UPDATE public.products
  SET
    stock = stock - p_quantity,
    total_sold = total_sold + p_quantity,
    updated_at = now()
  WHERE id = p_product_id;

  -- Return sale details
  RETURN json_build_object(
    'sale_id', v_sale_id,
    'product_name', v_product.name,
    'quantity', p_quantity,
    'selling_price', v_product.selling_price,
    'purchase_price', v_product.purchase_price,
    'total_revenue', v_revenue,
    'total_cost', v_cost,
    'total_profit', v_profit,
    'remaining_stock', v_product.stock - p_quantity
  );
END;
$$;


-- 8. AUTO-ONBOARDING NEW USER TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_full_name TEXT;
  v_username TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Feyy');
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));

  -- 1. Insert Profile
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (NEW.id, v_full_name, v_username)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Settings
  INSERT INTO public.app_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Insert Starter Default Products
  INSERT INTO public.products (user_id, name, description, type, purchase_price, selling_price, stock, total_sold, tier_pricing)
  VALUES
    (NEW.id, 'Pin Bros', 'Pin bros custom design', 'single', 3000, 7000, 100, 0, '[{"min_qty": 3, "price": 18000, "label": "Paket 3 pcs (Rp18.000)"}]'::jsonb),
    (NEW.id, 'Pin Tutup Botol', 'Pin tutup botol berbagai ukuran', 'single', 4000, 8000, 50, 0, '[{"min_qty": 3, "price": 21000, "label": "Paket 3 pcs (Rp21.000)"}]'::jsonb),
    (NEW.id, 'Stiker', 'Stiker vinyl berkualitas tinggi', 'single', 1000, 7000, 200, 0, '[{"min_qty": 2, "price": 10000, "label": "Beli 2 pcs (Rp10.000)"}, {"min_qty": 5, "price": 22000, "label": "Beli 5 pcs (Rp22.000)"}]'::jsonb)
  ON CONFLICT DO NOTHING;

  -- 4. Insert Initial Capital
  INSERT INTO public.capital_transactions (user_id, type, amount, description)
  VALUES (NEW.id, 'initial_capital', 1500000, 'Modal Awal Bisnis')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 9. PERFORMANCE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_capital_user_id ON public.capital_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);


-- 10. UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER tr_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
