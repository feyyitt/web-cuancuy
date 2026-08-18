import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { productService, salesService, capitalService, expenseService } from "@/services/dataProvider";
import { formatCurrency, formatNumber } from "@/utils/currency";
import { calculateProfitPerPiece, calculateMargin, formatMargin } from "@/utils/calculations";
import { TIME_FILTERS } from "@/constants";
import type { Product, Sale, CapitalTransaction, Expense } from "@/types";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  ArrowRight,
  AlertTriangle,
  Plus,
  Layers,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function getGreeting(): string {
  try {
    // Get current hour in WITA (Asia/Makassar / UTC+8)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Makassar",
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(formatter.format(now), 10);

    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 19) return "Selamat sore";
    return "Selamat malam";
  } catch {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 19) return "Selamat sore";
    return "Selamat malam";
  }
}

export function DashboardPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [capital, setCapital] = useState<CapitalTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeFilter, setTimeFilter] = useState<string>("30days");

  const greeting = getGreeting();

  const loadData = async () => {
    const [p, s, c, e] = await Promise.all([
      productService.getAll(),
      salesService.getAll(),
      capitalService.getAll(),
      expenseService.getAll(),
    ]);
    setProducts(p);
    setSales(s);
    setCapital(c);
    setExpenses(e);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter sales and expenses by selected time range
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const date = new Date(s.created_at);
      if (timeFilter === "today") {
        return date.toDateString() === now.toDateString();
      }
      if (timeFilter === "7days") {
        const diff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      if (timeFilter === "30days") {
        const diff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        return diff <= 30;
      }
      if (timeFilter === "this_month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (timeFilter === "this_year") {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, timeFilter]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const date = new Date(e.created_at);
      if (timeFilter === "today") return date.toDateString() === now.toDateString();
      if (timeFilter === "7days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 7;
      if (timeFilter === "30days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 30;
      if (timeFilter === "this_month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (timeFilter === "this_year") return date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [expenses, timeFilter]);

  // Main KPI Aggregations
  const kpis = useMemo(() => {
    // Total capital deposited
    const totalCapital = capital.reduce((acc, c) => {
      if (c.type === "initial_capital" || c.type === "add_capital") return acc + Number(c.amount);
      if (c.type === "withdrawal") return acc - Number(c.amount);
      return acc;
    }, 0);

    const totalRevenue = filteredSales.reduce((acc, s) => acc + Number(s.total_revenue), 0);
    const totalCost = filteredSales.reduce((acc, s) => acc + Number(s.total_cost), 0);
    const totalGrossProfit = totalRevenue - totalCost;
    const totalItemsSold = filteredSales.reduce((acc, s) => acc + Number(s.quantity), 0);

    const totalExp = filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const netProfit = totalGrossProfit - totalExp;

    const inventoryValue = products.reduce((acc, p) => acc + p.purchase_price * p.stock, 0);
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

    const cashAvailable = Math.max(0, totalCapital + totalRevenue - inventoryValue - totalExp);

    return {
      totalCapital,
      totalRevenue,
      totalCost,
      totalGrossProfit,
      totalItemsSold,
      totalExp,
      netProfit,
      inventoryValue,
      totalStock,
      cashAvailable,
    };
  }, [capital, filteredSales, filteredExpenses, products]);

  // Low stock products (<= 10 pcs)
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= 10);
  }, [products]);

  // Chart Data: Trend over days
  const salesTrendData = useMemo(() => {
    const grouped: Record<string, { date: string; omset: number; untung: number }> = {};

    // Sort ascending for chart
    const sorted = [...filteredSales].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (sorted.length === 0) {
      // Default placeholder curve
      return [
        { date: "Hari 1", omset: 0, untung: 0 },
        { date: "Hari 2", omset: 0, untung: 0 },
      ];
    }

    sorted.forEach((s) => {
      const d = new Date(s.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      if (!grouped[d]) {
        grouped[d] = { date: d, omset: 0, untung: 0 };
      }
      grouped[d].omset += Number(s.total_revenue);
      grouped[d].untung += Number(s.total_profit);
    });

    return Object.values(grouped);
  }, [filteredSales]);

  // Chart Data: Product Performance (Revenue & Profit per product)
  const productPerformanceData = useMemo(() => {
    const map: Record<string, { name: string; sold: number; revenue: number; profit: number }> = {};

    filteredSales.forEach((s) => {
      const name = s.product?.name || "Produk";
      if (!map[name]) {
        map[name] = { name, sold: 0, revenue: 0, profit: 0 };
      }
      map[name].sold += Number(s.quantity);
      map[name].revenue += Number(s.total_revenue);
      map[name].profit += Number(s.total_profit);
    });

    return Object.values(map).sort((a, b) => b.profit - a.profit);
  }, [filteredSales]);

  // Top Selling Products Leaderboard
  const topSelling = useMemo(() => {
    return [...products].sort((a, b) => (b.total_sold || 0) - (a.total_sold || 0)).slice(0, 3);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Header and Time Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {greeting}, {profile?.full_name?.split(" ")[0] || "Juragan"} 👋
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Berikut ringkasan modal, penjualan, dan keuntungan bisnis Anda hari ini.
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                timeFilter === f.value
                  ? "bg-emerald text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-elevated/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm text-amber"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber/20 p-2 text-amber">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">
                Peringatan Stok Menipis ({lowStockProducts.length} produk)
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {lowStockProducts.map((p) => `${p.name} (${p.stock} pcs)`).join(", ")}
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-xs font-bold text-amber hover:underline shrink-0"
          >
            <span>Tambah Stok Sekarang</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}

      {/* PRIMARY 4 KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* TOTAL MODAL */}
        <motion.div
          whileHover={{ translateY: -2 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total Modal Disetor
            </span>
            <div className="rounded-xl bg-emerald/10 p-2.5 text-emerald">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums text-text-primary">
            {formatCurrency(kpis.totalCapital)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>Kas Tersedia:</span>
            <span className="font-semibold text-emerald tabular-nums">
              {formatCurrency(kpis.cashAvailable)}
            </span>
          </div>
        </motion.div>

        {/* TOTAL PENJUALAN */}
        <motion.div
          whileHover={{ translateY: -2 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total Penjualan (Omset)
            </span>
            <div className="rounded-xl bg-info/10 p-2.5 text-info">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums text-text-primary">
            {formatCurrency(kpis.totalRevenue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>Modal Barang (HPP):</span>
            <span className="font-semibold text-text-secondary tabular-nums">
              {formatCurrency(kpis.totalCost)}
            </span>
          </div>
        </motion.div>

        {/* TOTAL KEUNTUNGAN KOTOR */}
        <motion.div
          whileHover={{ translateY: -2 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Total Keuntungan
            </span>
            <div className="rounded-xl bg-emerald/10 p-2.5 text-emerald">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums text-emerald">
            +{formatCurrency(kpis.totalGrossProfit)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>Margin Laba:</span>
            <span className="font-semibold text-emerald tabular-nums">
              {kpis.totalRevenue > 0
                ? formatMargin((kpis.totalGrossProfit / kpis.totalRevenue) * 100)
                : "0.00%"}
            </span>
          </div>
        </motion.div>

        {/* PRODUK TERJUAL */}
        <motion.div
          whileHover={{ translateY: -2 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Produk Terjual
            </span>
            <div className="rounded-xl bg-amber/10 p-2.5 text-amber">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold tabular-nums text-amber">
            {formatNumber(kpis.totalItemsSold)}{" "}
            <span className="text-sm font-normal text-text-muted">pcs</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>Sisa Stok Gudang:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {formatNumber(kpis.totalStock)} pcs
            </span>
          </div>
        </motion.div>
      </div>

      {/* PROFIT & LOSS BREAKDOWN CARD (Section 26) */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald" />
          Rincian Laba & Rugi Bisnis (P&L)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="rounded-xl bg-elevated/60 p-3">
            <span className="text-[11px] text-text-muted uppercase">Penjualan</span>
            <p className="mt-1 text-sm font-bold tabular-nums text-text-primary">
              {formatCurrency(kpis.totalRevenue)}
            </p>
          </div>

          <div className="rounded-xl bg-elevated/60 p-3">
            <span className="text-[11px] text-text-muted uppercase">Modal Barang</span>
            <p className="mt-1 text-sm font-bold tabular-nums text-text-secondary">
              -{formatCurrency(kpis.totalCost)}
            </p>
          </div>

          <div className="rounded-xl bg-emerald/10 p-3 border border-emerald/20">
            <span className="text-[11px] text-emerald uppercase font-semibold">Laba Kotor</span>
            <p className="mt-1 text-sm font-bold tabular-nums text-emerald">
              +{formatCurrency(kpis.totalGrossProfit)}
            </p>
          </div>

          <div className="rounded-xl bg-elevated/60 p-3">
            <span className="text-[11px] text-text-muted uppercase">Biaya Operasional</span>
            <p className="mt-1 text-sm font-bold tabular-nums text-amber">
              -{formatCurrency(kpis.totalExp)}
            </p>
          </div>

          <div
            className={`rounded-xl p-3 border col-span-2 sm:col-span-1 ${
              kpis.netProfit >= 0
                ? "bg-emerald/15 border-emerald/30 text-emerald"
                : "bg-error/15 border-error/30 text-error"
            }`}
          >
            <span className="text-[11px] uppercase font-bold">
              {kpis.netProfit >= 0 ? "Laba Bersih" : "Kerugian"}
            </span>
            <p className="mt-1 text-base font-extrabold tabular-nums">
              {kpis.netProfit >= 0
                ? `+${formatCurrency(kpis.netProfit)}`
                : `Rugi ${formatCurrency(Math.abs(kpis.netProfit))}`}
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION (Section 25) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales & Profit Trend Chart */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-text-primary">Tren Penjualan & Keuntungan</h3>
              <p className="text-xs text-text-muted">Grafik omset vs keuntungan harian</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {salesTrendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                Belum ada data penjualan pada periode ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUntung" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(v) => `Rp${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                    }}
                    itemStyle={{ color: "var(--text-primary)" }}
                    labelStyle={{ color: "var(--text-secondary)", fontWeight: 600 }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="omset"
                    name="Omset Penjualan"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOmset)"
                  />
                  <Area
                    type="monotone"
                    dataKey="untung"
                    name="Keuntungan Bersih"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUntung)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product Profit Contribution Chart */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-text-primary">Performa Keuntungan per Produk</h3>
              <p className="text-xs text-text-muted">Kontribusi keuntungan masing-masing produk</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {productPerformanceData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                Belum ada transaksi penjualan produk.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={(v) => `Rp${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                    }}
                    itemStyle={{ color: "var(--text-primary)" }}
                    labelStyle={{ color: "var(--text-secondary)", fontWeight: 600 }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="revenue" name="Omset" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Keuntungan" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUTS & PRODUCT LEADERBOARD */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions Card */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary mb-1">Aksi Cepat Bisnis</h3>
            <p className="text-xs text-text-secondary mb-4">
              Jalankan transaksi dan kelola produk dengan 1 klik.
            </p>

            <div className="space-y-2.5">
              <Link
                to="/sales"
                className="flex items-center justify-between rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-hover transition-all shadow-md shadow-emerald/20"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="h-4 w-4" />
                  <span>Catat Penjualan Baru</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/products"
                className="flex items-center justify-between rounded-xl border border-border bg-elevated/70 px-4 py-3 text-sm font-medium text-text-primary hover:bg-elevated hover:border-emerald/40 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 text-emerald" />
                  <span>Tambah / Kelola Produk</span>
                </div>
                <Plus className="h-4 w-4 text-text-muted" />
              </Link>

              <Link
                to="/calculator"
                className="flex items-center justify-between rounded-xl border border-border bg-elevated/70 px-4 py-3 text-sm font-medium text-text-primary hover:bg-elevated hover:border-emerald/40 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="h-4 w-4 text-amber" />
                  <span>Simulasi & Hitung Harga Jual</span>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span>Aset Stok Barang:</span>
            <strong className="text-text-primary tabular-nums">
              {formatCurrency(kpis.inventoryValue)}
            </strong>
          </div>
        </div>

        {/* Top Selling Products Leaderboard */}
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-text-primary">Produk Unggulan</h3>
            <Link to="/products" className="text-xs font-semibold text-emerald hover:underline">
              Lihat Semua Produk
            </Link>
          </div>

          {topSelling.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              Belum ada produk. Tambahkan produk untuk melihat performa.
            </div>
          ) : (
            <div className="space-y-3">
              {topSelling.map((p) => {
                const profitPerPcs = calculateProfitPerPiece(p.purchase_price, p.selling_price);
                const margin = calculateMargin(p.purchase_price, p.selling_price);

                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-elevated/40 p-3.5 hover:border-emerald/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald/10 p-2.5 text-emerald shrink-0">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text-primary">{p.name}</h4>
                        <p className="text-xs text-text-muted">
                          Beli: {formatCurrency(p.purchase_price)} • Jual: {formatCurrency(p.selling_price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                      <div>
                        <span className="text-[11px] text-text-muted block">Untung / pcs</span>
                        <strong className="text-xs font-bold text-emerald tabular-nums">
                          +{formatCurrency(profitPerPcs)} ({formatMargin(margin)})
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] text-text-muted block">Sisa Stok</span>
                        <strong
                          className={`text-xs font-bold tabular-nums ${
                            p.stock <= 10 ? "text-amber" : "text-text-primary"
                          }`}
                        >
                          {p.stock} pcs
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
