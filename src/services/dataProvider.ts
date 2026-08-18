import { supabase, isMissingCredentials } from "@/lib/supabase/client";
import type {
  Product,
  ProductFormData,
  Sale,
  CapitalTransaction,
  CapitalFormData,
  Expense,
  ExpenseFormData,
  Profile,
  AppSettings,
} from "@/types";

// Local storage keys
const STORAGE_KEYS = {
  PROFILE: "profitly_profile",
  PRODUCTS: "profitly_products",
  SALES: "profitly_sales",
  CAPITAL: "profitly_capital",
  EXPENSES: "profitly_expenses",
  SETTINGS: "profitly_settings_app",
  AUTH_USER: "profitly_demo_user",
};

// Helper for local storage
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("LocalStorage write error:", e);
  }
}

/**
 * Initialize demo data in LocalStorage if not existing
 */
export function seedDefaultProducts(userId = "demo-user-id"): Product[] {
  const existing = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  if (existing.length > 0) return existing;

  const now = new Date().toISOString();
  const initialProducts: Product[] = [
    {
      id: "prod-default-1",
      user_id: userId,
      name: "Pin Bros",
      description: "Pin bros custom design",
      type: "single",
      purchase_price: 3000,
      selling_price: 7000,
      stock: 100,
      total_sold: 0,
      tier_pricing: [
        { min_qty: 3, price: 18000, label: "Paket 3 pcs (Rp18.000)" },
      ],
      bundle_items: [],
      created_at: now,
      updated_at: now,
    },
    {
      id: "prod-default-2",
      user_id: userId,
      name: "Pin Tutup Botol",
      description: "Pin tutup botol berbagai ukuran",
      type: "single",
      purchase_price: 4000,
      selling_price: 8000,
      stock: 50,
      total_sold: 0,
      tier_pricing: [
        { min_qty: 3, price: 21000, label: "Paket 3 pcs (Rp21.000)" },
      ],
      bundle_items: [],
      created_at: now,
      updated_at: now,
    },
    {
      id: "prod-default-3",
      user_id: userId,
      name: "Stiker",
      description: "Stiker vinyl berkualitas tinggi",
      type: "single",
      purchase_price: 1000,
      selling_price: 7000,
      stock: 200,
      total_sold: 0,
      tier_pricing: [
        { min_qty: 2, price: 10000, label: "Beli 2 pcs (Rp10.000)" },
        { min_qty: 5, price: 22000, label: "Beli 5 pcs (Rp22.000)" },
      ],
      bundle_items: [],
      created_at: now,
      updated_at: now,
    },
    {
      id: "prod-default-4",
      user_id: userId,
      name: "Paket Kombo Hemat (1 Pin Bros + 1 Pin Botol + 2 Stiker)",
      description: "Paket bundling kombo lengkap hemat",
      type: "bundle",
      purchase_price: 9000,
      selling_price: 18000,
      stock: 50,
      total_sold: 0,
      tier_pricing: [],
      bundle_items: [
        {
          product_id: "prod-default-1",
          product_name: "Pin Bros",
          quantity: 1,
          purchase_price: 3000,
          selling_price: 7000,
        },
        {
          product_id: "prod-default-2",
          product_name: "Pin Tutup Botol",
          quantity: 1,
          purchase_price: 4000,
          selling_price: 8000,
        },
        {
          product_id: "prod-default-3",
          product_name: "Stiker",
          quantity: 2,
          purchase_price: 1000,
          selling_price: 7000,
        },
      ],
      created_at: now,
      updated_at: now,
    },
  ];

  setLocal(STORAGE_KEYS.PRODUCTS, initialProducts);

  // Also seed initial capital
  const capital: CapitalTransaction[] = [
    {
      id: "cap-default-1",
      user_id: userId,
      type: "initial_capital",
      amount: 1500000,
      description: "Modal Awal Bisnis",
      created_at: now,
    },
  ];
  setLocal(STORAGE_KEYS.CAPITAL, capital);

  return initialProducts;
}

// ==================== AUTH SERVICE ====================

export const authService = {
  async register(fullName: string, username: string, _password: string) {
    const cleanUsername = username.toLowerCase().trim();

    if (isMissingCredentials) {
      const demoProfile: Profile = {
        id: "demo-user-id",
        full_name: fullName,
        username: cleanUsername,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocal(STORAGE_KEYS.PROFILE, demoProfile);
      setLocal(STORAGE_KEYS.AUTH_USER, { id: "demo-user-id", email: `${cleanUsername}@cuancuy.app` });
      seedDefaultProducts("demo-user-id");
      return { user: demoProfile, error: null };
    }

    try {
      const email = `${cleanUsername}@cuancuy.app`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: _password,
        options: {
          data: { full_name: fullName, username: cleanUsername },
        },
      });

      if (authError) {
        return {
          user: null,
          error: authError.message.includes("already registered")
            ? "Username sudah digunakan, silakan pilih username lain atau login."
            : authError.message,
        };
      }

      if (!authData.user) return { user: null, error: "Gagal membuat akun." };

      // Upsert profile safely
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            full_name: fullName,
            username: cleanUsername,
          })
          .select()
          .single();

        if (profile) return { user: profile as Profile, error: null };
      } catch (err) {
        console.warn("Profile upsert handled by trigger:", err);
      }

      const fallbackProfile: Profile = {
        id: authData.user.id,
        full_name: fullName,
        username: cleanUsername,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { user: fallbackProfile, error: null };
    } catch (e: unknown) {
      const err = e as Error;
      return { user: null, error: err?.message || "Terjadi kesalahan jaringan." };
    }
  },

  async login(username: string, _password: string) {
    const cleanUsername = username.toLowerCase().trim();

    if (isMissingCredentials) {
      let profile = getLocal<Profile | null>(STORAGE_KEYS.PROFILE, null);
      if (!profile || profile.username !== cleanUsername) {
        profile = {
          id: "demo-user-id",
          full_name: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
          username: cleanUsername,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setLocal(STORAGE_KEYS.PROFILE, profile);
      }
      setLocal(STORAGE_KEYS.AUTH_USER, { id: "demo-user-id", email: `${cleanUsername}@cuancuy.app` });
      seedDefaultProducts("demo-user-id");
      return { error: null, profile };
    }

    try {
      const email = `${cleanUsername}@cuancuy.app`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: _password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("email not confirmed")) {
          return {
            error:
              "Email belum dikonfirmasi. Buka Supabase Dashboard > Authentication > Providers > Email, lalu MATIKAN (uncheck) opsi 'Confirm email'.",
          };
        }
        if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
          return {
            error:
              "Username belum terdaftar atau password salah. Karena database Supabase baru saja dihubungkan, silakan klik 'Daftar sekarang' untuk membuat akun pertama Anda.",
          };
        }
        return { error: error.message };
      }

      let profile = await this.getProfile(data.user.id);
      if (!profile) {
        profile = {
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || cleanUsername,
          username: cleanUsername,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return { error: null, profile };
    } catch (e: unknown) {
      const err = e as Error;
      return { error: err?.message || "Gagal masuk. Periksa koneksi internet." };
    }
  },

  async loginDemo() {
    const demoProfile: Profile = {
      id: "demo-user-id",
      full_name: "Feyy",
      username: "feyy",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocal(STORAGE_KEYS.PROFILE, demoProfile);
    setLocal(STORAGE_KEYS.AUTH_USER, { id: "demo-user-id", email: "feyy@cuancuy.app" });
    seedDefaultProducts("demo-user-id");
    return { error: null, profile: demoProfile };
  },

  async logout() {
    if (isMissingCredentials) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      return { error: null };
    }
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (isMissingCredentials) {
      return getLocal<Profile | null>(STORAGE_KEYS.PROFILE, null);
    }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) return null;
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Pick<Profile, "full_name" | "avatar_url">>) {
    if (isMissingCredentials) {
      const current = getLocal<Profile | null>(STORAGE_KEYS.PROFILE, null);
      if (current) {
        const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
        setLocal(STORAGE_KEYS.PROFILE, updated);
      }
      return { error: null };
    }
    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId);
    return { error: error ? "Gagal memperbarui profil." : null };
  },
};

// ==================== PRODUCTS SERVICE ====================

export const productService = {
  async getAll(): Promise<Product[]> {
    if (isMissingCredentials) {
      const prods = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      if (prods.length === 0) {
        return seedDefaultProducts();
      }
      return prods;
    }
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) return [];
    return data as Product[];
  },

  async create(formData: ProductFormData): Promise<{ data: Product | null; error: string | null }> {
    if (isMissingCredentials) {
      const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const isBundle = formData.type === "bundle";
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        user_id: "demo-user-id",
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        type: formData.type || "single",
        purchase_price: Number(formData.purchase_price) || 0,
        selling_price: Number(formData.selling_price) || 0,
        stock: Number(formData.stock) || 0,
        total_sold: 0,
        tier_pricing: isBundle ? [] : (formData.tier_pricing || []),
        bundle_items: isBundle ? (formData.bundle_items || []) : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      products.unshift(newProduct);
      setLocal(STORAGE_KEYS.PRODUCTS, products);
      return { data: newProduct, error: null };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Tidak terautentikasi" };

    const isBundle = formData.type === "bundle";
    const { data, error } = await supabase
      .from("products")
      .insert({
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        type: formData.type || "single",
        purchase_price: Number(formData.purchase_price) || 0,
        selling_price: Number(formData.selling_price) || 0,
        stock: Number(formData.stock) || 0,
        tier_pricing: isBundle ? [] : (formData.tier_pricing || []),
        bundle_items: isBundle ? (formData.bundle_items || []) : [],
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message.includes("duplicate") ? "Produk sudah ada" : "Gagal menambahkan produk" };
    }
    return { data: data as Product, error: null };
  },

  async update(id: string, updates: Partial<ProductFormData>): Promise<{ error: string | null }> {
    if (isMissingCredentials) {
      const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const index = products.findIndex((p) => p.id === id);
      if (index === -1) return { error: "Produk tidak ditemukan" };
      products[index] = {
        ...products[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      setLocal(STORAGE_KEYS.PRODUCTS, products);
      return { error: null };
    }

    const { error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);
    return { error: error ? "Gagal memperbarui produk" : null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    if (isMissingCredentials) {
      const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const filtered = products.filter((p) => p.id !== id);
      setLocal(STORAGE_KEYS.PRODUCTS, filtered);
      return { error: null };
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return { error: error.message.includes("foreign key") ? "Produk memiliki riwayat penjualan" : "Gagal menghapus produk" };
    }
    return { error: null };
  },

  async addStock(id: string, additionalStock: number): Promise<{ error: string | null }> {
    if (isMissingCredentials) {
      const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const product = products.find((p) => p.id === id);
      if (!product) return { error: "Produk tidak ditemukan" };
      product.stock += additionalStock;
      product.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.PRODUCTS, products);
      return { error: null };
    }

    const { data: product } = await supabase.from("products").select("stock").eq("id", id).single();
    if (!product) return { error: "Produk tidak ditemukan" };

    const { error } = await supabase
      .from("products")
      .update({ stock: product.stock + additionalStock, updated_at: new Date().toISOString() })
      .eq("id", id);
    return { error: error ? "Gagal menambah stok" : null };
  },
};

// ==================== SALES SERVICE ====================

export const salesService = {
  async createSale(
    productId: string,
    quantity: number,
    options?: {
      customSellingPrice?: number;
      customPurchasePrice?: number;
      bundle_info?: any;
    }
  ): Promise<{ data: Sale | null; error: string | null }> {
    if (quantity <= 0) return { data: null, error: "Jumlah penjualan minimal 1 pcs" };

    if (isMissingCredentials) {
      const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      const product = products.find((p) => p.id === productId);

      if (!product) return { data: null, error: "Produk tidak ditemukan" };

      // Handle Bundle Combo Sale (Deduct component stocks)
      if (product.type === "bundle" && product.bundle_items && product.bundle_items.length > 0) {
        // 1. Check stock for each component item
        for (const item of product.bundle_items) {
          const component = products.find((p) => p.id === item.product_id);
          const requiredStock = item.quantity * quantity;
          if (!component || component.stock < requiredStock) {
            return {
              data: null,
              error: `Stok komponen ${item.product_name} tidak mencukupi (Butuh ${requiredStock}, Tersedia ${component?.stock || 0})`,
            };
          }
        }

        // 2. Deduct component stocks
        for (const item of product.bundle_items) {
          const component = products.find((p) => p.id === item.product_id);
          if (component) {
            component.stock -= item.quantity * quantity;
            component.total_sold = (component.total_sold || 0) + item.quantity * quantity;
            component.updated_at = new Date().toISOString();
          }
        }

        product.stock = Math.max(0, product.stock - quantity);
        product.total_sold = (product.total_sold || 0) + quantity;
        product.updated_at = new Date().toISOString();
        setLocal(STORAGE_KEYS.PRODUCTS, products);

        const revenue = options?.customSellingPrice !== undefined
          ? options.customSellingPrice
          : product.selling_price * quantity;
        const cost = options?.customPurchasePrice !== undefined
          ? options.customPurchasePrice
          : product.purchase_price * quantity;
        const profit = revenue - cost;

        const newSale: Sale = {
          id: `sale-${Date.now()}`,
          user_id: "demo-user-id",
          product_id: productId,
          quantity,
          purchase_price: cost / quantity,
          selling_price: revenue / quantity,
          total_revenue: revenue,
          total_cost: cost,
          total_profit: profit,
          bundle_info: options?.bundle_info || {
            is_bundle: true,
            bundle_name: product.name,
            bundle_items: product.bundle_items,
          },
          created_at: new Date().toISOString(),
          product: { ...product },
        };

        const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, []);
        sales.unshift(newSale);
        setLocal(STORAGE_KEYS.SALES, sales);

        return { data: newSale, error: null };
      }

      // Handle Single Product Sale
      if (product.stock < quantity) {
        return { data: null, error: `Stok tidak mencukupi. Sisa stok: ${product.stock} pcs` };
      }

      // Decrement stock and increment total_sold
      product.stock -= quantity;
      product.total_sold = (product.total_sold || 0) + quantity;
      product.updated_at = new Date().toISOString();
      setLocal(STORAGE_KEYS.PRODUCTS, products);

      // Create snapshot sale record with custom bundle pricing support
      const revenue = options?.customSellingPrice !== undefined
        ? options.customSellingPrice
        : product.selling_price * quantity;
      const cost = options?.customPurchasePrice !== undefined
        ? options.customPurchasePrice
        : product.purchase_price * quantity;
      const profit = revenue - cost;

      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        user_id: "demo-user-id",
        product_id: productId,
        quantity,
        purchase_price: cost / quantity,
        selling_price: revenue / quantity,
        total_revenue: revenue,
        total_cost: cost,
        total_profit: profit,
        bundle_info: options?.bundle_info || null,
        created_at: new Date().toISOString(),
        product: { ...product },
      };

      const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, []);
      sales.unshift(newSale);
      setLocal(STORAGE_KEYS.SALES, sales);

      return { data: newSale, error: null };
    }

    try {
      // In Supabase mode, if it's a custom price or bundle sale
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: "Tidak terautentikasi" };

      const { data: product, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (fetchErr || !product) return { data: null, error: "Produk tidak ditemukan" };

      // Handle Bundle Combo Sale (Deduct component stocks in Supabase)
      if (product.type === "bundle" && product.bundle_items && product.bundle_items.length > 0) {
        for (const item of product.bundle_items) {
          const { data: comp } = await supabase.from("products").select("stock").eq("id", item.product_id).single();
          const req = item.quantity * quantity;
          if (!comp || comp.stock < req) {
            return { data: null, error: `Stok ${item.product_name} tidak cukup.` };
          }
        }

        for (const item of product.bundle_items) {
          const { data: comp } = await supabase.from("products").select("stock, total_sold").eq("id", item.product_id).single();
          if (comp) {
            await supabase
              .from("products")
              .update({
                stock: comp.stock - item.quantity * quantity,
                total_sold: (comp.total_sold || 0) + item.quantity * quantity,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.product_id);
          }
        }
      } else {
        if (product.stock < quantity) return { data: null, error: "Stok tidak mencukupi" };
        await supabase
          .from("products")
          .update({
            stock: product.stock - quantity,
            total_sold: (product.total_sold || 0) + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);
      }

      const revenue = options?.customSellingPrice !== undefined
        ? options.customSellingPrice
        : Number(product.selling_price) * quantity;
      const cost = options?.customPurchasePrice !== undefined
        ? options.customPurchasePrice
        : Number(product.purchase_price) * quantity;
      const profit = revenue - cost;

      const { data: saleData, error: saleErr } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          purchase_price: cost / quantity,
          selling_price: revenue / quantity,
          total_revenue: revenue,
          total_cost: cost,
          total_profit: profit,
          bundle_info: options?.bundle_info || null,
        })
        .select("*, product:products(*)")
        .single();

      if (saleErr) return { data: null, error: saleErr.message };
      return { data: saleData as Sale, error: null };
    } catch (e: unknown) {
      const err = e as Error;
      return { data: null, error: err?.message || "Gagal mencatat penjualan" };
    }
  },

  async getAll(): Promise<Sale[]> {
    if (isMissingCredentials) {
      const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, []);
      const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
      return sales.map((s) => ({
        ...s,
        product: s.product || products.find((p) => p.id === s.product_id),
      }));
    }

    const { data, error } = await supabase
      .from("sales")
      .select("*, product:products(*)")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data as Sale[];
  },

  async delete(id: string): Promise<{ error: string | null }> {
    if (isMissingCredentials) {
      const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, []);
      const filtered = sales.filter((s) => s.id !== id);
      setLocal(STORAGE_KEYS.SALES, filtered);
      return { error: null };
    }

    const { error } = await supabase.from("sales").delete().eq("id", id);
    return { error: error ? "Gagal menghapus transaksi" : null };
  },
};

// ==================== CAPITAL SERVICE ====================

export const capitalService = {
  async getAll(): Promise<CapitalTransaction[]> {
    if (isMissingCredentials) {
      return getLocal<CapitalTransaction[]>(STORAGE_KEYS.CAPITAL, []);
    }
    const { data, error } = await supabase
      .from("capital_transactions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return data as CapitalTransaction[];
  },

  async addTransaction(formData: CapitalFormData): Promise<{ data: CapitalTransaction | null; error: string | null }> {
    if (formData.amount <= 0) return { data: null, error: "Nominal harus lebih dari 0" };

    if (isMissingCredentials) {
      const items = getLocal<CapitalTransaction[]>(STORAGE_KEYS.CAPITAL, []);
      const newItem: CapitalTransaction = {
        id: `cap-${Date.now()}`,
        user_id: "demo-user-id",
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description?.trim() || null,
        created_at: new Date().toISOString(),
      };
      items.unshift(newItem);
      setLocal(STORAGE_KEYS.CAPITAL, items);
      return { data: newItem, error: null };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Tidak terautentikasi" };

    const { data, error } = await supabase
      .from("capital_transactions")
      .insert({
        user_id: user.id,
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description?.trim() || null,
      })
      .select()
      .single();

    if (error) return { data: null, error: "Gagal menambah transaksi modal" };
    return { data: data as CapitalTransaction, error: null };
  },
};

// ==================== EXPENSES SERVICE ====================

export const expenseService = {
  async getAll(): Promise<Expense[]> {
    if (isMissingCredentials) {
      return getLocal<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    }
    const { data, error } = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
    if (error) return [];
    return data as Expense[];
  },

  async addExpense(formData: ExpenseFormData): Promise<{ data: Expense | null; error: string | null }> {
    if (formData.amount <= 0) return { data: null, error: "Nominal harus lebih dari 0" };

    if (isMissingCredentials) {
      const expenses = getLocal<Expense[]>(STORAGE_KEYS.EXPENSES, []);
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        user_id: "demo-user-id",
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description?.trim() || null,
        created_at: new Date().toISOString(),
      };
      expenses.unshift(newExp);
      setLocal(STORAGE_KEYS.EXPENSES, expenses);
      return { data: newExp, error: null };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Tidak terautentikasi" };

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description?.trim() || null,
      })
      .select()
      .single();

    if (error) return { data: null, error: "Gagal mencatat pengeluaran" };
    return { data: data as Expense, error: null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    if (isMissingCredentials) {
      const expenses = getLocal<Expense[]>(STORAGE_KEYS.EXPENSES, []);
      setLocal(STORAGE_KEYS.EXPENSES, expenses.filter((e) => e.id !== id));
      return { error: null };
    }
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    return { error: error ? "Gagal menghapus pengeluaran" : null };
  },
};

// ==================== APP SETTINGS SERVICE ====================

export const settingsService = {
  async getSettings(): Promise<AppSettings | null> {
    if (isMissingCredentials) {
      return getLocal<AppSettings>(STORAGE_KEYS.SETTINGS, {
        id: "demo-settings",
        user_id: "demo-user-id",
        currency: "IDR",
        date_format: "dd/MM/yyyy",
        theme: "dark",
        low_stock_threshold: 10,
        notifications_enabled: true,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    const { data } = await supabase.from("app_settings").select("*").single();
    return data as AppSettings | null;
  },

  async resetAllData(): Promise<void> {
    if (isMissingCredentials) {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      localStorage.removeItem(STORAGE_KEYS.SALES);
      localStorage.removeItem(STORAGE_KEYS.CAPITAL);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES);
      seedDefaultProducts();
    }
  },
};
