import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { salesService, productService } from "@/services/dataProvider";
import { useSalesStore } from "@/stores/salesStore";
import { useProductStore } from "@/stores/productStore";
import { formatCurrency, formatNumber } from "@/utils/currency";
import { getEffectivePricingForQuantity } from "@/utils/calculations";
import type { Sale, Product } from "@/types";
import {
  ShoppingCart,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  ArrowRight,
  Package,
  Tag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function SalesPage() {
  const { sales, setSales, addSale, removeSale, isLoading, setLoading } = useSalesStore();
  const { products, setProducts } = useProductStore();

  const [search, setSearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "single" | "bundle">("all");
  const [modalCategoryTab, setModalCategoryTab] = useState<"all" | "single" | "bundle">("all");

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [salesData, productsData] = await Promise.all([
      salesService.getAll(),
      productService.getAll(),
    ]);
    setSales(salesData);
    setProducts(productsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct: Product | null = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleOpenRecord = (preselectedProdId?: string, preferredTab?: "single" | "bundle") => {
    if (preferredTab) {
      setModalCategoryTab(preferredTab);
    } else if (preselectedProdId) {
      const prod = products.find((p) => p.id === preselectedProdId);
      if (prod?.type === "bundle") setModalCategoryTab("bundle");
      else setModalCategoryTab("single");
    } else {
      setModalCategoryTab("all");
    }

    const availableProducts = preferredTab
      ? products.filter((p) => (preferredTab === "bundle" ? p.type === "bundle" : p.type !== "bundle"))
      : products;

    const defaultProd = preselectedProdId
      ? products.find((p) => p.id === preselectedProdId && p.stock > 0)
      : availableProducts.find((p) => p.stock > 0) || products[0];

    const targetId = defaultProd?.id || products[0]?.id || "";
    setSelectedProductId(targetId);
    setQuantity(1);
    setShowConfirmation(false);
    setSuccessAnimation(false);
    setIsRecordModalOpen(true);
  };

  // Filtered product options for modal
  const modalProducts = useMemo(() => {
    if (modalCategoryTab === "bundle") return products.filter((p) => p.type === "bundle");
    if (modalCategoryTab === "single") return products.filter((p) => p.type !== "bundle");
    return products;
  }, [products, modalCategoryTab]);

  // Pricing calculations (with Tier and Combo Bundling support)
  const isBundle = selectedProduct?.type === "bundle";

  const effectivePricing = useMemo(() => {
    if (!selectedProduct) {
      return {
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        appliedTier: null,
        discountSavings: 0,
        effectiveUnitPrice: 0,
      };
    }

    if (isBundle) {
      const totalRevenue = (selectedProduct.selling_price || 0) * quantity;
      const totalCost = (selectedProduct.purchase_price || 0) * quantity;
      return {
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
        appliedTier: null,
        discountSavings: 0,
        effectiveUnitPrice: selectedProduct.selling_price || 0,
      };
    }

    return getEffectivePricingForQuantity(selectedProduct, quantity);
  }, [selectedProduct, quantity, isBundle]);

  const totalRevenue = effectivePricing.totalRevenue;
  const totalCost = effectivePricing.totalCost;
  const totalProfit = effectivePricing.totalProfit;
  const appliedTier = effectivePricing.appliedTier;
  const discountSavings = effectivePricing.discountSavings;

  const remainingStock = (selectedProduct?.stock || 0) - quantity;
  const isStockInsufficient = selectedProduct ? quantity > selectedProduct.stock : false;

  const handleConfirmSale = async () => {
    if (!selectedProduct || quantity <= 0 || isStockInsufficient) {
      toast.error("Stok tidak mencukupi atau jumlah tidak valid");
      return;
    }

    const res = await salesService.createSale(selectedProduct.id, quantity, {
      customSellingPrice: totalRevenue,
      customPurchasePrice: totalCost,
      bundle_info: isBundle
        ? { is_bundle: true, bundle_name: selectedProduct.name, bundle_items: selectedProduct.bundle_items }
        : appliedTier
        ? { is_bundle: false, tier_applied: appliedTier }
        : null,
    });

    if (res.error) {
      toast.error(res.error);
    } else {
      if (res.data) {
        addSale(res.data);
      } else {
        const freshSales = await salesService.getAll();
        setSales(freshSales);
      }

      // Reload fresh products to update stock across bundle components
      const freshProducts = await productService.getAll();
      setProducts(freshProducts);

      setSuccessAnimation(true);
      toast.success("✓ Transaksi penjualan berhasil dicatat!");

      setTimeout(() => {
        setIsRecordModalOpen(false);
        setSuccessAnimation(false);
      }, 1400);
    }
  };

  const handleDeleteSale = async () => {
    if (!deletingSale) return;
    const res = await salesService.delete(deletingSale.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      removeSale(deletingSale.id);
      // Reload products to reflect restored stock immediately
      const freshProducts = await productService.getAll();
      setProducts(freshProducts);
      toast.success("✓ Transaksi dihapus & stok barang telah dikembalikan ke stok aktif!");
      setDeletingSale(null);
    }
  };

  // Filtered sales history
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const prodName = s.product?.name || "";
      const matchesSearch = prodName.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      const isBundleSale = s.bundle_info?.is_bundle || s.product?.type === "bundle";
      if (historyFilter === "bundle") return isBundleSale;
      if (historyFilter === "single") return !isBundleSale;
      return true;
    });
  }, [sales, search, historyFilter]);

  // Overall totals
  const overallSummary = useMemo(() => {
    return sales.reduce(
      (acc, s) => ({
        total_revenue: acc.total_revenue + Number(s.total_revenue),
        total_profit: acc.total_profit + Number(s.total_profit),
        total_items: acc.total_items + Number(s.quantity),
      }),
      { total_revenue: 0, total_profit: 0, total_items: 0 }
    );
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Penjualan & Kasir</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Catat penjualan satuan maupun paket bundling, otomatis potong stok komponen, dan hitung laba bersih.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenRecord(undefined, "bundle")}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-elevated hover:border-emerald/40 transition-colors cursor-pointer"
          >
            <Package className="h-4 w-4 text-emerald" />
            <span>+ Jual Paket Kombo</span>
          </button>
          <button
            onClick={() => handleOpenRecord()}
            disabled={products.length === 0}
            className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Catat Penjualan</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text-muted uppercase">Total Omset</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
              {formatCurrency(overallSummary.total_revenue)}
            </p>
          </div>
          <div className="rounded-xl bg-info/10 p-2.5 text-info">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text-muted uppercase">Total Keuntungan</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald">
              +{formatCurrency(overallSummary.total_profit)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald/10 p-2.5 text-emerald">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-text-muted uppercase">Produk & Paket Terjual</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-amber">
              {formatNumber(overallSummary.total_items)} pcs/paket
            </p>
          </div>
          <div className="rounded-xl bg-amber/10 p-2.5 text-amber">
            <Package className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Quick Sell Cards from Products (Shortcuts) */}
      {products.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Pilihan Cepat Catat Penjualan
            </h3>
            <span className="text-xs text-text-muted">Klik untuk langsung catat transaksi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {products.slice(0, 3).map((p) => {
              const isCombo = p.type === "bundle";
              const hasTiers = !isCombo && p.tier_pricing && p.tier_pricing.length > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => handleOpenRecord(p.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-elevated/40 transition-all cursor-pointer group ${
                    isCombo ? "border-emerald/40 hover:border-emerald" : "border-border hover:border-emerald/40"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary group-hover:text-emerald transition-colors truncate">
                        {p.name}
                      </p>
                      {isCombo ? (
                        <span className="rounded bg-emerald/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald border border-emerald/20 uppercase">
                          📦 Paket Kombo
                        </span>
                      ) : hasTiers ? (
                        <span className="rounded bg-amber/10 px-1.5 py-0.2 text-[9px] font-bold text-amber border border-amber/20 uppercase">
                          🏷️ Promo Multi-Buy
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      Harga: {formatCurrency(p.selling_price)} • Stok: {p.stock} {isCombo ? "paket" : "pcs"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald/10 p-2 text-emerald group-hover:bg-emerald group-hover:text-white transition-colors shrink-0 ml-2">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and History Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Table Top Bar with Filter Tabs */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-text-primary">Riwayat Transaksi</h3>
            <div className="flex items-center gap-1 bg-elevated/60 p-1 rounded-xl border border-border">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  historyFilter === "all"
                    ? "bg-card text-emerald shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Semua ({sales.length})
              </button>
              <button
                onClick={() => setHistoryFilter("single")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  historyFilter === "single"
                    ? "bg-card text-emerald shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                🏷️ Satuan & Promo
              </button>
              <button
                onClick={() => setHistoryFilter("bundle")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  historyFilter === "bundle"
                    ? "bg-card text-emerald shadow-xs"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                📦 Paket Kombo
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari transaksi..."
              className="w-full rounded-xl border border-border bg-elevated pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none"
            />
          </div>
        </div>

        {/* Content / Table */}
        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-muted">Memuat riwayat transaksi...</div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-2xl bg-elevated p-4">
              <ShoppingCart className="h-8 w-8 text-text-muted" />
            </div>
            <p className="mt-3 text-sm font-semibold text-text-primary">Belum ada transaksi penjualan</p>
            <p className="mt-1 text-xs text-text-muted max-w-xs">
              Klik tombol "Catat Penjualan" di atas untuk mencatat transaksi pertamamu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-elevated/40 text-xs font-semibold text-text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Tanggal & Waktu</th>
                  <th className="px-4 py-3">Produk / Paket</th>
                  <th className="px-4 py-3 text-center">Qty Terjual</th>
                  <th className="px-4 py-3 text-right">Harga Efektif</th>
                  <th className="px-4 py-3 text-right">Total Penjualan</th>
                  <th className="px-4 py-3 text-right">Keuntungan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSales.map((s) => {
                  const isBundleSale = s.bundle_info?.is_bundle || s.product?.type === "bundle";
                  const hasTierApplied = s.bundle_info?.tier_applied;

                  return (
                    <tr key={s.id} className="hover:bg-elevated/30 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-text-muted">
                        {new Date(s.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-text-primary">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{s.product?.name || "Produk"}</span>
                          {isBundleSale ? (
                            <span className="rounded bg-emerald/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald border border-emerald/20 uppercase">
                              📦 Paket Kombo
                            </span>
                          ) : hasTierApplied ? (
                            <span className="rounded bg-amber/10 px-1.5 py-0.2 text-[10px] font-bold text-amber border border-amber/20 uppercase">
                              🏷️ Promo Bundling
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold tabular-nums text-text-primary">
                        {s.quantity} {isBundleSale ? "paket" : "pcs"}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-text-secondary text-xs">
                        {formatCurrency(s.selling_price)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-text-primary">
                        {formatCurrency(s.total_revenue)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums text-emerald">
                        +{formatCurrency(s.total_profit)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setDeletingSale(s)}
                          title="Hapus Transaksi (Kembalikan Stok)"
                          className="rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD SALE MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!successAnimation) setIsRecordModalOpen(false);
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {successAnimation ? (
                /* Animated Success State */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-10 text-center flex flex-col items-center"
                >
                  <div className="rounded-full bg-emerald/20 p-4 text-emerald mb-3">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">Penjualan Berhasil!</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {quantity} {isBundle ? "paket" : "pcs"} {selectedProduct?.name} tercatat (+
                    {formatCurrency(totalProfit)} keuntungan bersih)
                  </p>
                </motion.div>
              ) : !showConfirmation ? (
                /* Step 1: Input Product & Quantity */
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3.5">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-emerald" />
                      Catat Penjualan Baru
                    </h3>
                    <button
                      onClick={() => setIsRecordModalOpen(false)}
                      className="rounded-lg p-1 text-text-muted hover:bg-elevated hover:text-text-primary cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {/* Category Selection Tabs in Modal */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Tipe Penjualan
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-elevated/60 p-1 rounded-xl border border-border">
                        <button
                          type="button"
                          onClick={() => {
                            setModalCategoryTab("all");
                            const first = products.find((p) => p.stock > 0) || products[0];
                            if (first) setSelectedProductId(first.id);
                          }}
                          className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            modalCategoryTab === "all"
                              ? "bg-card text-emerald shadow-xs"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          Semua Produk
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalCategoryTab("single");
                            const first = products.find((p) => p.type !== "bundle" && p.stock > 0) || products.find((p) => p.type !== "bundle");
                            if (first) setSelectedProductId(first.id);
                          }}
                          className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            modalCategoryTab === "single"
                              ? "bg-card text-emerald shadow-xs"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          <Tag className="h-3 w-3" />
                          <span>Satuan & Promo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalCategoryTab("bundle");
                            const first = products.find((p) => p.type === "bundle" && p.stock > 0) || products.find((p) => p.type === "bundle");
                            if (first) setSelectedProductId(first.id);
                          }}
                          className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            modalCategoryTab === "bundle"
                              ? "bg-card text-emerald shadow-xs"
                              : "text-text-muted hover:text-text-primary"
                          }`}
                        >
                          <Package className="h-3 w-3" />
                          <span>Paket Kombo</span>
                        </button>
                      </div>
                    </div>

                    {/* Select Product */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Pilih Barang / Paket
                      </label>
                      {modalProducts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-text-muted">
                          Tidak ada produk dalam kategori ini. Tambahkan produk di menu Produk terlebih dahulu.
                        </div>
                      ) : (
                        <select
                          value={selectedProductId}
                          onChange={(e) => {
                            setSelectedProductId(e.target.value);
                            setQuantity(1);
                          }}
                          className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
                        >
                          {modalProducts.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                              {p.type === "bundle" ? "📦 [PAKET KOMBO] " : p.tier_pricing?.length ? "🏷️ [PROMO BUNDLE] " : ""}
                              {p.name} — Harga: {formatCurrency(p.selling_price)} (Stok: {p.stock}{" "}
                              {p.type === "bundle" ? "paket" : "pcs"})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {selectedProduct && (
                      <>
                        {/* Bundle Details breakdown */}
                        {isBundle && selectedProduct.bundle_items && (
                          <div className="rounded-xl bg-emerald/5 border border-emerald/20 p-3.5 text-xs space-y-2">
                            <span className="font-bold text-emerald uppercase tracking-wider flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" />
                              Rincian Komponen Paket Kombo:
                            </span>
                            <div className="space-y-1">
                              {selectedProduct.bundle_items.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-text-secondary">
                                  <span>• {it.quantity * quantity}x {it.product_name}</span>
                                  <span className="text-text-muted">({it.quantity} pcs/paket)</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-text-muted border-t border-emerald/15 pt-1.5">
                              💡 Penjualan {quantity} paket ini akan otomatis memotong stok setiap komponen di atas.
                            </p>
                          </div>
                        )}

                        {/* Interactive Package / Tier Selector for Single Products */}
                        {!isBundle && selectedProduct.tier_pricing && selectedProduct.tier_pricing.length > 0 && (
                          <div>
                            <label className="block text-xs font-semibold text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber" />
                              Pilihan Paket Penjualan / Promo Bundling:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Option 1: Satuan (1 pcs) */}
                              <div
                                onClick={() => setQuantity(1)}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                  quantity === 1
                                    ? "bg-emerald/15 border-emerald text-text-primary ring-1 ring-emerald"
                                    : "bg-elevated/40 border-border hover:border-emerald/40 text-text-secondary"
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold">Beli Satuan (1 pcs)</span>
                                  <span className="text-[10px] text-text-muted">Harga Normal</span>
                                </div>
                                <div className="mt-1 text-sm font-bold text-text-primary tabular-nums">
                                  {formatCurrency(selectedProduct.selling_price)}
                                </div>
                              </div>

                              {/* Tier Bundling Options */}
                              {selectedProduct.tier_pricing.map((tier, idx) => {
                                const isSelected = quantity === tier.min_qty;
                                const normalCost = selectedProduct.selling_price * tier.min_qty;
                                const savings = normalCost - tier.price;

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setQuantity(tier.min_qty)}
                                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                      isSelected
                                        ? "bg-amber/15 border-amber text-text-primary ring-1 ring-amber"
                                        : "bg-amber/5 border-amber/30 hover:border-amber text-text-secondary"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-amber flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {tier.label || `Paket ${tier.min_qty} pcs`}
                                      </span>
                                      {savings > 0 && (
                                        <span className="rounded bg-amber px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                          Hemat {formatCurrency(savings)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 flex items-baseline justify-between">
                                      <span className="text-sm font-bold text-text-primary tabular-nums">
                                        {formatCurrency(tier.price)}
                                      </span>
                                      <span className="text-[10px] text-text-muted">
                                        ({formatCurrency(tier.price / tier.min_qty)}/pcs)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Quantity Stepper & Custom Qty */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-text-secondary uppercase">
                              Jumlah Terjual ({isBundle ? "paket" : "pcs"})
                            </label>
                            <span className="text-xs text-text-muted">
                              Tersedia: <strong>{selectedProduct.stock}</strong> {isBundle ? "paket" : "pcs"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                              className="rounded-xl border border-border bg-elevated h-10 w-10 flex items-center justify-center text-base font-bold text-text-primary hover:bg-elevated/80 cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={selectedProduct.stock}
                              value={quantity === 0 ? "" : quantity}
                              onChange={(e) =>
                                setQuantity(
                                  e.target.value === ""
                                    ? 0
                                    : Math.max(1, Math.min(selectedProduct.stock, Number(e.target.value)))
                                )
                              }
                              placeholder="0"
                              className="flex-1 rounded-xl border border-border bg-elevated px-4 py-2 text-center text-lg font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                              disabled={quantity >= selectedProduct.stock}
                              className="rounded-xl border border-border bg-elevated h-10 w-10 flex items-center justify-center text-base font-bold text-text-primary hover:bg-elevated/80 disabled:opacity-40 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Preset Buttons */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {[1, 2, 3, 5, 10, 20].map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                disabled={qty > selectedProduct.stock}
                                onClick={() => setQuantity(qty)}
                                className={`rounded-lg border border-border py-1 px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                                  quantity === qty
                                    ? "bg-emerald text-white border-emerald"
                                    : "bg-elevated/60 text-text-secondary hover:bg-emerald/10 hover:text-emerald"
                                } disabled:opacity-30`}
                              >
                                {qty} {isBundle ? "paket" : "pcs"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Bundling Promotion Active Banner */}
                        {appliedTier && (
                          <div className="rounded-xl bg-amber/10 border border-amber/30 p-3 text-xs flex items-center gap-2 text-amber">
                            <Sparkles className="h-4 w-4 shrink-0" />
                            <div>
                              <strong className="font-bold">Promo Bundling Aktif:</strong> Beli {appliedTier.min_qty} pcs seharga{" "}
                              <strong>{formatCurrency(appliedTier.price)}</strong> (Hemat{" "}
                              <strong>{formatCurrency(discountSavings)}</strong>)
                            </div>
                          </div>
                        )}

                        {/* Financial calculation breakdown card */}
                        <div className="rounded-xl bg-elevated/60 border border-border p-4 space-y-2 text-xs">
                          <div className="flex justify-between text-text-secondary">
                            <span>Harga Normal Satuan:</span>
                            <span className="font-semibold text-text-primary tabular-nums">
                              {formatCurrency(selectedProduct.selling_price)}
                            </span>
                          </div>

                          <div className="flex justify-between text-text-secondary">
                            <span>Total Omset Diterima ({quantity} {isBundle ? "paket" : "pcs"}):</span>
                            <strong className="text-sm font-bold text-text-primary tabular-nums">
                              {formatCurrency(totalRevenue)}
                            </strong>
                          </div>

                          <div className="flex justify-between text-text-secondary">
                            <span>Total Modal Pokok (HPP):</span>
                            <span className="tabular-nums text-text-muted">
                              -{formatCurrency(totalCost)}
                            </span>
                          </div>

                          <div className="border-t border-border pt-2 flex justify-between items-center">
                            <span className="font-bold text-text-primary">Keuntungan Bersih:</span>
                            <strong className="text-base font-bold text-emerald tabular-nums">
                              +{formatCurrency(totalProfit)}
                            </strong>
                          </div>
                        </div>

                        {/* Stock warning if exceeding */}
                        {isStockInsufficient && (
                          <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 p-3 text-xs text-error">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>Jumlah penjualan melebihi stok yang tersedia ({selectedProduct.stock} pcs).</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRecordModalOpen(false)}
                        className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmation(true)}
                        disabled={!selectedProduct || quantity <= 0 || isStockInsufficient}
                        className="flex items-center gap-2 rounded-xl bg-emerald px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 disabled:opacity-40 cursor-pointer"
                      >
                        <span>Lanjut Konfirmasi</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2: Confirmation Screen */
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3.5">
                    <h3 className="text-base font-bold text-text-primary">Konfirmasi Transaksi</h3>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="rounded-lg p-1 text-text-muted hover:bg-elevated hover:text-text-primary cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4 text-sm">
                    <p className="text-text-secondary text-xs">
                      Pastikan detail transaksi penjualan di bawah ini sudah benar:
                    </p>

                    <div className="rounded-xl bg-elevated p-4 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Nama Barang / Paket:</span>
                        <strong className="text-text-primary">{selectedProduct?.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Jumlah Terjual:</span>
                        <strong className="text-text-primary">
                          {quantity} {isBundle ? "paket" : "pcs"}
                        </strong>
                      </div>
                      {appliedTier && (
                        <div className="flex justify-between text-amber">
                          <span>Promo Bundling:</span>
                          <strong>{appliedTier.label || `Beli ${appliedTier.min_qty} pcs`}</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-muted">Total Diterima (Omset):</span>
                        <strong className="text-text-primary font-bold">{formatCurrency(totalRevenue)}</strong>
                      </div>
                      <div className="flex justify-between border-t border-border/80 pt-2">
                        <span className="text-text-muted">Keuntungan Bersih:</span>
                        <strong className="text-emerald font-bold">+{formatCurrency(totalProfit)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Sisa Stok Nanti:</span>
                        <span className="font-semibold text-text-primary">{remainingStock} {isBundle ? "paket" : "pcs"}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowConfirmation(false)}
                        className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                      >
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSale}
                        className="rounded-xl bg-emerald px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 cursor-pointer"
                      >
                        ✓ Simpan Transaksi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingSale(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-text-primary">Hapus Transaksi Penjualan?</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Apakah Anda yakin ingin menghapus catatan transaksi <strong>"{deletingSale.product?.name || "Barang"}"</strong> ({deletingSale.quantity} pcs)?
              </p>
              <div className="mt-3 rounded-xl bg-emerald/10 border border-emerald/20 p-3 text-xs text-emerald font-medium">
                💡 <strong>Info:</strong> Stok barang sebanyak <strong>{deletingSale.quantity} pcs</strong> akan otomatis dikembalikan ke stok aktif gudang.
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingSale(null)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteSale}
                  className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-white hover:bg-error-hover cursor-pointer"
                >
                  Hapus & Kembalikan Stok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
