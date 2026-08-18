// ===== Database Types =====

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TierPricing {
  min_qty: number;
  price: number;
  label?: string;
}

export interface BundleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type?: "single" | "bundle";
  purchase_price: number;
  selling_price: number;
  stock: number;
  total_sold: number;
  tier_pricing?: TierPricing[];
  bundle_items?: BundleItem[];
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  bundle_info?: {
    is_bundle?: boolean;
    bundle_name?: string;
    bundle_items?: BundleItem[];
    tier_applied?: TierPricing;
  } | null;
  created_at: string;
  // Joined data
  product?: Product;
}

export interface CapitalTransaction {
  id: string;
  user_id: string;
  type: "initial_capital" | "add_capital" | "withdrawal";
  amount: number;
  description: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export interface AppSettings {
  id: string;
  user_id: string;
  currency: string;
  date_format: string;
  theme: "dark" | "light" | "system";
  low_stock_threshold: number;
  notifications_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ===== Form Types =====

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  full_name: string;
  username: string;
  password: string;
  confirm_password: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  type?: "single" | "bundle";
  purchase_price: number;
  selling_price: number;
  stock: number;
  tier_pricing?: TierPricing[];
  bundle_items?: BundleItem[];
}

export interface SaleFormData {
  product_id: string;
  quantity: number;
  custom_selling_price?: number;
  custom_purchase_price?: number;
  bundle_info?: {
    is_bundle?: boolean;
    bundle_name?: string;
    bundle_items?: BundleItem[];
    tier_applied?: TierPricing;
  };
}

export interface CapitalFormData {
  type: "initial_capital" | "add_capital" | "withdrawal";
  amount: number;
  description?: string;
}

export interface ExpenseFormData {
  category: string;
  amount: number;
  description?: string;
}

// ===== Dashboard Types =====

export interface DashboardKPI {
  total_capital: number;
  total_revenue: number;
  total_profit: number;
  total_products_sold: number;
  total_expenses: number;
  net_profit: number;
  cash_available: number;
  inventory_value: number;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
  total_profit: number;
  profit_margin: number;
}

// ===== Calculator Types =====

export interface PriceCalculation {
  purchase_price: number;
  selling_price: number;
  profit_per_piece: number;
  margin: number;
  quantity: number;
  total_cost: number;
  total_revenue: number;
  total_profit: number;
}

export interface PriceScenario {
  selling_price: number;
  profit_per_piece: number;
  total_profit: number;
  margin: number;
}

export interface BundleScenario {
  name: string;
  items: { name: string; quantity: number; purchase_price: number; regular_price: number }[];
  bundle_price: number;
  total_cost: number;
  normal_total_revenue: number;
  bundle_profit: number;
  discount_amount: number;
  discount_percent: number;
  margin: number;
}

// ===== Report Types =====

export interface ReportFilter {
  start_date: string;
  end_date: string;
  product_id?: string;
}

export interface ReportSummary {
  total_sales: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  total_expenses: number;
  net_profit: number;
  transactions: Sale[];
}
