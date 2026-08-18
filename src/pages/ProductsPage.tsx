import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productService, seedDefaultProducts } from "@/services/dataProvider";
import { useProductStore } from "@/stores/productStore";
import { formatCurrency, formatNumber } from "@/utils/currency";
import { calculateProfitPerPiece, calculateMargin, formatMargin, calculateBundleMetrics } from "@/utils/calculations";
import type { Product, ProductFormData, TierPricing, BundleItem } from "@/types";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  PlusCircle,
  AlertTriangle,
  X,
  Tag,
  Boxes,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export function ProductsPage() {
  const { products, setProducts, addProduct, updateProduct, removeProduct, isLoading, setLoading } =
    useProductStore();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "profit" | "margin" | "stock" | "sold">("name");
  const [stockFilter, setStockFilter] = useState<"all" | "single" | "bundle" | "low" | "in_stock">("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    type: "single",
    purchase_price: 3000,
    selling_price: 7000,
    stock: 50,
    tier_pricing: [],
    bundle_items: [],
  });

  // Helper state for adding items to combo bundle
  const [bundlePickerMode, setBundlePickerMode] = useState<"existing" | "custom">("existing");
  const [selectedBundleProdId, setSelectedBundleProdId] = useState<string>("");
  const [bundleItemQty, setBundleItemQty] = useState<number>(1);

  // Quick custom item adding on the fly
  const [customItemName, setCustomItemName] = useState("");
  const [customItemHpp, setCustomItemHpp] = useState(2000);
  const [customItemSell, setCustomItemSell] = useState(5000);
  const [customItemQty, setCustomItemQty] = useState(1);
  const [saveAsSingleCatalog, setSaveAsSingleCatalog] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      if (!data || data.length === 0) {
        const seeded = seedDefaultProducts();
        setProducts(seeded);
      } else {
        setProducts(data);
      }
    } catch (e) {
      console.error("Error loading products:", e);
      const seeded = seedDefaultProducts();
      setProducts(seeded);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter available single products for bundle picker
  const singleProducts = useMemo(() => {
    return products.filter((p) => p.type !== "bundle");
  }, [products]);

  const handleOpenAdd = (defaultType: "single" | "bundle" = "single") => {
    setFormData({
      name: "",
      description: "",
      type: defaultType,
      purchase_price: defaultType === "single" ? 3000 : 0,
      selling_price: defaultType === "single" ? 7000 : 0,
      stock: 50,
      tier_pricing: defaultType === "single" ? [{ min_qty: 2, price: 10000, label: "Paket 2 pcs" }] : [],
      bundle_items: [],
    });
    setSelectedBundleProdId(singleProducts[0]?.id || "");
    setBundleItemQty(1);
    setBundlePickerMode("existing");
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || "",
      type: p.type || "single",
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      stock: p.stock,
      tier_pricing: p.tier_pricing ? [...p.tier_pricing] : [],
      bundle_items: p.bundle_items ? [...p.bundle_items] : [],
    });
    setSelectedBundleProdId(singleProducts[0]?.id || "");
    setBundleItemQty(1);
    setBundlePickerMode("existing");
  };

  // Quick Preset Tier Helper
  const handleApplyQuickTier = (qty: number, discountPercent: number) => {
    const normalTotal = formData.selling_price * qty;
    const promoPrice = Math.round((normalTotal * (1 - discountPercent / 100)) / 1000) * 1000;
    const currentTiers = formData.tier_pricing || [];

    const existingIdx = currentTiers.findIndex((t) => t.min_qty === qty);
    let updated: TierPricing[];
    if (existingIdx >= 0) {
      updated = [...currentTiers];
      updated[existingIdx] = {
        min_qty: qty,
        price: promoPrice,
        label: `Beli ${qty} pcs (Diskon ${discountPercent}%)`,
      };
    } else {
      updated = [
        ...currentTiers,
        {
          min_qty: qty,
          price: promoPrice,
          label: `Beli ${qty} pcs (Diskon ${discountPercent}%)`,
        },
      ];
      updated.sort((a, b) => a.min_qty - b.min_qty);
    }
    setFormData({ ...formData, tier_pricing: updated });
    toast.success(`Promo Tier ${qty} pcs ditambahkan!`);
  };

  // Add tier rule for single product
  const handleAddTier = () => {
    const currentTiers = formData.tier_pricing || [];
    const nextQty = currentTiers.length > 0 ? Math.max(...currentTiers.map((t) => t.min_qty)) + 2 : 2;
    const nextPrice = nextQty * formData.selling_price * 0.85; // default 15% discount
    setFormData({
      ...formData,
      tier_pricing: [
        ...currentTiers,
        {
          min_qty: nextQty,
          price: Math.round(nextPrice / 1000) * 1000,
          label: `Paket ${nextQty} pcs`,
        },
      ],
    });
  };

  const handleRemoveTier = (index: number) => {
    const currentTiers = formData.tier_pricing || [];
    setFormData({
      ...formData,
      tier_pricing: currentTiers.filter((_, i) => i !== index),
    });
  };

  const handleUpdateTier = (index: number, field: keyof TierPricing, value: any) => {
    const currentTiers = [...(formData.tier_pricing || [])];
    currentTiers[index] = { ...currentTiers[index], [field]: value };
    setFormData({ ...formData, tier_pricing: currentTiers });
  };

  // Add component item from existing catalog to combo bundle
  const handleAddBundleItem = () => {
    if (!selectedBundleProdId) return;
    const prod = products.find((p) => p.id === selectedBundleProdId);
    if (!prod) return;

    const currentItems = formData.bundle_items || [];
    const existingIndex = currentItems.findIndex((it) => it.product_id === selectedBundleProdId);

    let updatedItems: BundleItem[];
    if (existingIndex >= 0) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex].quantity += Number(bundleItemQty) || 1;
    } else {
      updatedItems = [
        ...currentItems,
        {
          product_id: prod.id,
          product_name: prod.name,
          quantity: Number(bundleItemQty) || 1,
          purchase_price: prod.purchase_price,
          selling_price: prod.selling_price,
        },
      ];
    }

    const totalCost = updatedItems.reduce((acc, it) => acc + it.purchase_price * it.quantity, 0);
    const totalNormal = updatedItems.reduce((acc, it) => acc + it.selling_price * it.quantity, 0);

    setFormData({
      ...formData,
      bundle_items: updatedItems,
      purchase_price: totalCost,
      selling_price: formData.selling_price > 0 ? formData.selling_price : Math.round((totalNormal * 0.85) / 1000) * 1000,
    });
    setBundleItemQty(1);
    toast.success(`"${prod.name}" dimasukkan ke dalam paket kombo`);
  };

  // Add new custom item on the fly to combo bundle
  const handleAddCustomBundleItem = async () => {
    if (!customItemName.trim()) {
      toast.error("Nama barang wajib diisi");
      return;
    }

    let assignedProdId = `custom-item-${Date.now()}`;

    // If user selected to also save to product catalog
    if (saveAsSingleCatalog) {
      const res = await productService.create({
        name: customItemName.trim(),
        description: "Komponen produk satuan",
        type: "single",
        purchase_price: Number(customItemHpp) || 0,
        selling_price: Number(customItemSell) || 0,
        stock: 50,
        tier_pricing: [],
        bundle_items: [],
      });

      if (res.data) {
        addProduct(res.data);
        assignedProdId = res.data.id;
      }
    }

    const newItem: BundleItem = {
      product_id: assignedProdId,
      product_name: customItemName.trim(),
      quantity: Number(customItemQty) || 1,
      purchase_price: Number(customItemHpp) || 0,
      selling_price: Number(customItemSell) || 0,
    };

    const currentItems = formData.bundle_items || [];
    const updatedItems = [...currentItems, newItem];

    const totalCost = updatedItems.reduce((acc, it) => acc + it.purchase_price * it.quantity, 0);
    const totalNormal = updatedItems.reduce((acc, it) => acc + it.selling_price * it.quantity, 0);

    setFormData({
      ...formData,
      bundle_items: updatedItems,
      purchase_price: totalCost,
      selling_price: formData.selling_price > 0 ? formData.selling_price : Math.round((totalNormal * 0.85) / 1000) * 1000,
    });

    setCustomItemName("");
    setCustomItemQty(1);
    toast.success(`Barang baru "${newItem.product_name}" berhasil ditambahkan ke paket kombo!`);
  };

  const handleRemoveBundleItem = (index: number) => {
    const currentItems = formData.bundle_items || [];
    const updatedItems = currentItems.filter((_, i) => i !== index);
    const totalCost = updatedItems.reduce((acc, it) => acc + it.purchase_price * it.quantity, 0);

    setFormData({
      ...formData,
      bundle_items: updatedItems,
      purchase_price: totalCost,
    });
  };

  // Auto calculate max bundle stock from component inventory
  const maxPossibleBundleStock = useMemo(() => {
    if (!formData.bundle_items || formData.bundle_items.length === 0) return 0;
    let minStock = Infinity;
    for (const it of formData.bundle_items) {
      const comp = products.find((p) => p.id === it.product_id);
      if (comp) {
        const available = Math.floor(comp.stock / (it.quantity || 1));
        if (available < minStock) minStock = available;
      }
    }
    return minStock === Infinity ? 50 : minStock;
  }, [formData.bundle_items, products]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama produk / paket wajib diisi");
      return;
    }
    if (formData.type === "bundle" && (!formData.bundle_items || formData.bundle_items.length === 0)) {
      toast.error("Paket Kombo harus memiliki minimal 1 barang di dalamnya");
      return;
    }
    if (formData.purchase_price < 0 || formData.selling_price < 0) {
      toast.error("Harga tidak boleh bernilai negatif");
      return;
    }

    if (editingProduct) {
      const res = await productService.update(editingProduct.id, formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        updateProduct({
          ...editingProduct,
          ...formData,
          updated_at: new Date().toISOString(),
        });
        toast.success(`Produk "${formData.name}" berhasil diperbarui`);
        setEditingProduct(null);
        loadProducts();
      }
    } else {
      const res = await productService.create(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        if (res.data) {
          addProduct(res.data);
        } else {
          loadProducts();
        }
        toast.success(`Produk "${formData.name}" berhasil ditambahkan`);
        setIsAddModalOpen(false);
        loadProducts();
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    const res = await productService.delete(deletingProduct.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      removeProduct(deletingProduct.id);
      toast.success(`Produk "${deletingProduct.name}" berhasil dihapus`);
      setDeletingProduct(null);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingProduct) return;
    if (restockAmount <= 0) {
      toast.error("Jumlah tambahan stok harus lebih dari 0");
      return;
    }

    const res = await productService.addStock(restockingProduct.id, restockAmount);
    if (res.error) {
      toast.error(res.error);
    } else {
      updateProduct({
        ...restockingProduct,
        stock: restockingProduct.stock + restockAmount,
        updated_at: new Date().toISOString(),
      });
      toast.success(`Stok "${restockingProduct.name}" bertambah +${restockAmount} pcs`);
      setRestockingProduct(null);
      setRestockAmount(10);
    }
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (stockFilter === "single") return p.type !== "bundle";
        if (stockFilter === "bundle") return p.type === "bundle";
        if (stockFilter === "low") return p.stock <= 10;
        if (stockFilter === "in_stock") return p.stock > 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "stock") return a.stock - b.stock;
        if (sortBy === "sold") return (b.total_sold || 0) - (a.total_sold || 0);
        if (sortBy === "profit") {
          const profitA = calculateProfitPerPiece(a.purchase_price, a.selling_price);
          const profitB = calculateProfitPerPiece(b.purchase_price, b.selling_price);
          return profitB - profitA;
        }
        if (sortBy === "margin") {
          const marginA = calculateMargin(a.purchase_price, a.selling_price);
          const marginB = calculateMargin(b.purchase_price, b.selling_price);
          return marginB - marginA;
        }
        return 0;
      });
  }, [products, search, stockFilter, sortBy]);

  // Calculations for bundle preview
  const bundleMetrics = useMemo(() => {
    if (formData.type !== "bundle" || !formData.bundle_items) return null;
    return calculateBundleMetrics(formData.bundle_items, formData.selling_price);
  }, [formData.type, formData.bundle_items, formData.selling_price]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Daftar Produk & Paket</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Kelola produk satuan, aturan harga bundling multi-pcs, dan paket kombo campuran.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAdd("bundle")}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-elevated hover:border-emerald/40 transition-colors cursor-pointer"
          >
            <Boxes className="h-4 w-4 text-emerald" />
            <span>+ Buat Paket Kombo</span>
          </button>
          <button
            onClick={() => handleOpenAdd("single")}
            className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk atau paket kombo..."
            className="w-full rounded-xl border border-border bg-elevated pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-elevated px-3 py-2 text-xs font-semibold text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
          >
            <option value="all">Semua ({products.length})</option>
            <option value="single">🏷️ Produk Satuan</option>
            <option value="bundle">📦 Paket Kombo</option>
            <option value="low">⚠️ Stok Menipis (≤10)</option>
            <option value="in_stock">✅ Ada Stok</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-border bg-elevated px-3 py-2 text-xs font-semibold text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
          >
            <option value="name">Urut: Nama A-Z</option>
            <option value="profit">Urut: Keuntungan Tertinggi</option>
            <option value="margin">Urut: Margin % Tertinggi</option>
            <option value="stock">Urut: Stok Paling Sedikit</option>
            <option value="sold">Urut: Paling Banyak Terjual</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-text-muted">Memuat daftar produk...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <div className="rounded-2xl bg-elevated p-4">
            <Package className="h-8 w-8 text-text-muted" />
          </div>
          <p className="mt-3 text-sm font-semibold text-text-primary">Tidak ada produk ditemukan</p>
          <p className="mt-1 text-xs text-text-muted">
            Coba ubah kata kunci pencarian atau buat produk baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => {
            const isCombo = p.type === "bundle";
            const profit = calculateProfitPerPiece(p.purchase_price, p.selling_price);
            const margin = calculateMargin(p.purchase_price, p.selling_price);
            const hasTiers = !isCombo && p.tier_pricing && p.tier_pricing.length > 0;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border bg-card p-5 transition-all flex flex-col justify-between hover:shadow-lg ${
                  isCombo ? "border-emerald/40 bg-gradient-to-b from-emerald/5 to-card" : "border-border"
                }`}
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isCombo ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-2.5 py-0.5 text-xs font-bold text-emerald border border-emerald/30">
                          <Boxes className="h-3 w-3" />
                          Paket Kombo
                        </span>
                      ) : hasTiers ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-0.5 text-xs font-bold text-amber border border-amber/30">
                          <Tag className="h-3 w-3" />
                          Promo Multi-Buy
                        </span>
                      ) : (
                        <span className="rounded-full bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-muted border border-border">
                          Satuan
                        </span>
                      )}

                      {p.stock <= 5 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-bold text-error border border-error/30">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Sisa {p.stock}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        title="Edit Produk"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-elevated hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(p)}
                        title="Hapus Produk"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Product Title & Description */}
                  <h3 className="mt-3 text-base font-bold text-text-primary tracking-tight">{p.name}</h3>
                  {p.description && (
                    <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{p.description}</p>
                  )}

                  {/* If Combo Bundle: Contents Preview */}
                  {isCombo && p.bundle_items && p.bundle_items.length > 0 && (
                    <div className="mt-3 rounded-xl bg-elevated/60 p-2.5 border border-border/80 space-y-1">
                      <span className="text-[10px] font-bold text-emerald uppercase tracking-wider block">
                        Isi Dalam Paket:
                      </span>
                      {p.bundle_items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-text-secondary">
                          <span>• {it.quantity}x {it.product_name}</span>
                          <span className="text-text-muted text-[11px]">
                            ({formatCurrency(it.purchase_price * it.quantity)})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* If Single Product: Tier Pricing Chips */}
                  {hasTiers && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.tier_pricing?.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-amber/10 border border-amber/20 px-2 py-0.5 text-[11px] font-semibold text-amber"
                        >
                          Beli {t.min_qty} pcs: {formatCurrency(t.price)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price & Profit Details */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-elevated/40 p-3 border border-border text-xs">
                    <div>
                      <span className="text-text-muted block text-[11px]">Modal Pokok (HPP):</span>
                      <strong className="text-text-primary tabular-nums font-semibold">
                        {formatCurrency(p.purchase_price)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[11px]">
                        {isCombo ? "Harga Jual Paket:" : "Harga Jual / pcs:"}
                      </span>
                      <strong className="text-text-primary tabular-nums font-bold">
                        {formatCurrency(p.selling_price)}
                      </strong>
                    </div>
                    <div className="col-span-2 border-t border-border/60 pt-2 flex items-center justify-between">
                      <span className="text-text-muted text-[11px]">Laba Bersih:</span>
                      <strong className="text-emerald font-bold tabular-nums">
                        +{formatCurrency(profit)} ({formatMargin(margin)})
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Stock & Quick Restock */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-text-muted">Stok: </span>
                    <strong className="font-bold text-text-primary">{p.stock}</strong>
                    <span className="text-text-muted"> {isCombo ? "paket" : "pcs"}</span>
                  </div>

                  <button
                    onClick={() => {
                      setRestockingProduct(p);
                      setRestockAmount(10);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald hover:text-emerald-hover cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+ Tambah Stok</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      <AnimatePresence>
        {(isAddModalOpen || editingProduct) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  {formData.type === "bundle" ? (
                    <Boxes className="h-5 w-5 text-emerald" />
                  ) : (
                    <Package className="h-5 w-5 text-emerald" />
                  )}
                  {editingProduct
                    ? `Edit: ${editingProduct.name}`
                    : formData.type === "bundle"
                    ? "Buat Paket Kombo Campuran"
                    : "Tambah Produk Satuan"}
                </h3>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-lg p-1 text-text-muted hover:bg-elevated hover:text-text-primary cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Product Type Selector (Single vs Combo Bundle) */}
              {!editingProduct && (
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-elevated/70 p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: "single",
                        purchase_price: 3000,
                        selling_price: 7000,
                        bundle_items: [],
                      })
                    }
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.type === "single"
                        ? "bg-card text-emerald shadow-xs border border-border"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    <span>Produk Satuan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: "bundle",
                        tier_pricing: [],
                        purchase_price: 0,
                        selling_price: 0,
                      })
                    }
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.type === "bundle"
                        ? "bg-card text-emerald shadow-xs border border-border"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <Boxes className="h-4 w-4" />
                    <span>📦 Paket Kombo Campuran</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                    {formData.type === "bundle" ? "Nama Paket Kombo" : "Nama Produk"}{" "}
                    <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={
                      formData.type === "bundle"
                        ? "Contoh: Paket Hemat Stiker + Pin Bros"
                        : "Contoh: Stiker Vinyl / Pin Bros 44mm"
                    }
                    required
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                    Deskripsi / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Termasuk 1 Pin Bros dan 2 Stiker Custom"
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none transition-colors"
                  />
                </div>

                {/* ================= IF COMBO BUNDLE: SELECT / CREATE COMPONENT ITEMS ================= */}
                {formData.type === "bundle" && (
                  <div className="rounded-xl border border-emerald/30 bg-emerald/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald uppercase tracking-wider flex items-center gap-1.5">
                        <Boxes className="h-4 w-4" />
                        Komponen Isi Paket Kombo
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {formData.bundle_items?.length || 0} barang terpilih
                      </span>
                    </div>

                    {/* Sub Tab: Existing Catalog vs Custom Add */}
                    <div className="grid grid-cols-2 gap-1 bg-elevated/80 p-1 rounded-xl border border-border">
                      <button
                        type="button"
                        onClick={() => setBundlePickerMode("existing")}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          bundlePickerMode === "existing"
                            ? "bg-card text-emerald shadow-xs"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        Pilih dari Produk Ada
                      </button>
                      <button
                        type="button"
                        onClick={() => setBundlePickerMode("custom")}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          bundlePickerMode === "custom"
                            ? "bg-card text-emerald shadow-xs"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        + Tambah Barang Baru
                      </button>
                    </div>

                    {/* Mode 1: Choose from Existing Products */}
                    {bundlePickerMode === "existing" && (
                      <div className="flex gap-2 items-center">
                        {singleProducts.length === 0 ? (
                          <p className="text-xs text-text-muted py-1 flex-1">
                            Belum ada produk satuan di katalog. Gunakan tab "+ Tambah Barang Baru" di sebelah.
                          </p>
                        ) : (
                          <>
                            <select
                              value={selectedBundleProdId}
                              onChange={(e) => setSelectedBundleProdId(e.target.value)}
                              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
                            >
                              {singleProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Modal: {formatCurrency(p.purchase_price)}, Jual: {formatCurrency(p.selling_price)})
                                </option>
                              ))}
                            </select>

                            <div className="w-20">
                              <input
                                type="number"
                                min="1"
                                value={bundleItemQty}
                                onChange={(e) => setBundleItemQty(Math.max(1, Number(e.target.value)))}
                                className="w-full rounded-xl border border-border bg-card px-2.5 py-2 text-xs text-center font-bold text-text-primary focus:border-emerald focus:outline-none"
                                placeholder="Qty"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleAddBundleItem}
                              className="rounded-xl bg-emerald px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-hover transition-colors cursor-pointer whitespace-nowrap"
                            >
                              + Masukkan
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Mode 2: Quick Create New Item On The Fly */}
                    {bundlePickerMode === "custom" && (
                      <div className="rounded-xl bg-card p-3 border border-border space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                            Nama Barang Baru
                          </label>
                          <input
                            type="text"
                            value={customItemName}
                            onChange={(e) => setCustomItemName(e.target.value)}
                            placeholder="Misal: Pin Bros 44mm / Gantungan Kunci"
                            className="w-full rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs text-text-primary focus:border-emerald focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                              Modal HPP (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={customItemHpp === 0 ? "" : customItemHpp}
                              onChange={(e) => setCustomItemHpp(Math.max(0, Number(e.target.value)))}
                              className="w-full rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs font-semibold tabular-nums focus:border-emerald focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                              Harga Satuan (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={customItemSell === 0 ? "" : customItemSell}
                              onChange={(e) => setCustomItemSell(Math.max(0, Number(e.target.value)))}
                              className="w-full rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs font-semibold tabular-nums focus:border-emerald focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                              Jumlah di Paket
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={customItemQty}
                              onChange={(e) => setCustomItemQty(Math.max(1, Number(e.target.value)))}
                              className="w-full rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs font-bold text-center focus:border-emerald focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveAsSingleCatalog}
                              onChange={(e) => setSaveAsSingleCatalog(e.target.checked)}
                              className="rounded border-border text-emerald focus:ring-emerald cursor-pointer"
                            />
                            <span>Simpan ke katalog produk satuan</span>
                          </label>

                          <button
                            type="button"
                            onClick={handleAddCustomBundleItem}
                            className="rounded-lg bg-emerald px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-hover transition-colors cursor-pointer"
                          >
                            + Tambahkan ke Paket
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Selected Component Items List */}
                    <div className="space-y-1.5 pt-1">
                      {formData.bundle_items && formData.bundle_items.length > 0 ? (
                        formData.bundle_items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-card p-2.5 border border-border text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald/10 font-bold text-emerald text-[11px]">
                                {it.quantity}x
                              </span>
                              <strong className="text-text-primary">{it.product_name}</strong>
                              <span className="text-text-muted text-[11px]">
                                (Modal: {formatCurrency(it.purchase_price * it.quantity)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveBundleItem(idx)}
                              className="text-text-muted hover:text-error transition-colors p-1 cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-text-muted text-center py-2">
                          Pilih produk atau ketik barang baru di atas lalu klik "+ Masukkan".
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      {formData.type === "bundle" ? "Total Modal Pokok Paket (Rp)" : "Harga Beli / pcs (Rp)"}{" "}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={formData.type === "bundle"}
                      value={formData.purchase_price === 0 ? "" : formData.purchase_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchase_price: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="0"
                      required
                      className={`w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none transition-colors ${
                        formData.type === "bundle" ? "opacity-75 cursor-not-allowed bg-elevated/40" : ""
                      }`}
                    />
                    {formData.type === "bundle" && (
                      <span className="text-[10px] text-text-muted mt-0.5 block">
                        Otomatis dihitung dari total harga beli barang di dalamnya.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      {formData.type === "bundle" ? "Harga Jual Paket Bundling (Rp)" : "Harga Jual Satuan / pcs (Rp)"}{" "}
                      <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.selling_price === 0 ? "" : formData.selling_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          selling_price: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="0"
                      required
                      className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Live Profit Preview Box */}
                {formData.type === "bundle" && bundleMetrics ? (
                  <div className="rounded-xl bg-elevated/80 p-3.5 border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Harga Normal Satuan (Total):</span>
                      <span className="font-semibold text-text-secondary line-through tabular-nums">
                        {formatCurrency(bundleMetrics.totalNormalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald font-semibold">Harga Paket Bundling:</span>
                      <strong className="text-sm font-bold text-emerald tabular-nums">
                        {formatCurrency(formData.selling_price)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t border-border/60 pt-1.5">
                      <span className="text-text-muted">Keuntungan Bersih Paket:</span>
                      <strong className="text-emerald font-bold tabular-nums">
                        +{formatCurrency(bundleMetrics.bundleProfit)} ({formatMargin(bundleMetrics.margin)})
                      </strong>
                    </div>
                    {bundleMetrics.discountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-amber font-semibold">
                        <span>Hemat Pembeli:</span>
                        <span>
                          Diskon {formatCurrency(bundleMetrics.discountAmount)} ({bundleMetrics.discountPercent.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-elevated/50 p-3 flex items-center justify-between text-xs border border-border">
                    <span className="text-text-muted">Keuntungan Satuan:</span>
                    <strong className="text-emerald font-bold tabular-nums">
                      +{formatCurrency(calculateProfitPerPiece(formData.purchase_price, formData.selling_price))} (
                      {formatMargin(calculateMargin(formData.purchase_price, formData.selling_price))})
                    </strong>
                  </div>
                )}

                {/* Stock Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-text-secondary uppercase">
                      {formData.type === "bundle" ? "Stok Paket Kombo Siap Jual" : "Jumlah Stok (pcs)"}{" "}
                      <span className="text-error">*</span>
                    </label>
                    {formData.type === "bundle" && maxPossibleBundleStock > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, stock: maxPossibleBundleStock })}
                        className="text-[11px] text-emerald font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Samakan Stok Komponen ({maxPossibleBundleStock} paket)</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={formData.stock === 0 ? "" : formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      })
                    }
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none transition-colors"
                  />
                  {formData.type === "bundle" && (
                    <span className="text-[10px] text-text-muted mt-0.5 block">
                      Catatan: Saat paket terjual, stok masing-masing komponen produk juga akan otomatis berkurang.
                    </span>
                  )}
                </div>

                {/* ================= IF SINGLE PRODUCT: TIER / QUANTITY BUNDLING ================= */}
                {formData.type === "single" && (
                  <div className="rounded-xl border border-border bg-elevated/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Tag className="h-4 w-4 text-amber" />
                          Aturan Promo Bundling / Grosir (Opsional)
                        </h4>
                        <p className="text-[11px] text-text-muted">
                          Contoh: Satuan Rp7.000, tapi beli 2 pcs dapat Rp10.000.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTier}
                        className="rounded-lg bg-emerald/10 border border-emerald/20 px-2.5 py-1 text-xs font-bold text-emerald hover:bg-emerald/20 transition-colors cursor-pointer"
                      >
                        + Tambah Tier
                      </button>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-text-muted uppercase font-bold py-1 mr-1">Rekomendasi:</span>
                      {[
                        { qty: 2, disc: 15 },
                        { qty: 3, disc: 20 },
                        { qty: 5, disc: 25 },
                        { qty: 10, disc: 30 },
                        { qty: 12, disc: 35 },
                      ].map(({ qty, disc }) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => handleApplyQuickTier(qty, disc)}
                          className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-text-secondary hover:text-emerald hover:border-emerald/40 transition-colors cursor-pointer"
                        >
                          + Beli {qty} pcs (-{disc}%)
                        </button>
                      ))}
                    </div>

                    {formData.tier_pricing && formData.tier_pricing.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {formData.tier_pricing.map((tier, idx) => {
                          const normalTotal = formData.selling_price * tier.min_qty;
                          const savings = Math.max(0, normalTotal - tier.price);
                          const profit = tier.price - formData.purchase_price * tier.min_qty;

                          return (
                            <div
                              key={idx}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-card p-3 border border-border"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-xs font-bold text-text-muted uppercase whitespace-nowrap">
                                  Beli:
                                </span>
                                <input
                                  type="number"
                                  min="2"
                                  value={tier.min_qty === 0 ? "" : tier.min_qty}
                                  onChange={(e) =>
                                    handleUpdateTier(idx, "min_qty", Math.max(2, Number(e.target.value)))
                                  }
                                  className="w-16 rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-center font-bold text-text-primary focus:border-emerald focus:outline-none"
                                />
                                <span className="text-xs text-text-muted font-semibold">pcs =</span>

                                <div className="flex-1 min-w-[120px]">
                                  <input
                                    type="number"
                                    min="0"
                                    value={tier.price === 0 ? "" : tier.price}
                                    onChange={(e) =>
                                      handleUpdateTier(idx, "price", Math.max(0, Number(e.target.value)))
                                    }
                                    placeholder="Total Rp"
                                    className="w-full rounded-lg border border-border bg-elevated px-2.5 py-1 text-xs font-bold text-emerald focus:border-emerald focus:outline-none tabular-nums"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                <div className="text-right text-[11px]">
                                  <span className="text-emerald font-semibold block">
                                    Untung: +{formatCurrency(profit)}
                                  </span>
                                  {savings > 0 && (
                                    <span className="text-amber">Hemat: {formatCurrency(savings)}</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTier(idx)}
                                  className="text-text-muted hover:text-error transition-colors p-1 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-muted text-center py-1">
                        Belum ada aturan harga grosir. Klik tombol rekomendasi di atas untuk membuat promo beli banyak lebih murah.
                      </p>
                    )}
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingProduct(null);
                    }}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 cursor-pointer"
                  >
                    {editingProduct ? "Simpan Perubahan" : "Simpan Produk"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESTOCK MODAL */}
      <AnimatePresence>
        {restockingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRestockingProduct(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-text-primary">
                Tambah Stok: {restockingProduct.name}
              </h3>
              <p className="mt-1 text-xs text-text-secondary">
                Stok saat ini:{" "}
                <strong className="text-text-primary">{formatNumber(restockingProduct.stock)} pcs</strong>
              </p>

              <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                    Jumlah Tambahan Stok (pcs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockAmount === 0 ? "" : restockAmount}
                    onChange={(e) =>
                      setRestockAmount(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))
                    }
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setRestockAmount(qty)}
                      className="flex-1 rounded-lg border border-border bg-elevated/60 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-emerald cursor-pointer"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRestockingProduct(null)}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-hover cursor-pointer"
                  >
                    Tambah Stok
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingProduct(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-text-primary">Hapus Produk?</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Apakah Anda yakin ingin menghapus <strong>"{deletingProduct.name}"</strong>?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-white hover:bg-error-hover cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
