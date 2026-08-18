import { supabase } from "@/lib/supabase/client";
import type { Expense, ExpenseFormData, ReportSummary, Sale } from "@/types";

/**
 * Add an expense.
 */
export async function addExpense(
  data: ExpenseFormData
): Promise<{ data: Expense | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Tidak terautentikasi" };

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      category: data.category,
      amount: data.amount,
      description: data.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Expense error:", error);
    return { data: null, error: "Gagal menambah pengeluaran" };
  }
  return { data: expense as Expense, error: null };
}

/**
 * Fetch expenses.
 */
export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
  return data as Expense[];
}

/**
 * Get total expenses.
 */
export async function getTotalExpenses(): Promise<number> {
  const { data, error } = await supabase.from("expenses").select("amount");

  if (error || !data) return 0;
  return data.reduce((sum, e) => sum + Number(e.amount), 0);
}

/**
 * Generate a report for a date range.
 */
export async function generateReport(
  startDate: string,
  endDate: string,
  productId?: string
): Promise<ReportSummary> {
  // Fetch sales in range
  let salesQuery = supabase
    .from("sales")
    .select("*, product:products(name)")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (productId) {
    salesQuery = salesQuery.eq("product_id", productId);
  }

  const { data: sales } = await salesQuery;

  // Fetch expenses in range
  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const salesData = (sales || []) as Sale[];
  const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.total_revenue), 0);
  const totalCost = salesData.reduce((sum, s) => sum + Number(s.total_cost), 0);
  const totalProfit = salesData.reduce((sum, s) => sum + Number(s.total_profit), 0);
  const totalExpenses = (expenses || []).reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  return {
    total_sales: salesData.length,
    total_revenue: totalRevenue,
    total_cost: totalCost,
    total_profit: totalProfit,
    total_expenses: totalExpenses,
    net_profit: totalProfit - totalExpenses,
    transactions: salesData,
  };
}

/**
 * Export sales data as CSV.
 */
export function exportToCSV(sales: Sale[]): string {
  const headers = [
    "Tanggal",
    "Produk",
    "Jumlah",
    "Harga Jual",
    "Total Penjualan",
    "Modal",
    "Keuntungan",
  ];

  const rows = sales.map((s) => [
    new Date(s.created_at).toLocaleDateString("id-ID"),
    (s.product as unknown as { name: string })?.name || "-",
    s.quantity,
    s.selling_price,
    s.total_revenue,
    s.total_cost,
    s.total_profit,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return csv;
}

/**
 * Download CSV file.
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
