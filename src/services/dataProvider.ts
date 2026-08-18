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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: "Sesi login Anda tidak aktif. Silakan login kembali." };
      }

      const isBundle = formData.type === "bundle";
      const fullPayload: any = {
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        type: formData.type || "single",
        purchase_price: Number(formData.purchase_price) || 0,
        selling_price: Number(formData.selling_price) || 0,
        stock: Number(formData.stock) || 0,
        tier_pricing: isBundle ? [] : (formData.tier_pricing || []),
        bundle_items: isBundle ? (formData.bundle_items || []) : [],
      };

      const { data, error } = await supabase
        .from("products")
        .insert(fullPayload)
        .select()
        .single();

      if (error) {
        console.warn("Supabase full insert error, trying fallback:", error);

        // Fallback: If 'type', 'tier_pricing', or 'bundle_items' columns are not yet in user's Supabase DB
        if (
          error.message.includes("column") ||
          error.message.includes("does not exist") ||
          error.code === "42703" ||
          error.code === "PGRST204"
        ) {
          const basicPayload = {
            user_id: user.id,
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            purchase_price: Number(formData.purchase_price) || 0,
            selling_price: Number(formData.selling_price) || 0,
            stock: Number(formData.stock) || 0,
          };

          const { data: fbData, error: fbError } = await supabase
            .from("products")
            .insert(basicPayload)
            .select()
            .single();

          if (fbError) {
            return { data: null, error: fbError.message };
          }
          const createdWithMetadata: Product = {
            ...fbData,
            type: formData.type || "single",
            tier_pricing: formData.tier_pricing || [],
            bundle_items: formData.bundle_items || [],
          };
          return { data: createdWithMetadata, error: null };
        }

        if (error.message.includes("duplicate") || error.code === "23505") {
          return { data: null, error: "Nama produk sudah ada." };
        }

        return { data: null, error: error.message };
      }

      return { data: data as Product, error: null };
    } catch (e: unknown) {
      const err = e as Error;
      return { data: null, error: err?.message || "Gagal menambahkan produk" };
    }
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

    try {
      const isBundle = updates.type === "bundle";
      const fullPayload: any = {
        ...updates,
        purchase_price: updates.purchase_price !== undefined ? Number(updates.purchase_price) : undefined,
        selling_price: updates.selling_price !== undefined ? Number(updates.selling_price) : undefined,
        stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
        tier_pricing: isBundle ? [] : updates.tier_pricing,
        bundle_items: isBundle ? updates.bundle_items : [],
        updated_at: new Date().toISOString(),
      };

      // Strip undefined keys
      Object.keys(fullPayload).forEach((key) => fullPayload[key] === undefined && delete fullPayload[key]);

      const { error } = await supabase
        .from("products")
        .update(fullPayload)
        .eq("id", id);

      if (error) {
        console.warn("Supabase full update error, trying fallback:", error);
        if (
          error.message.includes("column") ||
          error.message.includes("does not exist") ||
          error.code === "42703" ||
          error.code === "PGRST204"
        ) {
          const { type, tier_pricing, bundle_items, ...basicPayload } = fullPayload;
          const { error: fbErr } = await supabase
            .from("products")
            .update(basicPayload)
            .eq("id", id);

          if (fbErr) return { error: fbErr.message };
          return { error: null };
        }
        return { error: error.message };
      }
      return { error: null };
    } catch (e: unknown) {
      const err = e as Error;
      return { error: err?.message || "Gagal memperbarui produk" };
    }
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

    const { data: product } = await supabase.from("products").select("stock").eq("id", id).maybeSingle();
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
      if (product.type === "bundle" && Array.isArray(product.bundle_items) && product.bundle_items.length > 0) {
        // 1. Check stock for each component item (if found)
        for (const item of product.bundle_items) {
          const component = products.find((p) => p.id === item.product_id);
          const requiredStock = item.quantity * quantity;
          if (component && component.stock < requiredStock) {
            return {
              data: null,
              error: `Stok komponen "${item.product_name}" tidak mencukupi (Butuh ${requiredStock}, Tersedia ${component.stock})`,
            };
          }
        }

        // 2. Deduct component stocks
        for (const item of product.bundle_items) {
          const component = products.find((p) => p.id === item.product_id);
          if (component) {
            component.stock = Math.max(0, component.stock - item.quantity * quantity);
            component.total_sold = (component.total_sold || 0) + item.quantity * quantity;
            component.updated_at = new Date().toISOString();
          }
        }

        product.stock = Math.max(0, (product.stock || 0) - quantity);
        product.total_sold = (product.total_sold || 0) + quantity;
        product.updated_at = new Date().toISOString();
        setLocal(STORAGE_KEYS.PRODUCTS, products);

        const revenue = options?.customSellingPrice !== undefined
          ? Number(options.customSellingPrice)
          : Number(product.selling_price) * quantity;
        const cost = options?.customPurchasePrice !== undefined
          ? Number(options.customPurchasePrice)
          : Number(product.purchase_price) * quantity;
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
        ? Number(options.customSellingPrice)
        : Number(product.selling_price) * quantity;
      const cost = options?.customPurchasePrice !== undefined
        ? Number(options.customPurchasePrice)
        : Number(product.purchase_price) * quantity;
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
      // 1. In Supabase mode, verify authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: "Sesi login berakhir. Silakan login kembali." };

      // 2. Fetch target product
      const { data: product, error: fetchErr } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (fetchErr || !product) return { data: null, error: "Produk tidak ditemukan" };

      // 3. Handle Bundle Combo Sale vs Single Product Stock Deductions
      if (product.type === "bundle" && Array.isArray(product.bundle_items) && product.bundle_items.length > 0) {
        for (const item of product.bundle_items) {
          const { data: comp } = await supabase.from("products").select("stock").eq("id", item.product_id).maybeSingle();
          const req = item.quantity * quantity;
          if (comp && comp.stock < req) {
            return {
              data: null,
              error: `Stok komponen "${item.product_name}" tidak cukup (Tersedia ${comp.stock}, Butuh ${req})`,
            };
          }
        }

        for (const item of product.bundle_items) {
          const { data: comp } = await supabase.from("products").select("stock, total_sold").eq("id", item.product_id).maybeSingle();
          if (comp) {
            await supabase
              .from("products")
              .update({
                stock: Math.max(0, comp.stock - item.quantity * quantity),
                total_sold: (comp.total_sold || 0) + item.quantity * quantity,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.product_id);
          }
        }

        // Deduct bundle stock
        await supabase
          .from("products")
          .update({
            stock: Math.max(0, (product.stock || 0) - quantity),
            total_sold: (product.total_sold || 0) + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);
      } else {
        if (product.stock < quantity) {
          return { data: null, error: `Stok tidak mencukupi (Tersedia ${product.stock} pcs, Diminta ${quantity} pcs)` };
        }

        await supabase
          .from("products")
          .update({
            stock: Math.max(0, product.stock - quantity),
            total_sold: (product.total_sold || 0) + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);
      }

      // 4. Calculate final revenues and costs
      const revenue = options?.customSellingPrice !== undefined
        ? Number(options.customSellingPrice)
        : Number(product.selling_price) * quantity;
      const cost = options?.customPurchasePrice !== undefined
        ? Number(options.customPurchasePrice)
        : Number(product.purchase_price) * quantity;
      const profit = revenue - cost;

      const salePayload: any = {
        user_id: user.id,
        product_id: productId,
        quantity,
        purchase_price: cost / quantity,
        selling_price: revenue / quantity,
        total_revenue: revenue,
        total_cost: cost,
        total_profit: profit,
        bundle_info: options?.bundle_info || null,
      };

      // Try inserting with bundle_info
      let insertedSale: any = null;
      const { data: saleData, error: saleErr } = await supabase
        .from("sales")
        .insert(salePayload)
        .select()
        .single();

      if (saleErr) {
        console.warn("Supabase sale insert with bundle_info failed, attempting fallback:", saleErr);
        // Fallback: if 'bundle_info' column doesn't exist yet on remote table
        if (
          saleErr.message.includes("column") ||
          saleErr.message.includes("does not exist") ||
          saleErr.code === "42703" ||
          saleErr.code === "PGRST204"
        ) {
          const { bundle_info, ...basicPayload } = salePayload;
          const { data: fbData, error: fbError } = await supabase
            .from("sales")
            .insert(basicPayload)
            .select()
            .single();

          if (fbError) {
            return { data: null, error: fbError.message };
          }
          insertedSale = fbData;
        } else {
          return { data: null, error: saleErr.message };
        }
      } else {
        insertedSale = saleData;
      }

      const completeSale: Sale = {
        ...insertedSale,
        product: { ...product },
      };

      return { data: completeSale, error: null };
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

    try {
      const [salesRes, prodsRes] = await Promise.all([
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*"),
      ]);

      if (salesRes.error) {
        console.error("Fetch sales error:", salesRes.error);
        return [];
      }

      const productsList = (prodsRes.data as Product[]) || [];
      const salesList = (salesRes.data as Sale[]) || [];

      return salesList.map((s) => ({
        ...s,
        product: productsList.find((p) => p.id === s.product_id) || undefined,
      }));
    } catch (e) {
      console.error("Error fetching sales:", e);
      return [];
    }
  },

  async delete(id: string): Promise<{ error: string | null }> {
    if (isMissingCredentials) {
      const sales = getLocal<Sale[]>(STORAGE_KEYS.SALES, []);
      const saleToDelete = sales.find((s) => s.id === id);

      if (saleToDelete) {
        // Restore stock to products
        const products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []);
        const product = products.find((p) => p.id === saleToDelete.product_id);

        if (product) {
          if (product.type === "bundle" && Array.isArray(product.bundle_items) && product.bundle_items.length > 0) {
            // Restore combo bundle component stocks
            for (const item of product.bundle_items) {
              const comp = products.find((p) => p.id === item.product_id);
              if (comp) {
                comp.stock += item.quantity * saleToDelete.quantity;
                comp.total_sold = Math.max(0, (comp.total_sold || 0) - item.quantity * saleToDelete.quantity);
                comp.updated_at = new Date().toISOString();
              }
            }
            product.stock += saleToDelete.quantity;
            product.total_sold = Math.max(0, (product.total_sold || 0) - saleToDelete.quantity);
          } else {
            // Restore single product stock
            product.stock += saleToDelete.quantity;
            product.total_sold = Math.max(0, (product.total_sold || 0) - saleToDelete.quantity);
          }
          product.updated_at = new Date().toISOString();
          setLocal(STORAGE_KEYS.PRODUCTS, products);
        }
      }

      const filtered = sales.filter((s) => s.id !== id);
      setLocal(STORAGE_KEYS.SALES, filtered);
      return { error: null };
    }

    try {
      // 1. In Supabase mode, fetch sale first to get product_id & quantity for stock restoration
      const { data: saleToDelete } = await supabase.from("sales").select("*").eq("id", id).single();

      if (saleToDelete) {
        const { data: product } = await supabase.from("products").select("*").eq("id", saleToDelete.product_id).single();
        if (product) {
          if (product.type === "bundle" && Array.isArray(product.bundle_items) && product.bundle_items.length > 0) {
            for (const item of product.bundle_items) {
              const { data: comp } = await supabase.from("products").select("stock, total_sold").eq("id", item.product_id).single();
              if (comp) {
                await supabase.from("products").update({
                  stock: comp.stock + item.quantity * saleToDelete.quantity,
                  total_sold: Math.max(0, (comp.total_sold || 0) - item.quantity * saleToDelete.quantity),
                  updated_at: new Date().toISOString(),
                }).eq("id", item.product_id);
              }
            }
            await supabase.from("products").update({
              stock: (product.stock || 0) + saleToDelete.quantity,
              total_sold: Math.max(0, (product.total_sold || 0) - saleToDelete.quantity),
              updated_at: new Date().toISOString(),
            }).eq("id", saleToDelete.product_id);
          } else {
            await supabase.from("products").update({
              stock: product.stock + saleToDelete.quantity,
              total_sold: Math.max(0, (product.total_sold || 0) - saleToDelete.quantity),
              updated_at: new Date().toISOString(),
            }).eq("id", saleToDelete.product_id);
          }
        }
      }

      const { error } = await supabase.from("sales").delete().eq("id", id);
      return { error: error ? error.message : null };
    } catch (e: unknown) {
      const err = e as Error;
      return { error: err?.message || "Gagal menghapus transaksi" };
    }
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

  async updateTransaction(
    id: string,
    updates: Partial<CapitalFormData>
  ): Promise<{ error: string | null }> {
    if (updates.amount !== undefined && updates.amount <= 0) {
      return { error: "Nominal harus lebih dari Rp0" };
    }

    if (isMissingCredentials) {
      const items = getLocal<CapitalTransaction[]>(STORAGE_KEYS.CAPITAL, []);
      const index = items.findIndex((c) => c.id === id);
      if (index === -1) return { error: "Transaksi modal tidak ditemukan" };
      items[index] = {
        ...items[index],
        ...updates,
        amount: updates.amount !== undefined ? Number(updates.amount) : items[index].amount,
      };
      setLocal(STORAGE_KEYS.CAPITAL, items);
      return { error: null };
    }

    const payload: any = { ...updates };
    if (updates.amount !== undefined) payload.amount = Number(updates.amount);
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;

    const { error } = await supabase
      .from("capital_transactions")
      .update(payload)
      .eq("id", id);

    return { error: error ? error.message : null };
  },

  async delete(id: string): Promise<{ error: string | null }> {
    if (isMissingCredentials) {
      const items = getLocal<CapitalTransaction[]>(STORAGE_KEYS.CAPITAL, []);
      setLocal(STORAGE_KEYS.CAPITAL, items.filter((c) => c.id !== id));
      return { error: null };
    }
    const { error } = await supabase.from("capital_transactions").delete().eq("id", id);
    return { error: error ? error.message : null };
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
