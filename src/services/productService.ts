import { supabase } from "@/lib/supabase/client";
import type { Product, ProductFormData } from "@/types";

/**
 * Fetch all products for the current user.
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data as Product[];
}

/**
 * Create a new product.
 */
export async function createProduct(
  product: ProductFormData
): Promise<{ data: Product | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Tidak terautentikasi" };

  const { data, error } = await supabase
    .from("products")
    .insert({
      user_id: user.id,
      ...product,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate")) {
      return { data: null, error: "Produk dengan nama ini sudah ada" };
    }
    return { data: null, error: "Gagal menambahkan produk" };
  }
  return { data: data as Product, error: null };
}

/**
 * Update a product.
 */
export async function updateProduct(
  id: string,
  updates: Partial<ProductFormData>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: "Gagal memperbarui produk" };
  }
  return { error: null };
}

/**
 * Delete a product.
 */
export async function deleteProduct(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    if (error.message.includes("foreign key")) {
      return { error: "Produk ini memiliki riwayat penjualan dan tidak bisa dihapus" };
    }
    return { error: "Gagal menghapus produk" };
  }
  return { error: null };
}

/**
 * Add stock to a product.
 */
export async function addStock(
  id: string,
  additionalStock: number
): Promise<{ error: string | null }> {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", id)
    .single();

  if (fetchError || !product) {
    return { error: "Produk tidak ditemukan" };
  }

  const { error } = await supabase
    .from("products")
    .update({
      stock: (product as { stock: number }).stock + additionalStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "Gagal menambah stok" };
  }
  return { error: null };
}
