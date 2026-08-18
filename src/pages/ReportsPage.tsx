import { useState, useEffect, useMemo } from "react";
import { productService, salesService, expenseService } from "@/services/dataProvider";
import { formatCurrency, formatNumber } from "@/utils/currency";
import { formatMargin } from "@/utils/calculations";
import type { Product, Sale, Expense } from "@/types";
import {
  FileBarChart,
  Download,
  Printer,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

export function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dateRange, setDateRange] = useState<string>("30days");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  const loadData = async () => {
    const [s, e, p] = await Promise.all([
      salesService.getAll(),
      expenseService.getAll(),
      productService.getAll(),
    ]);
    setSales(s);
    setExpenses(e);
    setProducts(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter sales and expenses by date and product
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      // Product filter
      if (selectedProduct !== "all" && s.product_id !== selectedProduct) {
        return false;
      }

      // Date filter
      const date = new Date(s.created_at);
      if (dateRange === "today") return date.toDateString() === now.toDateString();
      if (dateRange === "7days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 7;
      if (dateRange === "30days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 30;
      if (dateRange === "this_month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (dateRange === "this_year") return date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [sales, dateRange, selectedProduct]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const date = new Date(e.created_at);
      if (dateRange === "today") return date.toDateString() === now.toDateString();
      if (dateRange === "7days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 7;
      if (dateRange === "30days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 30;
      if (dateRange === "this_month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (dateRange === "this_year") return date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [expenses, dateRange]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalTransactions = filteredSales.length;
    const totalQuantitySold = filteredSales.reduce((acc, s) => acc + Number(s.quantity), 0);
    const totalRevenue = filteredSales.reduce((acc, s) => acc + Number(s.total_revenue), 0);
    const totalCost = filteredSales.reduce((acc, s) => acc + Number(s.total_cost), 0);
    const grossProfit = totalRevenue - totalCost;
    const totalExp = filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const netProfit = grossProfit - totalExp;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalTransactions,
      totalQuantitySold,
      totalRevenue,
      totalCost,
      grossProfit,
      totalExp,
      netProfit,
      margin,
    };
  }, [filteredSales, filteredExpenses]);

  // Product-by-product breakdown table
  const productBreakdown = useMemo(() => {
    const map: Record<
      string,
      { name: string; sold: number; revenue: number; cost: number; profit: number }
    > = {};

    filteredSales.forEach((s) => {
      const name = s.product?.name || "Produk";
      if (!map[name]) {
        map[name] = { name, sold: 0, revenue: 0, cost: 0, profit: 0 };
      }
      map[name].sold += Number(s.quantity);
      map[name].revenue += Number(s.total_revenue);
      map[name].cost += Number(s.total_cost);
      map[name].profit += Number(s.total_profit);
    });

    return Object.values(map).sort((a, b) => b.profit - a.profit);
  }, [filteredSales]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      toast.error("Tidak ada data penjualan untuk diekspor");
      return;
    }

    const headers = [
      "Tanggal & Waktu",
      "Produk",
      "Jumlah (pcs)",
      "Harga Jual (Rp)",
      "Total Penjualan (Rp)",
      "Modal Barang (Rp)",
      "Keuntungan Bersih (Rp)",
    ];

    const rows = filteredSales.map((s) => [
      `"${new Date(s.created_at).toLocaleString("id-ID")}"`,
      `"${s.product?.name || "Produk"}"`,
      s.quantity,
      s.selling_price,
      s.total_revenue,
      s.total_cost,
      s.total_profit,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_CuanCuy_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Laporan CSV berhasil diunduh!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Laporan Keuangan</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Ringkasan omset, modal pokok (HPP), laba kotor, biaya operasional, dan laba bersih.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-text-muted" />
            <span>Cetak / PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] shadow-md shadow-emerald/20 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <span className="text-xs font-semibold text-text-secondary uppercase">Filter Laporan:</span>
        </div>

        {/* Date Filter */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-xl border border-border bg-elevated px-3.5 py-2 text-xs text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
        >
          <option value="today">Hari Ini</option>
          <option value="7days">7 Hari Terakhir</option>
          <option value="30days">30 Hari Terakhir</option>
          <option value="this_month">Bulan Ini</option>
          <option value="this_year">Tahun Ini</option>
          <option value="all">Semua Waktu</option>
        </select>

        {/* Product Filter */}
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="rounded-xl border border-border bg-elevated px-3.5 py-2 text-xs text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
        >
          <option value="all">Semua Produk</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Financial Statement Summary Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <FileBarChart className="h-4 w-4 text-emerald" />
          Laporan Laba & Rugi (Income Statement)
        </h3>

        {/* Income Statement Table */}
        <div className="space-y-3 text-sm">
          {/* Revenue */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <span className="font-semibold text-text-primary">Penjualan Kotor (Revenue)</span>
              <p className="text-xs text-text-muted">
                {metrics.totalTransactions} transaksi ({formatNumber(metrics.totalQuantitySold)} pcs terjual)
              </p>
            </div>
            <strong className="text-base font-bold text-text-primary tabular-nums">
              {formatCurrency(metrics.totalRevenue)}
            </strong>
          </div>

          {/* Cost of Goods */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <span className="text-text-secondary">Modal Barang Pokok (HPP / COGS)</span>
              <p className="text-xs text-text-muted">Total modal pembelian barang yang terjual</p>
            </div>
            <strong className="text-sm font-semibold text-text-secondary tabular-nums">
              -{formatCurrency(metrics.totalCost)}
            </strong>
          </div>

          {/* Gross Profit */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald/10 border border-emerald/20">
            <div>
              <span className="font-bold text-emerald">Laba Kotor (Gross Profit)</span>
              <p className="text-[11px] text-text-muted">Margin: {formatMargin(metrics.margin)}</p>
            </div>
            <strong className="text-lg font-extrabold text-emerald tabular-nums">
              +{formatCurrency(metrics.grossProfit)}
            </strong>
          </div>

          {/* Operating Expenses */}
          <div className="flex items-center justify-between pb-2 border-b border-border pt-2">
            <div>
              <span className="text-text-secondary">Total Biaya Operasional (Expenses)</span>
              <p className="text-xs text-text-muted">
                Pengemasan, pengiriman, biaya marketplace, iklan, dll.
              </p>
            </div>
            <strong className="text-sm font-semibold text-amber tabular-nums">
              -{formatCurrency(metrics.totalExp)}
            </strong>
          </div>

          {/* Net Profit */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border ${
              metrics.netProfit >= 0
                ? "bg-emerald/15 border-emerald/30 text-emerald"
                : "bg-error/15 border-error/30 text-error"
            }`}
          >
            <div>
              <span className="text-base font-bold uppercase tracking-wider">
                {metrics.netProfit >= 0 ? "Laba Bersih (Net Profit)" : "Kerugian Bersih"}
              </span>
              <p className="text-xs text-text-secondary">
                {metrics.netProfit >= 0
                  ? "Keuntungan murni setelah dikurangi semua modal dan biaya"
                  : "Biaya operasional melebihi keuntungan penjualan"}
              </p>
            </div>
            <strong className="text-2xl font-extrabold tabular-nums">
              {metrics.netProfit >= 0
                ? `+${formatCurrency(metrics.netProfit)}`
                : `Rugi ${formatCurrency(Math.abs(metrics.netProfit))}`}
            </strong>
          </div>
        </div>
      </div>

      {/* Product Breakdown Performance */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-bold text-text-primary">Rincian Performa per Produk</h3>
          <p className="text-xs text-text-muted">Kontribusi penjualan dan laba masing-masing barang</p>
        </div>

        {productBreakdown.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            Belum ada transaksi pada rentang waktu ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-elevated/40 text-xs font-semibold text-text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Nama Produk</th>
                  <th className="px-4 py-3 text-center">Unit Terjual</th>
                  <th className="px-4 py-3 text-right">Total Penjualan</th>
                  <th className="px-4 py-3 text-right">Total Modal</th>
                  <th className="px-4 py-3 text-right">Keuntungan</th>
                  <th className="px-4 py-3 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {productBreakdown.map((item) => {
                  const m = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                  return (
                    <tr key={item.name} className="hover:bg-elevated/30 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-text-primary">{item.name}</td>
                      <td className="px-4 py-3.5 text-center font-bold tabular-nums text-text-primary">
                        {item.sold} pcs
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-text-primary font-semibold">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-text-muted">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums text-emerald">
                        +{formatCurrency(item.profit)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums text-emerald">
                        {formatMargin(m)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
