import { useState } from "react";
import { formatCurrency, formatNumber } from "@/utils/currency";
import {
  calculateProfitPerPiece,
  calculateMargin,
  calculateRevenue,
  calculateCost,
  calculateTotalProfit,
  calculateSellingPriceFromMargin,
  calculateTargetUnits,
  formatMargin,
  calculateBundleMetrics,
} from "@/utils/calculations";
import {
  Calculator,
  Percent,
  Target,
  BarChart3,
  Sliders,
  CheckCircle,
  Layers,
  Tag,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

export function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<
    "price" | "margin" | "target" | "simulator" | "scenario" | "bundling"
  >("price");

  // Tab 1: Price Calculator
  const [pBuy, setPBuy] = useState<number>(3000);
  const [pTargetProfit, setPTargetProfit] = useState<number>(4000);
  const [pQty, setPQty] = useState<number>(100);

  const pSelling = pBuy + pTargetProfit;
  const pProfitPerPcs = calculateProfitPerPiece(pBuy, pSelling);
  const pMargin = calculateMargin(pBuy, pSelling);
  const pTotalCost = calculateCost(pBuy, pQty);
  const pTotalRevenue = calculateRevenue(pSelling, pQty);
  const pTotalProfit = calculateTotalProfit(pBuy, pSelling, pQty);

  // Tab 2: Margin Calculator
  const [mBuy, setMBuy] = useState<number>(3000);
  const [mTargetMargin, setMTargetMargin] = useState<number>(40);
  const mRecommendedPrice = calculateSellingPriceFromMargin(mBuy, mTargetMargin);
  const mProfitPerPcs = Math.round(mRecommendedPrice - mBuy);

  // Tab 3: Target Balik Modal / Target Profit
  const [targetGoal, setTargetGoal] = useState<number>(1000000);
  const [targetProfitPerPcs, setTargetProfitPerPcs] = useState<number>(4000);
  const targetUnits = calculateTargetUnits(targetGoal, targetProfitPerPcs);

  // Tab 4: Interactive Simulator
  const [simBuy, setSimBuy] = useState<number>(3000);
  const [simSell, setSimSell] = useState<number>(7000);
  const [simQty, setSimQty] = useState<number>(50);

  const simProfitPerPcs = calculateProfitPerPiece(simBuy, simSell);
  const simMargin = calculateMargin(simBuy, simSell);
  const simCost = calculateCost(simBuy, simQty);
  const simRevenue = calculateRevenue(simSell, simQty);
  const simProfit = calculateTotalProfit(simBuy, simSell, simQty);

  // Tab 5: Price Scenarios Comparison
  const [scBuy, setScBuy] = useState<number>(3000);
  const [scQty, setScQty] = useState<number>(100);
  const scenarioPrices = [5000, 6000, 7000, 8000, 9000, 10000];

  // Tab 6: Bundling Calculator
  const [bundleMode, setBundleMode] = useState<"multibuy" | "combo">("multibuy");

  // Multi-Buy (Single Item Bundling: e.g. Stiker 1 = 7rb, 2 = 10rb)
  const [mbBuy, setMbBuy] = useState<number>(1000);
  const [mbSellNormal, setMbSellNormal] = useState<number>(7000);
  const [mbQty, setMbQty] = useState<number>(2);
  const [mbBundlePrice, setMbBundlePrice] = useState<number>(10000);

  const mbTotalCost = mbBuy * mbQty;
  const mbNormalTotalRevenue = mbSellNormal * mbQty;
  const mbTotalProfit = mbBundlePrice - mbTotalCost;
  const mbDiscountSavings = Math.max(0, mbNormalTotalRevenue - mbBundlePrice);
  const mbDiscountPercent = mbNormalTotalRevenue > 0 ? (mbDiscountSavings / mbNormalTotalRevenue) * 100 : 0;
  const mbMargin = mbBundlePrice > 0 ? (mbTotalProfit / mbBundlePrice) * 100 : 0;

  // Combo Bundle (Multi-item Bundle)
  const [comboItems, setComboItems] = useState<
    { id: string; name: string; purchase_price: number; selling_price: number; quantity: number }[]
  >([
    { id: "1", name: "Pin Bros", purchase_price: 3000, selling_price: 7000, quantity: 1 },
    { id: "2", name: "Pin Tutup Botol", purchase_price: 4000, selling_price: 8000, quantity: 1 },
    { id: "3", name: "Stiker", purchase_price: 1000, selling_price: 7000, quantity: 2 },
  ]);
  const [comboBundlePrice, setComboBundlePrice] = useState<number>(18000);

  const comboMetrics = calculateBundleMetrics(comboItems, comboBundlePrice);

  const handleAddComboItem = () => {
    setComboItems([
      ...comboItems,
      {
        id: String(Date.now()),
        name: `Barang Baru ${comboItems.length + 1}`,
        purchase_price: 2000,
        selling_price: 5000,
        quantity: 1,
      },
    ]);
  };

  const handleUpdateComboItem = (id: string, field: string, val: any) => {
    setComboItems(
      comboItems.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleRemoveComboItem = (id: string) => {
    if (comboItems.length <= 1) return;
    setComboItems(comboItems.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Kalkulator Bisnis & Bundling</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Simulasikan penetapan harga jual satuan, promo custom bundling grosir, paket kombo campuran, dan target keuntungan.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-border pb-2">
        {[
          { id: "bundling" as const, label: "Hitung Bundling & Kombo 🔥", icon: Layers },
          { id: "price" as const, label: "Hitung Harga Jual", icon: Calculator },
          { id: "margin" as const, label: "Target Margin (%)", icon: Percent },
          { id: "target" as const, label: "Target Balik Modal", icon: Target },
          { id: "simulator" as const, label: "Simulasi Penjualan", icon: Sliders },
          { id: "scenario" as const, label: "Skenario Harga", icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald text-white shadow-sm shadow-emerald/20"
                  : "bg-card text-text-secondary hover:bg-elevated hover:text-text-primary border border-border"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 6: BUNDLING & KOMBO CALCULATOR */}
      {activeTab === "bundling" && (
        <div className="space-y-6">
          {/* Sub-mode selector */}
          <div className="flex gap-2 rounded-xl bg-card border border-border p-1.5 max-w-md">
            <button
              onClick={() => setBundleMode("multibuy")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                bundleMode === "multibuy"
                  ? "bg-emerald text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              🏷️ Multi-Buy / Grosir (1 Produk)
            </button>
            <button
              onClick={() => setBundleMode("combo")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                bundleMode === "combo"
                  ? "bg-emerald text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              📦 Paket Kombo Campuran
            </button>
          </div>

          {bundleMode === "multibuy" ? (
            /* Mode 1: Multi-Buy / Tier Bundling Simulation */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald" />
                    Simulasi Bundling Beli Banyak Lebih Murah
                  </h3>
                </div>
                <p className="text-xs text-text-secondary">
                  Contoh: Stiker satuan Rp7.000, tapi beli 2 pcs seharga Rp10.000.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      Harga Beli / Modal (per pcs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mbBuy === 0 ? "" : mbBuy}
                      onChange={(e) => setMbBuy(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      Harga Jual Normal Satuan (per pcs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mbSellNormal === 0 ? "" : mbSellNormal}
                      onChange={(e) => setMbSellNormal(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      Jumlah Paket Bundling (pcs)
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={mbQty === 0 ? "" : mbQty}
                      onChange={(e) => setMbQty(Math.max(2, Number(e.target.value)))}
                      className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary font-bold text-center tabular-nums focus:border-emerald focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                      Harga Paket Bundling (Total Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mbBundlePrice === 0 ? "" : mbBundlePrice}
                      onChange={(e) => setMbBundlePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-emerald font-bold tabular-nums focus:border-emerald focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Output Preview */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Hasil Analisis Promo Bundling
                  </h4>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-elevated/60 p-3.5">
                      <span className="text-xs text-text-muted">Total Modal ({mbQty} pcs)</span>
                      <p className="mt-1 text-base font-bold tabular-nums text-text-secondary">
                        {formatCurrency(mbTotalCost)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-elevated/60 p-3.5">
                      <span className="text-xs text-text-muted">Harga Normal ({mbQty} pcs)</span>
                      <p className="mt-1 text-base font-bold tabular-nums text-text-primary line-through">
                        {formatCurrency(mbNormalTotalRevenue)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-emerald/10 border border-emerald/20 p-4">
                    <span className="text-xs font-semibold text-emerald uppercase tracking-wider">
                      Keuntungan Bersih Paket:
                    </span>
                    <p className="mt-1 text-2xl font-black tabular-nums text-emerald">
                      +{formatCurrency(mbTotalProfit)}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-secondary border-t border-emerald/20 pt-2">
                      <span>Margin Keuntungan Paket:</span>
                      <strong className="text-emerald font-bold">{formatMargin(mbMargin)}</strong>
                    </div>
                  </div>

                  {mbDiscountSavings > 0 && (
                    <div className="mt-3 rounded-xl bg-amber/10 border border-amber/20 p-3.5 flex items-center justify-between text-xs text-amber font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Hemat Bagi Pembeli:
                      </span>
                      <strong>
                        Diskon {formatCurrency(mbDiscountSavings)} ({mbDiscountPercent.toFixed(1)}%)
                      </strong>
                    </div>
                  )}
                </div>

                <p className="text-xs text-text-muted italic">
                  💡 Tips: Bundling beli {mbQty} pcs seharga {formatCurrency(mbBundlePrice)} membuat pembeli tertarik karena hemat {formatCurrency(mbDiscountSavings)}, sementara Anda tetap menghasilkan laba bersih +{formatCurrency(mbTotalProfit)}.
                </p>
              </div>
            </div>
          ) : (
            /* Mode 2: Multi-Item Combo Package Simulation */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald" />
                      Komposisi Paket Kombo Campuran
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Tambahkan barang-barang yang ingin Anda gabungkan menjadi satu paket promo.
                    </p>
                  </div>
                  <button
                    onClick={handleAddComboItem}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald/10 border border-emerald/20 px-3 py-1.5 text-xs font-bold text-emerald hover:bg-emerald/20 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Barang
                  </button>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-elevated/40 text-text-muted font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Nama Barang</th>
                        <th className="py-2.5 px-3">Modal / pcs</th>
                        <th className="py-2.5 px-3">Jual Normal</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Subtotal Modal</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {comboItems.map((it) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.name}
                              onChange={(e) => handleUpdateComboItem(it.id, "name", e.target.value)}
                              className="w-full rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-text-primary font-medium"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={it.purchase_price === 0 ? "" : it.purchase_price}
                              onChange={(e) =>
                                handleUpdateComboItem(it.id, "purchase_price", Math.max(0, Number(e.target.value)))
                              }
                              className="w-24 rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-text-primary tabular-nums"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={it.selling_price === 0 ? "" : it.selling_price}
                              onChange={(e) =>
                                handleUpdateComboItem(it.id, "selling_price", Math.max(0, Number(e.target.value)))
                              }
                              className="w-24 rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-text-primary tabular-nums"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity === 0 ? "" : it.quantity}
                              onChange={(e) =>
                                handleUpdateComboItem(it.id, "quantity", Math.max(1, Number(e.target.value)))
                              }
                              className="w-14 rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-center font-bold text-text-primary"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-semibold tabular-nums text-text-secondary">
                            {formatCurrency(it.purchase_price * it.quantity)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleRemoveComboItem(it.id)}
                              disabled={comboItems.length <= 1}
                              className="text-text-muted hover:text-error disabled:opacity-30 transition-colors p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Target Bundle Selling Price Input */}
                <div className="rounded-xl bg-elevated/50 p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-primary uppercase mb-0.5">
                      Rencana Harga Jual Paket Kombo (Rp)
                    </label>
                    <span className="text-xs text-text-muted">
                      Total harga normal jika beli satuan:{" "}
                      <strong className="text-text-primary">{formatCurrency(comboMetrics.totalNormalPrice)}</strong>
                    </span>
                  </div>
                  <div className="w-full sm:w-48">
                    <input
                      type="number"
                      min="0"
                      value={comboBundlePrice === 0 ? "" : comboBundlePrice}
                      onChange={(e) => setComboBundlePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-xl border border-emerald bg-card px-4 py-2.5 text-base font-black text-emerald tabular-nums focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Combo Output Summary */}
              <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Analisis Paket Kombo
                  </h4>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between text-text-secondary">
                      <span>Total Modal Pokok (HPP):</span>
                      <strong className="text-text-primary tabular-nums">
                        {formatCurrency(comboMetrics.totalCost)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Harga Normal Satuan:</span>
                      <span className="line-through tabular-nums text-text-muted">
                        {formatCurrency(comboMetrics.totalNormalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald font-semibold">
                      <span>Harga Jual Paket:</span>
                      <strong className="tabular-nums font-bold">
                        {formatCurrency(comboBundlePrice)}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-emerald/10 border border-emerald/20 p-4">
                    <span className="text-xs font-semibold text-emerald uppercase tracking-wider">
                      Keuntungan Bersih Paket:
                    </span>
                    <p className="mt-1 text-2xl font-black tabular-nums text-emerald">
                      +{formatCurrency(comboMetrics.bundleProfit)}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs text-text-secondary border-t border-emerald/20 pt-2">
                      <span>Margin Keuntungan:</span>
                      <strong className="text-emerald font-bold">
                        {formatMargin(comboMetrics.margin)}
                      </strong>
                    </div>
                  </div>

                  {comboMetrics.discountAmount > 0 && (
                    <div className="mt-3 rounded-xl bg-amber/10 border border-amber/20 p-3 flex items-center justify-between text-xs text-amber font-semibold">
                      <span>Diskon Penghematan:</span>
                      <strong>
                        {formatCurrency(comboMetrics.discountAmount)} ({comboMetrics.discountPercent.toFixed(1)}%)
                      </strong>
                    </div>
                  )}
                </div>

                <p className="text-xs text-text-muted italic">
                  💡 Paket kombo sangat efektif untuk menaikkan nilai rata-rata transaksi dan mempercepat perputaran stok!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: HITUNG HARGA JUAL DARI TARGET UNTUNG */}
      {activeTab === "price" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald" />
              Parameter Harga & Target Untung
            </h3>
            <p className="text-xs text-text-secondary">
              Tentukan harga beli dan target keuntungan bersih yang Anda inginkan untuk setiap pcs.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Harga Beli / Modal Barang (per pcs)
              </label>
              <input
                type="number"
                min="0"
                value={pBuy === 0 ? "" : pBuy}
                onChange={(e) => setPBuy(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Target Keuntungan Bersih (per pcs)
              </label>
              <input
                type="number"
                min="0"
                value={pTargetProfit === 0 ? "" : pTargetProfit}
                onChange={(e) =>
                  setPTargetProfit(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))
                }
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Estimasi Jumlah Terjual (pcs)
              </label>
              <input
                type="number"
                min="1"
                value={pQty === 0 ? "" : pQty}
                onChange={(e) => setPQty(e.target.value === "" ? 0 : Math.max(1, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Rekomendasi Penetapan Harga
              </h4>

              <div className="mt-4 rounded-xl bg-emerald/10 border border-emerald/20 p-4">
                <span className="text-xs text-emerald font-semibold uppercase tracking-wider">
                  Harga Jual Yang Disarankan:
                </span>
                <p className="mt-1 text-3xl font-black tabular-nums text-emerald">
                  {formatCurrency(pSelling)}
                  <span className="text-sm font-normal text-text-secondary"> / pcs</span>
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-text-secondary border-t border-emerald/20 pt-2.5">
                  <span>Keuntungan Bersih:</span>
                  <strong className="text-emerald font-bold">+{formatCurrency(pProfitPerPcs)} / pcs</strong>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-text-secondary">
                  <span>Margin Keuntungan:</span>
                  <strong className="text-emerald font-bold">{formatMargin(pMargin)}</strong>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-elevated/60 p-3.5">
                  <span className="text-xs text-text-muted">Total Modal ({pQty} pcs)</span>
                  <p className="mt-1 text-base font-bold tabular-nums text-text-secondary">
                    {formatCurrency(pTotalCost)}
                  </p>
                </div>

                <div className="rounded-xl bg-elevated/60 p-3.5">
                  <span className="text-xs text-text-muted">Total Omset ({pQty} pcs)</span>
                  <p className="mt-1 text-base font-bold tabular-nums text-text-primary">
                    {formatCurrency(pTotalRevenue)}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-elevated/60 p-3.5 flex items-center justify-between">
                <span className="text-xs text-text-muted">Total Keuntungan Bersih:</span>
                <strong className="text-base font-bold tabular-nums text-emerald">
                  +{formatCurrency(pTotalProfit)}
                </strong>
              </div>
            </div>

            <p className="text-xs text-text-muted italic">
              💡 Formula: Harga Jual = Harga Beli + Target Untung Bersih
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TARGET MARGIN PERSEN */}
      {activeTab === "margin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald" />
              Kalkulasi Berdasarkan Margin (%)
            </h3>
            <p className="text-xs text-text-secondary">
              Tentukan target margin profit (misal 40% atau 50%), sistem akan menghitung harga jual optimal.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Harga Beli / Modal Barang (per pcs)
              </label>
              <input
                type="number"
                min="0"
                value={mBuy === 0 ? "" : mBuy}
                onChange={(e) => setMBuy(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-text-secondary uppercase">
                  Target Margin (%)
                </label>
                <span className="text-xs font-bold text-emerald">{mTargetMargin}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                step="1"
                value={mTargetMargin}
                onChange={(e) => setMTargetMargin(Number(e.target.value))}
                className="w-full accent-emerald cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-text-muted mt-1">
                <span>5% (Tipis)</span>
                <span>40% (Standard)</span>
                <span>70% (Tinggi)</span>
                <span>90%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Hasil Kalkulasi Margin
              </h4>

              <div className="mt-4 rounded-xl bg-emerald/10 border border-emerald/20 p-4">
                <span className="text-xs text-emerald font-semibold uppercase tracking-wider">
                  Harga Jual Rekomendasi (Margin {mTargetMargin}%):
                </span>
                <p className="mt-1 text-3xl font-black tabular-nums text-emerald">
                  {formatCurrency(Math.round(mRecommendedPrice / 100) * 100)}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Untung bersih: <strong>+{formatCurrency(mProfitPerPcs)} / pcs</strong>
                </p>
              </div>

              <div className="mt-4 space-y-2 rounded-xl bg-elevated/60 p-4 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Modal Pokok:</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(mBuy)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Keuntungan / pcs:</span>
                  <span className="font-bold text-emerald">+{formatCurrency(mProfitPerPcs)}</span>
                </div>
                <div className="flex justify-between text-text-secondary border-t border-border pt-2">
                  <span>Margin Profit Riil:</span>
                  <strong className="text-emerald">
                    {formatMargin(calculateMargin(mBuy, Math.round(mRecommendedPrice / 100) * 100))}
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-muted italic">
              💡 Formula: Harga Jual = Harga Beli / (1 - Target Margin %)
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: TARGET BALIK MODAL */}
      {activeTab === "target" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald" />
              Target Balik Modal & Profit
            </h3>
            <p className="text-xs text-text-secondary">
              Hitung berapa pcs barang yang harus terjual untuk mencapai target keuntungan atau balik modal.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Target Keuntungan / Balik Modal (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={targetGoal === 0 ? "" : targetGoal}
                onChange={(e) =>
                  setTargetGoal(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))
                }
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Keuntungan Bersih per 1 pcs (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={targetProfitPerPcs === 0 ? "" : targetProfitPerPcs}
                onChange={(e) =>
                  setTargetProfitPerPcs(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))
                }
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Target Penjualan Unit
              </h4>

              <div className="mt-4 rounded-xl bg-amber/10 border border-amber/20 p-5 text-center">
                <span className="text-xs text-amber font-semibold uppercase tracking-wider">
                  Target Penjualan Yang Harus Dicapai:
                </span>
                <p className="mt-2 text-4xl font-black tabular-nums text-amber">
                  {formatNumber(targetUnits)} <span className="text-base font-normal">pcs</span>
                </p>
                <p className="mt-2 text-xs text-text-secondary">
                  Untuk mendapatkan total keuntungan <strong>{formatCurrency(targetGoal)}</strong>
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-elevated/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Untung per 1 pcs:</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(targetProfitPerPcs)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Target Unit:</span>
                  <span className="font-bold text-amber">{formatNumber(targetUnits)} pcs</span>
                </div>
                <div className="flex justify-between text-text-secondary border-t border-border pt-2">
                  <span>Total Tercapai:</span>
                  <strong className="text-emerald font-bold">
                    {formatCurrency(targetUnits * targetProfitPerPcs)}
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-text-muted italic">
              💡 Formula: Target Unit = Target Nominal / Keuntungan per pcs
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: SIMULATOR INTERAKTIF */}
      {activeTab === "simulator" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald" />
              Simulasi Interaktif Penjualan
            </h3>
            <p className="text-xs text-text-secondary">
              Geser slider untuk melihat dampak volume penjualan terhadap keuntungan dan omset secara real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Modal Beli / pcs (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={simBuy === 0 ? "" : simBuy}
                onChange={(e) => setSimBuy(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Harga Jual / pcs (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={simSell === 0 ? "" : simSell}
                onChange={(e) => setSimSell(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary tabular-nums"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-text-secondary uppercase">
                  Volume Penjualan (pcs)
                </label>
                <span className="text-xs font-bold text-amber">{formatNumber(simQty)} pcs</span>
              </div>
              <input
                type="range"
                min="5"
                max="1000"
                step="5"
                value={simQty}
                onChange={(e) => setSimQty(Number(e.target.value))}
                className="w-full accent-amber cursor-pointer"
              />
            </div>
          </div>

          {/* Simulation Output Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
            <div className="rounded-xl bg-elevated/60 p-4">
              <span className="text-xs text-text-muted">Total Modal Barang</span>
              <p className="mt-1 text-lg font-bold tabular-nums text-text-secondary">
                {formatCurrency(simCost)}
              </p>
            </div>

            <div className="rounded-xl bg-elevated/60 p-4">
              <span className="text-xs text-text-muted">Total Omset Penjualan</span>
              <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
                {formatCurrency(simRevenue)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald/10 border border-emerald/20 p-4">
              <span className="text-xs text-emerald font-semibold">Total Keuntungan</span>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-emerald">
                +{formatCurrency(simProfit)}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 tabular-nums">
                +{formatCurrency(simProfitPerPcs)} / pcs
              </p>
            </div>

            <div className="rounded-xl bg-elevated/60 p-4">
              <span className="text-xs text-text-muted">Margin Keuntungan</span>
              <p className="mt-1 text-lg font-bold tabular-nums text-emerald">
                {formatMargin(simMargin)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SKENARIO PERBANDINGAN HARGA */}
      {activeTab === "scenario" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald" />
                Matriks Perbandingan Skenario Harga Jual
              </h3>
              <p className="text-xs text-text-secondary">
                Bandingkan berbagai opsi harga jual untuk modal {formatCurrency(scBuy)} per {scQty} pcs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Modal Beli:</span>
              <input
                type="number"
                min="0"
                value={scBuy === 0 ? "" : scBuy}
                onChange={(e) => setScBuy(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-24 rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-text-primary tabular-nums"
              />
              <span className="text-xs text-text-muted">Jumlah:</span>
              <input
                type="number"
                min="0"
                value={scQty === 0 ? "" : scQty}
                onChange={(e) => setScQty(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-20 rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-text-primary tabular-nums"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-elevated/40 text-xs font-semibold text-text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Skenario Harga Jual</th>
                  <th className="px-4 py-3 text-right">Untung / pcs</th>
                  <th className="px-4 py-3 text-right">Margin (%)</th>
                  <th className="px-4 py-3 text-right">Total Penjualan ({scQty} pcs)</th>
                  <th className="px-4 py-3 text-right">Total Keuntungan</th>
                  <th className="px-4 py-3 text-center">Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {scenarioPrices.map((price) => {
                  const pp = calculateProfitPerPiece(scBuy, price);
                  const m = calculateMargin(scBuy, price);
                  const rev = calculateRevenue(price, scQty);
                  const profit = calculateTotalProfit(scBuy, price, scQty);
                  const isRecommended = price === 7000 || price === 8000;

                  return (
                    <tr
                      key={price}
                      className={`hover:bg-elevated/30 transition-colors ${
                        isRecommended ? "bg-emerald/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 font-bold tabular-nums text-text-primary">
                        {formatCurrency(price)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-emerald">
                        +{formatCurrency(pp)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-text-primary">
                        {formatMargin(m)}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-text-secondary">
                        {formatCurrency(rev)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums text-emerald">
                        +{formatCurrency(profit)}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs">
                        {m < 30 ? (
                          <span className="text-text-muted">Margin Rendah</span>
                        ) : m > 60 ? (
                          <span className="text-amber font-semibold">Margin Sangat Tinggi</span>
                        ) : (
                          <span className="text-emerald font-semibold flex items-center justify-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Rekomendasi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
