// Application Constants

export const APP_NAME = "Cuan Cuy";
export const APP_TAGLINE = "Kelola penjualan dan keuntungan bisnis kamu dengan mudah.";
export const APP_DESCRIPTION = "Platform manajemen bisnis yang membantu kamu melacak modal, penjualan, dan keuntungan secara real-time.";

// Internal email domain for username→email mapping
export const AUTH_EMAIL_DOMAIN = "cuancuy.app";

// Navigation items
export const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Kalkulator", path: "/calculator", icon: "Calculator" },
  { label: "Produk", path: "/products", icon: "Package" },
  { label: "Penjualan", path: "/sales", icon: "ShoppingCart" },
  { label: "Modal", path: "/capital", icon: "Wallet" },
  { label: "Laporan", path: "/reports", icon: "FileBarChart" },
  { label: "Pengaturan", path: "/settings", icon: "Settings" },
] as const;

export const MOBILE_NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Kalkulator", path: "/calculator", icon: "Calculator" },
  { label: "Produk", path: "/products", icon: "Package" },
  { label: "Penjualan", path: "/sales", icon: "ShoppingCart" },
  { label: "Lainnya", path: "/more", icon: "MoreHorizontal" },
] as const;

// Default products for onboarding
export const DEFAULT_PRODUCTS = [
  {
    name: "Pin Bros",
    description: "Pin bros custom design",
    purchase_price: 3000,
    selling_price: 7000,
    stock: 100,
  },
  {
    name: "Pin Tutup Botol",
    description: "Pin tutup botol berbagai ukuran",
    purchase_price: 4000,
    selling_price: 8000,
    stock: 50,
  },
  {
    name: "Stiker",
    description: "Stiker vinyl berkualitas tinggi",
    purchase_price: 1000,
    selling_price: 3000,
    stock: 200,
  },
] as const;

// Expense categories
export const EXPENSE_CATEGORIES = [
  "Pengemasan",
  "Pengiriman",
  "Biaya Marketplace",
  "Iklan",
  "Lainnya",
] as const;

// Time filter options
export const TIME_FILTERS = [
  { label: "Hari Ini", value: "today" },
  { label: "7 Hari", value: "7days" },
  { label: "30 Hari", value: "30days" },
  { label: "Bulan Ini", value: "this_month" },
  { label: "Tahun Ini", value: "this_year" },
] as const;

// Stock threshold
export const LOW_STOCK_THRESHOLD = 10;

// Currency
export const DEFAULT_CURRENCY = "IDR";

// Animation durations (ms)
export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  page: 300,
} as const;
