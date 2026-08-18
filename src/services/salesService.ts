import { supabase } from "@/lib/supabase/client";
import type { Sale } from "@/types";

/**
 * Create a sale using the atomic RPC function.
 */
export async function createSale(
  productId: string,
  quantity: number
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { data, error } = await supabase.rpc("create_sale", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) {
    if (error.message.includes("Insufficient stock")) {
      return { data: null, error: "Stok tidak mencukupi" };
    }
    if (error.message.includes("Product not found")) {
      return { data: null, error: "Produk tidak ditemukan" };
    }
    console.error("Sale error:", error);
    return { data: null, error: "Gagal mencatat penjualan" };
  }

  return { data: data as Record<string, unknown>, error: null };
}

/**
 * Fetch sales for the current user.
 */
export async function getSales(options?: {
  startDate?: string;
  endDate?: string;
  productId?: string;
  limit?: number;
}): Promise<Sale[]> {
  let query = supabase
    .from("sales")
    .select("*, product:products(name)")
    .order("created_at", { ascending: false });

  if (options?.startDate) {
    query = query.gte("created_at", options.startDate);
  }
  if (options?.endDate) {
    query = query.lte("created_at", options.endDate);
  }
  if (options?.productId) {
    query = query.eq("product_id", options.productId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
  return data as Sale[];
}

/**
 * Delete a sale (soft undo — does NOT restore stock).
 */
export async function deleteSale(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("sales").delete().eq("id", id);

  if (error) {
    return { error: "Gagal menghapus penjualan" };
  }
  return { error: null };
}

/**
 * Get sales summary for dashboard.
 */
export async function getSalesSummary(): Promise<{
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  total_sold: number;
}> {
  const { data, error } = await supabase
    .from("sales")
    .select("total_revenue, total_cost, total_profit, quantity");

  if (error || !data) {
    return { total_revenue: 0, total_cost: 0, total_profit: 0, total_sold: 0 };
  }

  return {
    total_revenue: data.reduce((sum, s) => sum + Number(s.total_revenue), 0),
    total_cost: data.reduce((sum, s) => sum + Number(s.total_cost), 0),
    total_profit: data.reduce((sum, s) => sum + Number(s.total_profit), 0),
    total_sold: data.reduce((sum, s) => sum + Number(s.quantity), 0),
  };
}
