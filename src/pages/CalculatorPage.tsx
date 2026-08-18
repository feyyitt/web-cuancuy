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
} from "@/utils/calculations";
import {
  Calculator,
  Percent,
  Target,
  BarChart3,
  Sliders,
  CheckCircle,
} from "lucide-react";

export function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<"price" | "margin" | "target" | "simulator" | "scenario">(
    "price"
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Kalkulator Bisnis</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Simulasikan penetapan harga jual, target keuntungan, margin profit, dan strategi balik modal.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-border pb-2">
        {[
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
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
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
                onChange={(e) => setPTargetProfit(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-emerald tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Simulasi Jumlah Terjual (pcs)
              </label>
              <input
                type="number"
                min="1"
                value={pQty === 0 ? "" : pQty}
                onChange={(e) => setPQty(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>
          </div>

          {/* Results Card */}
          <div className="rounded-2xl border border-emerald/30 bg-emerald/5 p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-emerald tracking-wider">
                Hasil Rekomendasi
              </span>
              <div className="mt-3">
                <span className="text-xs text-text-muted">Harga Jual Rekomendasi:</span>
                <p className="text-3xl font-extrabold text-emerald tabular-nums">
                  {formatCurrency(pSelling)}
                  <span className="text-sm font-normal text-text-secondary"> / pcs</span>
                </p>
              </div>

              <div className="mt-6 space-y-3 rounded-xl bg-card/80 border border-border p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Untung Bersih per Pcs:</span>
                  <strong className="text-emerald tabular-nums">+{formatCurrency(pProfitPerPcs)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Margin Keuntungan:</span>
                  <strong className="text-emerald tabular-nums">{formatMargin(pMargin)}</strong>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Modal ({pQty} pcs):</span>
                  <span className="text-text-primary tabular-nums">{formatCurrency(pTotalCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Omset Penjualan:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(pTotalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-emerald">Total Keuntungan Bersih:</span>
                  <strong className="font-bold text-emerald tabular-nums">
                    +{formatCurrency(pTotalProfit)}
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted mt-4">
              💡 Formula: Harga Jual = Harga Beli + Target Untung. Margin = (Untung / Harga Jual) × 100%.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TARGET MARGIN PERSEN */}
      {activeTab === "margin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Percent className="h-4 w-4 text-amber" />
              Target Margin Profit (%)
            </h3>
            <p className="text-xs text-text-secondary">
              Hitung harga jual ideal berdasarkan persentase margin keuntungan yang Anda bidik.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Harga Beli / Modal Barang (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={mBuy === 0 ? "" : mBuy}
                onChange={(e) => setMBuy(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold text-text-secondary uppercase">
                  Target Margin Keuntungan: <span className="text-emerald">{mTargetMargin}%</span>
                </label>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                value={mTargetMargin}
                onChange={(e) => setMTargetMargin(Number(e.target.value))}
                className="w-full accent-emerald cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted mt-1">
                <span>5% (Tipis)</span>
                <span>40% (Standar)</span>
                <span>60% (Tinggi)</span>
                <span>90% (Premium)</span>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                Harga Jual dari Margin {mTargetMargin}%
              </span>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-emerald tabular-nums">
                  {formatCurrency(Math.round(mRecommendedPrice))}
                  <span className="text-sm font-normal text-text-secondary"> / pcs</span>
                </p>
              </div>

              <div className="mt-6 space-y-3 rounded-xl bg-elevated/60 p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Harga Modal:</span>
                  <span className="tabular-nums text-text-primary">{formatCurrency(mBuy)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Keuntungan per Pcs:</span>
                  <strong className="text-emerald tabular-nums">+{formatCurrency(mProfitPerPcs)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Margin Real:</span>
                  <strong className="text-emerald tabular-nums">{mTargetMargin}%</strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted mt-4">
              💡 Formula: Harga Jual = Harga Beli / (1 - Target Margin %). Berbeda dengan markup.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: TARGET BALIK MODAL / BEP */}
      {activeTab === "target" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald" />
              Target Balik Modal & Keuntungan
            </h3>
            <p className="text-xs text-text-secondary">
              Berapa pcs produk yang harus Anda jual untuk mengembalikan modal atau mencapai target profit?
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Target Nominal Modal / Keuntungan (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={targetGoal === 0 ? "" : targetGoal}
                onChange={(e) => setTargetGoal(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
              />
              <div className="flex gap-2 mt-2">
                {[500000, 1000000, 2500000, 5000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTargetGoal(amt)}
                    className="flex-1 rounded-lg border border-border bg-elevated/60 py-1 text-[11px] font-medium text-text-secondary hover:bg-emerald/10 hover:text-emerald cursor-pointer"
                  >
                    {amt >= 1000000 ? `${amt / 1000000} Juta` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Keuntungan per Pcs Produk (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={targetProfitPerPcs === 0 ? "" : targetProfitPerPcs}
                onChange={(e) => setTargetProfitPerPcs(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-emerald tabular-nums focus:border-emerald focus:outline-none"
              />
            </div>
          </div>

          {/* Results */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-text-muted tracking-wider">
                Estimasi Target Penjualan
              </span>
              <div className="mt-3">
                <span className="text-xs text-text-muted">Jumlah Produk yang Harus Terjual:</span>
                <p className="text-4xl font-extrabold text-emerald tabular-nums">
                  {formatNumber(targetUnits)}{" "}
                  <span className="text-base font-normal text-text-secondary">pcs</span>
                </p>
              </div>

              <div className="mt-6 space-y-3 rounded-xl bg-elevated/60 p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Target Keuntungan:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(targetGoal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Untung per Pcs:</span>
                  <span className="font-semibold text-emerald tabular-nums">
                    +{formatCurrency(targetProfitPerPcs)}
                  </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-text-secondary">
                  <span>Jika laku 10 pcs / hari:</span>
                  <strong className="text-text-primary">
                    Tercapai dalam {targetProfitPerPcs > 0 ? Math.ceil(targetUnits / 10) : 0} hari
                  </strong>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Jika laku 25 pcs / hari:</span>
                  <strong className="text-emerald">
                    Tercapai dalam {targetProfitPerPcs > 0 ? Math.ceil(targetUnits / 25) : 0} hari
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-text-muted mt-4">
              💡 Formula: Target Unit = Target Nominal / Keuntungan per Pcs.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE SALES SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sliders className="h-4 w-4 text-info" />
              Simulator Volume & Harga Penjualan
            </h3>
            <p className="text-xs text-text-secondary">
              Geser slider untuk melihat dampak perubahan harga dan jumlah penjualan secara real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input 1: Modal Beli */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Harga Modal Beli: <span className="text-text-primary">{formatCurrency(simBuy)}</span>
              </label>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={simBuy}
                onChange={(e) => setSimBuy(Number(e.target.value))}
                className="w-full accent-text-secondary cursor-pointer"
              />
            </div>

            {/* Input 2: Harga Jual */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Harga Jual: <span className="text-emerald font-bold">{formatCurrency(simSell)}</span>
              </label>
              <input
                type="range"
                min="1000"
                max="100000"
                step="500"
                value={simSell}
                onChange={(e) => setSimSell(Number(e.target.value))}
                className="w-full accent-emerald cursor-pointer"
              />
            </div>

            {/* Input 3: Quantity */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                Volume Terjual: <span className="text-amber font-bold">{simQty} pcs</span>
              </label>
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
