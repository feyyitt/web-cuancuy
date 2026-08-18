import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Nama lengkap minimal 2 karakter")
      .max(50, "Nama lengkap maksimal 50 karakter"),
    username: z
      .string()
      .min(3, "Username minimal 3 karakter")
      .max(20, "Username maksimal 20 karakter")
      .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .max(50, "Password maksimal 50 karakter"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(100, "Nama produk terlalu panjang"),
  description: z.string().max(500, "Deskripsi terlalu panjang").optional(),
  purchase_price: z
    .number({ invalid_type_error: "Harga beli harus berupa angka" })
    .min(0, "Harga beli tidak boleh negatif"),
  selling_price: z
    .number({ invalid_type_error: "Harga jual harus berupa angka" })
    .min(0, "Harga jual tidak boleh negatif"),
  stock: z
    .number({ invalid_type_error: "Stok harus berupa angka" })
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif"),
});

export const saleSchema = z.object({
  product_id: z.string().min(1, "Pilih produk"),
  quantity: z
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .int("Jumlah harus bilangan bulat")
    .min(1, "Jumlah minimal 1"),
});

export const capitalSchema = z.object({
  type: z.enum(["initial_capital", "add_capital", "withdrawal"]),
  amount: z
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .min(1, "Jumlah minimal Rp1"),
  description: z.string().max(200, "Deskripsi terlalu panjang").optional(),
});

export const expenseSchema = z.object({
  category: z.string().min(1, "Kategori wajib diisi"),
  amount: z
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .min(1, "Jumlah minimal Rp1"),
  description: z.string().max(200, "Deskripsi terlalu panjang").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type CapitalInput = z.infer<typeof capitalSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
