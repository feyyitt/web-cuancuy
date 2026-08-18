import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { salesService, productService } from "@/services/dataProvider";
import { useSalesStore } from "@/stores/salesStore";
import { useProductStore } from "@/stores/productStore";
import { formatCurrency, formatNumber } from "@/utils/currency";
import type { Sale } from "@/types";
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
} from "lucide-react";
import { toast } from "sonner";

export function SalesPage() {
  const { sales, setSales, addSale, removeSale, isLoading, setLoading } = useSalesStore();
  const { products, setProducts, updateProduct } = useProductStore();

  const [search, setSearch] = useState("");
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

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  const handleOpenRecord = (preselectedProdId?: string) => {
    const defaultProd = preselectedProdId
      ? products.find((p) => p.id === preselectedProdId && p.stock > 0)
      : products.find((p) => p.stock > 0);

    setSelectedProductId(defaultProd?.id || products[0]?.id || "");
    setQuantity(1);
    setShowConfirmation(false);
    setSuccessAnimation(false);
    setIsRecordModalOpen(true);
  };

  // Calculations for current selected sale
  const totalRevenue = (selectedProduct?.selling_price || 0) * quantity;
  const totalCost = (selectedProduct?.purchase_price || 0) * quantity;
  const totalProfit = totalRevenue - totalCost;
  const remainingStock = (selectedProduct?.stock || 0) - quantity;
  const isStockInsufficient = selectedProduct ? quantity > selectedProduct.stock : false;

  const handleConfirmSale = async () => {
    if (!selectedProduct || quantity <= 0 || isStockInsufficient) {
      toast.error("Stok tidak mencukupi atau jumlah tidak valid");
      return;
    }

    const res = await salesService.createSale(selectedProduct.id, quantity);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      addSale(res.data);
      updateProduct({
        ...selectedProduct,
        stock: selectedProduct.stock - quantity,
        total_sold: (selectedProduct.total_sold || 0) + quantity,
      });

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
      toast.success("Riwayat transaksi berhasil dihapus");
      setDeletingSale(null);
    }
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const prodName = s.product?.name || "";
      return prodName.toLowerCase().includes(search.toLowerCase());
    });
  }, [sales, search]);

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
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Penjualan</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Catat penjualan per pcs, otomatis potong stok, dan hitung keuntungan secara akurat.
          </p>
        </div>
        <button
          onClick={() => handleOpenRecord()}
          disabled={products.length === 0}
          className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Penjualan</span>
        </button>
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
            <span className="text-xs font-medium text-text-muted uppercase">Produk Terjual</span>
            <p className="mt-1 text-xl font-bold tabular-nums text-amber">
              {formatNumber(overallSummary.total_items)} pcs
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
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
            Pilihan Produk Cepat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {products.slice(0, 3).map((p) => (
              <div
                key={p.id}
                onClick={() => handleOpenRecord(p.id)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:border-emerald/40 hover:bg-elevated/40 transition-all cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-emerald transition-colors truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    Jual: {formatCurrency(p.selling_price)} • Stok: {p.stock} pcs
                  </p>
                </div>
                <div className="rounded-lg bg-emerald/10 p-2 text-emerald group-hover:bg-emerald group-hover:text-white transition-colors shrink-0 ml-2">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and History Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text-primary">Riwayat Transaksi Penjualan</h3>
            <span className="rounded-full bg-elevated px-2.5 py-0.5 text-xs text-text-secondary font-medium">
              {filteredSales.length} transaksi
            </span>
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
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Harga Jual / pcs</th>
                  <th className="px-4 py-3 text-right">Total Penjualan</th>
                  <th className="px-4 py-3 text-right">Keuntungan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSales.map((s) => (
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
                      {s.product?.name || "Produk dihapus"}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold tabular-nums text-text-primary">
                      {s.quantity} pcs
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
                        title="Hapus Transaksi"
                        className="rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
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
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
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
                    {quantity} pcs {selectedProduct?.name} tercatat (+{formatCurrency(totalProfit)} untung)
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
                    {/* Select Product */}
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                        Pilih Produk
                      </label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                            {p.name} — Jual: {formatCurrency(p.selling_price)} (Stok: {p.stock} pcs)
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProduct && (
                      <>
                        {/* Quantity Stepper */}
                        <div>
                          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                            Jumlah Terjual (pcs)
                          </label>
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
                              onClick={() =>
                                setQuantity((q) => Math.min(selectedProduct.stock, q + 1))
                              }
                              disabled={quantity >= selectedProduct.stock}
                              className="rounded-xl border border-border bg-elevated h-10 w-10 flex items-center justify-center text-base font-bold text-text-primary hover:bg-elevated/80 disabled:opacity-40 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          {/* Quick preset buttons */}
                          <div className="flex gap-2 mt-2">
                            {[1, 2, 5, 10, 20].map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                disabled={qty > selectedProduct.stock}
                                onClick={() => setQuantity(qty)}
                                className={`flex-1 rounded-lg border border-border py-1 text-xs font-medium transition-colors cursor-pointer ${
                                  quantity === qty
                                    ? "bg-emerald text-white border-emerald"
                                    : "bg-elevated/60 text-text-secondary hover:bg-emerald/10 hover:text-emerald"
                                } disabled:opacity-30`}
                              >
                                {qty} pcs
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Financial calculation breakdown card */}
                        <div className="rounded-xl bg-elevated/60 border border-border p-4 space-y-2 text-xs">
                          <div className="flex justify-between text-text-secondary">
                            <span>Harga Jual / pcs:</span>
                            <span className="font-semibold text-text-primary tabular-nums">
                              {formatCurrency(selectedProduct.selling_price)}
                            </span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Harga Beli / pcs (Modal):</span>
                            <span className="text-text-muted tabular-nums">
                              {formatCurrency(selectedProduct.purchase_price)}
                            </span>
                          </div>
                          <div className="flex justify-between text-text-secondary">
                            <span>Total Modal Barang:</span>
                            <span className="text-text-muted tabular-nums">{formatCurrency(totalCost)}</span>
                          </div>
                          <hr className="border-border my-1" />
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-text-primary">Total Penjualan:</span>
                            <strong className="text-base font-bold text-text-primary tabular-nums">
                              {formatCurrency(totalRevenue)}
                            </strong>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-emerald">Keuntungan Bersih:</span>
                            <strong className="text-base font-bold text-emerald tabular-nums">
                              +{formatCurrency(totalProfit)}
                            </strong>
                          </div>
                          <div className="pt-1 flex justify-between text-[11px] text-text-muted">
                            <span>Sisa stok setelah transaksi:</span>
                            <span className={`font-semibold ${remainingStock <= 5 ? "text-amber" : "text-emerald"}`}>
                              {remainingStock} pcs
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {isStockInsufficient && (
                      <div className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 p-3 text-xs text-error">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Stok tidak mencukupi. Sisa stok hanya {selectedProduct?.stock} pcs.</span>
                      </div>
                    )}
                  </div>

                  {/* Modal buttons */}
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRecordModalOpen(false)}
                      className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={!selectedProduct || quantity <= 0 || isStockInsufficient}
                      onClick={() => setShowConfirmation(true)}
                      className="flex items-center gap-2 rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover disabled:opacity-50 shadow-md shadow-emerald/20 transition-all cursor-pointer"
                    >
                      <span>Lanjut Konfirmasi</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Confirmation Step */
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3.5">
                    <h3 className="text-base font-bold text-text-primary">Konfirmasi Penjualan</h3>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="rounded-lg p-1 text-text-muted hover:bg-elevated cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald/30 bg-emerald/5 p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Produk:</span>
                      <strong className="text-text-primary">{selectedProduct?.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Jumlah:</span>
                      <strong className="text-text-primary">{quantity} pcs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total Penjualan:</span>
                      <strong className="text-base text-text-primary tabular-nums">
                        {formatCurrency(totalRevenue)}
                      </strong>
                    </div>
                    <hr className="border-border/60" />
                    <div className="flex justify-between">
                      <span className="text-text-muted">Keuntungan:</span>
                      <strong className="text-base text-emerald tabular-nums">
                        +{formatCurrency(totalProfit)}
                      </strong>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-text-muted text-center">
                    Stok akan langsung dipotong dari {selectedProduct?.stock} pcs menjadi {remainingStock} pcs.
                  </p>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowConfirmation(false)}
                      className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSale}
                      className="flex-1 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover shadow-md shadow-emerald/20 transition-all cursor-pointer"
                    >
                      Konfirmasi Penjualan
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE TRANSACTION MODAL */}
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
              <div className="flex items-center gap-3 text-error">
                <div className="rounded-xl bg-error/10 p-2.5">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Hapus Transaksi?</h3>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Hapus riwayat penjualan {deletingSale.quantity} pcs "{deletingSale.product?.name}" (
                {formatCurrency(deletingSale.total_revenue)})?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingSale(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSale}
                  className="rounded-xl bg-error px-5 py-2.5 text-sm font-semibold text-white hover:bg-error-hover cursor-pointer"
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
