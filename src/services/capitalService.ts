import { supabase } from "@/lib/supabase/client";
import type { CapitalTransaction, CapitalFormData } from "@/types";

/**
 * Add a capital transaction.
 */
export async function addCapitalTransaction(
  data: CapitalFormData
): Promise<{ data: CapitalTransaction | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Tidak terautentikasi" };

  const { data: transaction, error } = await supabase
    .from("capital_transactions")
    .insert({
      user_id: user.id,
      type: data.type,
      amount: data.amount,
      description: data.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Capital transaction error:", error);
    return { data: null, error: "Gagal menambah modal" };
  }
  return { data: transaction as CapitalTransaction, error: null };
}

/**
 * Fetch all capital transactions.
 */
export async function getCapitalTransactions(): Promise<CapitalTransaction[]> {
  const { data, error } = await supabase
    .from("capital_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching capital:", error);
    return [];
  }
  return data as CapitalTransaction[];
}

/**
 * Get capital summary.
 */
export async function getCapitalSummary(): Promise<{
  total_capital: number;
  total_added: number;
  total_withdrawn: number;
}> {
  const { data, error } = await supabase
    .from("capital_transactions")
    .select("type, amount");

  if (error || !data) {
    return { total_capital: 0, total_added: 0, total_withdrawn: 0 };
  }

  let totalAdded = 0;
  let totalWithdrawn = 0;

  for (const t of data) {
    const amount = Number(t.amount);
    if (t.type === "initial_capital" || t.type === "add_capital") {
      totalAdded += amount;
    } else if (t.type === "withdrawal") {
      totalWithdrawn += amount;
    }
  }

  return {
    total_capital: totalAdded - totalWithdrawn,
    total_added: totalAdded,
    total_withdrawn: totalWithdrawn,
  };
}
