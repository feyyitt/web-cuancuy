import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { productService, seedDefaultProducts } from "@/services/dataProvider";
import { useProductStore } from "@/stores/productStore";
import { formatCurrency, formatNumber } from "@/utils/currency";
import { calculateProfitPerPiece, calculateMargin, formatMargin } from "@/utils/calculations";
import type { Product, ProductFormData } from "@/types";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export function ProductsPage() {
  const { products, setProducts, addProduct, updateProduct, removeProduct, isLoading, setLoading } =
    useProductStore();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "profit" | "margin" | "stock" | "sold">("name");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "in_stock">("all");

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
    purchase_price: 3000,
    selling_price: 7000,
    stock: 50,
  });

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

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      description: "",
      purchase_price: 3000,
      selling_price: 7000,
      stock: 50,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || "",
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      stock: p.stock,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama produk wajib diisi");
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
      }
    } else {
      const res = await productService.create(formData);
      if (res.error) {
        toast.error(res.error);
      } else if (res.data) {
        addProduct(res.data);
        toast.success(`Produk "${formData.name}" berhasil ditambahkan`);
        setIsAddModalOpen(false);
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
    if (!restockingProduct || restockAmount <= 0) return;
    const res = await productService.addStock(restockingProduct.id, restockAmount);
    if (res.error) {
      toast.error(res.error);
    } else {
      updateProduct({
        ...restockingProduct,
        stock: (restockingProduct.stock || 0) + restockAmount,
      });
      toast.success(`Stok ${restockingProduct.name} bertambah +${restockAmount} pcs`);
      setRestockingProduct(null);
      setRestockAmount(10);
    }
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list
      .filter((p) => {
        if (!p) return false;
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const q = search.toLowerCase().trim();
        const matchesSearch = !q || name.includes(q) || desc.includes(q);
        if (!matchesSearch) return false;
        if (stockFilter === "low") return (p.stock || 0) <= 10;
        if (stockFilter === "in_stock") return (p.stock || 0) > 0;
        return true;
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        if (sortBy === "profit") {
          const profitA = calculateProfitPerPiece(a.purchase_price || 0, a.selling_price || 0);
          const profitB = calculateProfitPerPiece(b.purchase_price || 0, b.selling_price || 0);
          return profitB - profitA;
        }
        if (sortBy === "margin") {
          const marginA = calculateMargin(a.purchase_price || 0, a.selling_price || 0);
          const marginB = calculateMargin(b.purchase_price || 0, b.selling_price || 0);
          return marginB - marginA;
        }
        if (sortBy === "stock") return (b.stock || 0) - (a.stock || 0);
        if (sortBy === "sold") return (b.total_sold || 0) - (a.total_sold || 0);
        return 0;
      });
  }, [products, search, sortBy, stockFilter]);

  // Live preview profit calculations in modal
  const modalProfit = calculateProfitPerPiece(formData.purchase_price, formData.selling_price);
  const modalMargin = calculateMargin(formData.purchase_price, formData.selling_price);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Daftar Produk</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Kelola harga beli, harga jual, margin keuntungan, dan stok produk per pcs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk (contoh: Pin Bros, Stiker)..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Stock & Sort */}
        <div className="flex items-center gap-2">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs sm:text-sm text-text-primary focus:border-emerald focus:outline-none transition-colors cursor-pointer"
          >
            <option value="all">Semua Stok</option>
            <option value="low">⚠️ Stok Menipis (≤10)</option>
            <option value="in_stock">Tersedia (&gt;0)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs sm:text-sm text-text-primary focus:border-emerald focus:outline-none transition-colors cursor-pointer"
          >
            <option value="name">Urutkan: Nama A-Z</option>
            <option value="profit">Untung Terbesar / pcs</option>
            <option value="margin">Margin Tertinggi (%)</option>
            <option value="stock">Stok Terbanyak</option>
            <option value="sold">Paling Banyak Terjual</option>
          </select>
        </div>
      </div>

      {/* Product List / Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-2xl border border-border bg-card animate-pulse p-6" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="rounded-2xl bg-elevated p-4">
            <Package className="h-10 w-10 text-text-muted" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-text-primary">
            {search ? "Tidak ada produk yang cocok" : "Belum ada produk terdaftar"}
          </h3>
          <p className="mt-1 text-sm text-text-secondary max-w-sm">
            {search
              ? "Coba gunakan kata kunci pencarian yang lain."
              : "Tambahkan produk pertama bisnis Anda untuk mulai mencatat stok dan penjualan."}
          </p>
          <div className="mt-5">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover transition-colors shadow-md shadow-emerald/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk Baru
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((p) => {
            const purchasePrice = Number(p.purchase_price) || 0;
            const sellingPrice = Number(p.selling_price) || 0;
            const currentStock = Number(p.stock) || 0;
            const soldCount = Number(p.total_sold) || 0;

            const profitPerPcs = calculateProfitPerPiece(purchasePrice, sellingPrice);
            const margin = calculateMargin(purchasePrice, sellingPrice);
            const isLowStock = currentStock <= 10 && currentStock > 0;
            const isOutOfStock = currentStock === 0;

            return (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 hover:border-emerald/40 hover:shadow-lg transition-all"
              >
                {/* Top Bar: Name & Actions */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-text-primary truncate" title={p.name}>
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="mt-0.5 text-xs text-text-muted truncate">
                          {p.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setRestockingProduct(p)}
                        title="Tambah Stok"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-emerald/10 hover:text-emerald transition-colors cursor-pointer"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        title="Edit Produk"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-elevated hover:text-text-primary transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(p)}
                        title="Hapus Produk"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Pricing Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-elevated/60 p-3">
                    <div>
                      <span className="text-[11px] font-medium text-text-muted uppercase">Harga Beli</span>
                      <p className="text-sm font-semibold tabular-nums text-text-secondary">
                        {formatCurrency(purchasePrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-text-muted uppercase">Harga Jual</span>
                      <p className="text-sm font-bold tabular-nums text-text-primary">
                        {formatCurrency(sellingPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Profit & Margin Highlights */}
                  <div className="mt-3 flex items-center justify-between px-1">
                    <div>
                      <span className="text-xs text-text-muted">Keuntungan:</span>
                      <p className="text-sm font-bold tabular-nums text-emerald">
                        +{formatCurrency(profitPerPcs)}
                        <span className="text-[11px] font-normal text-text-muted"> / pcs</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-text-muted">Margin:</span>
                      <p className="text-sm font-bold tabular-nums text-emerald">
                        {formatMargin(margin)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Stock Bar */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isOutOfStock
                          ? "bg-error/10 text-error border border-error/20"
                          : isLowStock
                          ? "bg-amber/10 text-amber border border-amber/20"
                          : "bg-emerald/10 text-emerald border border-emerald/20"
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Habis (0 pcs)
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertTriangle className="h-3 w-3" />
                          Stok: {formatNumber(currentStock)} pcs
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Stok: {formatNumber(currentStock)} pcs
                        </>
                      )}
                    </span>
                  </div>

                  <span className="text-xs text-text-muted tabular-nums">
                    Terjual: <strong>{formatNumber(soldCount)}</strong> pcs
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
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
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  {editingProduct ? "Edit Data Produk" : "Tambah Produk Baru"}
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

              <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                    Nama Produk <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Pin Bros 44mm"
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
                    placeholder="Contoh: Desain custom laminasi doff"
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none transition-colors"
                  />
                </div>

                {/* Price Row: Purchase vs Selling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      Harga Beli / pcs (Rp) <span className="text-error">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.purchase_price === 0 ? "" : formData.purchase_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          purchase_price: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="0"
                      required
                      className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      Harga Jual / pcs (Rp) <span className="text-error">*</span>
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
                      className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                    Jumlah Stok Awal (pcs) <span className="text-error">*</span>
                  </label>
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
                </div>

                {/* Live Profit Preview Box */}
                <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-3.5 text-xs text-text-secondary space-y-1.5">
                  <div className="flex justify-between">
                    <span>Estimasi Untung Bersih:</span>
                    <strong className="text-emerald tabular-nums">
                      +{formatCurrency(modalProfit)} / pcs
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin Keuntungan:</span>
                    <strong className="text-emerald tabular-nums">{formatMargin(modalMargin)}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>Total Nilai Modal Stok ({formData.stock} pcs):</span>
                    <span className="tabular-nums">
                      {formatCurrency(formData.purchase_price * formData.stock)}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingProduct(null);
                    }}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover transition-colors shadow-md shadow-emerald/20 cursor-pointer"
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
              className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold text-text-primary">Tambah Stok Produk</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Produk: <strong>{restockingProduct.name}</strong> (Stok saat ini: {restockingProduct.stock} pcs)
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
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                  />
                </div>

                {/* Quick preset buttons */}
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setRestockAmount(qty)}
                      className="flex-1 rounded-lg border border-border bg-elevated/60 py-1.5 text-xs font-medium text-text-secondary hover:bg-emerald/10 hover:text-emerald hover:border-emerald/30 transition-colors cursor-pointer"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl bg-elevated/60 p-3 text-xs text-text-secondary space-y-1">
                  <div className="flex justify-between">
                    <span>Stok Baru:</span>
                    <strong className="text-emerald tabular-nums">
                      {(restockingProduct.stock || 0) + restockAmount} pcs
                    </strong>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Estimasi Modal Tambahan:</span>
                    <span className="tabular-nums">
                      {formatCurrency((restockingProduct.purchase_price || 0) * restockAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRestockingProduct(null)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover shadow-md shadow-emerald/20 cursor-pointer"
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
              <div className="flex items-center gap-3 text-error">
                <div className="rounded-xl bg-error/10 p-2.5">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Hapus Produk?</h3>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Apakah Anda yakin ingin menghapus <strong>"{deletingProduct.name}"</strong>? Data transaksi historis tetap tersimpan.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="rounded-xl bg-error px-5 py-2.5 text-sm font-semibold text-white hover:bg-error-hover transition-colors cursor-pointer"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
