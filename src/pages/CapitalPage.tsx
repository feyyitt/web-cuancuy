import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { capitalService, expenseService, productService, salesService } from "@/services/dataProvider";
import { formatCurrency } from "@/utils/currency";
import { EXPENSE_CATEGORIES } from "@/constants";
import type { CapitalTransaction, CapitalFormData, Expense, ExpenseFormData, Product, Sale } from "@/types";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Package,
  Receipt,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export function CapitalPage() {
  const [activeTab, setActiveTab] = useState<"capital" | "expenses">("capital");
  const [capitalList, setCapitalList] = useState<CapitalTransaction[]>([]);
  const [expenseList, setExpenseList] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Modals
  const [isAddCapitalOpen, setIsAddCapitalOpen] = useState(false);
  const [editingCapital, setEditingCapital] = useState<CapitalTransaction | null>(null);
  const [deletingCapital, setDeletingCapital] = useState<CapitalTransaction | null>(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Form states
  const [capitalForm, setCapitalForm] = useState<CapitalFormData>({
    type: "add_capital",
    amount: 500000,
    description: "",
  });

  const [editCapitalForm, setEditCapitalForm] = useState<CapitalFormData>({
    type: "initial_capital",
    amount: 1500000,
    description: "",
  });

  const [expenseForm, setExpenseForm] = useState<ExpenseFormData>({
    category: EXPENSE_CATEGORIES[0],
    amount: 25000,
    description: "",
  });

  const loadData = async () => {
    const [cap, exp, prods, s] = await Promise.all([
      capitalService.getAll(),
      expenseService.getAll(),
      productService.getAll(),
      salesService.getAll(),
    ]);
    setCapitalList(cap);
    setExpenseList(exp);
    setProducts(prods);
    setSales(s);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Calculations
  const summary = useMemo(() => {
    let initialCapital = 0;
    let addedCapital = 0;
    let withdrawnCapital = 0;

    for (const c of capitalList) {
      const amt = Number(c.amount);
      if (c.type === "initial_capital") initialCapital += amt;
      else if (c.type === "add_capital") addedCapital += amt;
      else if (c.type === "withdrawal") withdrawnCapital += amt;
    }

    const totalCapitalDeposited = initialCapital + addedCapital - withdrawnCapital;

    // Inventory Value (Modal yang tertanam dalam stok barang)
    const inventoryValue = products.reduce((acc, p) => acc + p.purchase_price * p.stock, 0);

    // Total Revenue from sales
    const totalRevenue = sales.reduce((acc, s) => acc + Number(s.total_revenue), 0);

    // Total Expenses
    const totalExpenses = expenseList.reduce((acc, e) => acc + Number(e.amount), 0);

    // Cash Available = Modal Bersih Disetor + Omset Penjualan - Nilai Modal Stok Saat Ini - Biaya Operasional
    const cashAvailable = Math.max(0, totalCapitalDeposited + totalRevenue - inventoryValue - totalExpenses);

    return {
      initialCapital,
      addedCapital,
      withdrawnCapital,
      totalCapitalDeposited,
      inventoryValue,
      totalExpenses,
      cashAvailable,
    };
  }, [capitalList, expenseList, products, sales]);

  const handleSaveCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capitalForm.amount <= 0) {
      toast.error("Nominal modal harus lebih dari Rp0");
      return;
    }

    const res = await capitalService.addTransaction(capitalForm);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      setCapitalList([res.data, ...capitalList]);
      toast.success("Transaksi modal berhasil disimpan");
      setIsAddCapitalOpen(false);
      setCapitalForm({ type: "add_capital", amount: 500000, description: "" });
    }
  };

  const handleOpenEditCapital = (c: CapitalTransaction) => {
    setEditingCapital(c);
    setEditCapitalForm({
      type: c.type,
      amount: Number(c.amount),
      description: c.description || "",
    });
  };

  const handleUpdateCapital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCapital) return;
    if (editCapitalForm.amount <= 0) {
      toast.error("Nominal modal harus lebih dari Rp0");
      return;
    }

    const res = await capitalService.updateTransaction(editingCapital.id, editCapitalForm);
    if (res.error) {
      toast.error(res.error);
    } else {
      setCapitalList(
        capitalList.map((c) =>
          c.id === editingCapital.id
            ? {
                ...c,
                type: editCapitalForm.type,
                amount: Number(editCapitalForm.amount),
                description: editCapitalForm.description?.trim() || null,
              }
            : c
        )
      );
      toast.success("✓ Saldo modal berhasil diperbarui!");
      setEditingCapital(null);
    }
  };

  const handleDeleteCapitalConfirm = async () => {
    if (!deletingCapital) return;
    const res = await capitalService.delete(deletingCapital.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      setCapitalList(capitalList.filter((c) => c.id !== deletingCapital.id));
      toast.success("Catatan modal berhasil dihapus");
      setDeletingCapital(null);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseForm.amount <= 0) {
      toast.error("Nominal pengeluaran harus lebih dari Rp0");
      return;
    }

    const res = await expenseService.addExpense(expenseForm);
    if (res.error) {
      toast.error(res.error);
    } else if (res.data) {
      setExpenseList([res.data, ...expenseList]);
      toast.success("Biaya operasional berhasil dicatat");
      setIsAddExpenseOpen(false);
      setExpenseForm({ category: EXPENSE_CATEGORIES[0], amount: 25000, description: "" });
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
    const res = await expenseService.delete(deletingExpense.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      setExpenseList(expenseList.filter((e) => e.id !== deletingExpense.id));
      toast.success("Pengeluaran berhasil dihapus");
      setDeletingExpense(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Modal & Kas Bisnis</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Lacak modal awal, tambahan modal, penarikan, nilai aset stok, dan biaya operasional.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-elevated transition-colors cursor-pointer"
          >
            <Receipt className="h-4 w-4 text-amber" />
            <span>Catat Pengeluaran</span>
          </button>
          <button
            onClick={() => setIsAddCapitalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] transition-all shadow-md shadow-emerald/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Kelola Modal</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Capital */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase">Total Modal Disetor</span>
            <div className="rounded-xl bg-emerald/10 p-2 text-emerald">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-text-primary">
            {formatCurrency(summary.totalCapitalDeposited)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Modal Awal: {formatCurrency(summary.initialCapital)}
          </p>
        </div>

        {/* Inventory Value (Modal Jadi Stok) */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase">Modal Jadi Stok</span>
            <div className="rounded-xl bg-info/10 p-2 text-info">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-info">
            {formatCurrency(summary.inventoryValue)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Aset barang tersedia ({products.reduce((a, p) => a + p.stock, 0)} pcs)
          </p>
        </div>

        {/* Estimated Available Cash */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase">Estimasi Kas Tersedia</span>
            <div className="rounded-xl bg-emerald/10 p-2 text-emerald">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-emerald">
            {formatCurrency(summary.cashAvailable)}
          </p>
          <p className="mt-1 text-xs text-text-muted">Kas siap pakai untuk operasional</p>
        </div>

        {/* Total Expenses */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-muted uppercase">Biaya Operasional</span>
            <div className="rounded-xl bg-amber/10 p-2 text-amber">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-amber">
            {formatCurrency(summary.totalExpenses)}
          </p>
          <p className="mt-1 text-xs text-text-muted">Pengemasan, kirim, iklan, dll.</p>
        </div>
      </div>

      {/* Info Notice about Financial Principles */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4 text-xs text-text-secondary">
        <Info className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
        <p>
          <strong>Prinsip Keuangan Cuan Cuy:</strong> Pembelian stok barang dihitung sebagai{" "}
          <strong>Aset Inventaris</strong> (bukan langsung kerugian). Laba dihitung saat barang berhasil
          terjual per pcs, dikurangi biaya operasional.
        </p>
      </div>

      {/* Tabs for Capital vs Expenses */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border bg-elevated/20">
          <button
            onClick={() => setActiveTab("capital")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "capital"
                ? "border-emerald text-emerald bg-card"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Riwayat Transaksi Modal ({capitalList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "expenses"
                ? "border-amber text-amber bg-card"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Biaya Operasional ({expenseList.length})</span>
          </button>
        </div>

        {/* Tab 1: Capital Transactions */}
        {activeTab === "capital" && (
          <div>
            {capitalList.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-semibold text-text-primary">Belum ada catatan modal</p>
                <p className="mt-1 text-xs text-text-muted">
                  Klik tombol "Kelola Modal" untuk mencatat modal awal bisnismu.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-elevated/40 text-xs font-semibold text-text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Tipe Transaksi</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {capitalList.map((c) => {
                      const isWithdrawal = c.type === "withdrawal";
                      const isInitial = c.type === "initial_capital";

                      return (
                        <tr key={c.id} className="hover:bg-elevated/30 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-text-muted">
                            {new Date(c.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isInitial
                                  ? "bg-emerald/10 text-emerald border border-emerald/20"
                                  : isWithdrawal
                                  ? "bg-error/10 text-error border border-error/20"
                                  : "bg-info/10 text-info border border-info/20"
                              }`}
                            >
                              {isWithdrawal ? (
                                <ArrowDownLeft className="h-3 w-3" />
                              ) : (
                                <ArrowUpRight className="h-3 w-3" />
                              )}
                              {isInitial
                                ? "Modal Awal"
                                : isWithdrawal
                                ? "Penarikan Modal"
                                : "Tambah Modal"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-text-secondary text-xs">
                            {c.description || "-"}
                          </td>
                          <td
                            className={`px-4 py-3.5 text-right font-bold tabular-nums ${
                              isWithdrawal ? "text-error" : "text-emerald"
                            }`}
                          >
                            {isWithdrawal ? "-" : "+"}
                            {formatCurrency(c.amount)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditCapital(c)}
                                title="Edit Saldo Modal"
                                className="rounded-lg p-1.5 text-text-muted hover:bg-elevated hover:text-text-primary transition-colors cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingCapital(c)}
                                title="Hapus Catatan Modal"
                                className="rounded-lg p-1.5 text-text-muted hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Expenses */}
        {activeTab === "expenses" && (
          <div>
            {expenseList.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-semibold text-text-primary">Belum ada biaya operasional</p>
                <p className="mt-1 text-xs text-text-muted">
                  Catat pengeluaran seperti kemasan kardus/plastik, ongkir, iklan, atau biaya admin marketplace.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-elevated/40 text-xs font-semibold text-text-muted uppercase">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Keterangan</th>
                      <th className="px-4 py-3 text-right">Nominal Biaya</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {expenseList.map((e) => (
                      <tr key={e.id} className="hover:bg-elevated/30 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-text-muted">
                          {new Date(e.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-2.5 py-0.5 text-xs font-medium text-amber border border-amber/20">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary text-xs">{e.description || "-"}</td>
                        <td className="px-4 py-3.5 text-right font-bold tabular-nums text-text-primary">
                          {formatCurrency(e.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setDeletingExpense(e)}
                            title="Hapus Biaya"
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
        )}
      </div>

      {/* ADD CAPITAL MODAL */}
      <AnimatePresence>
        {isAddCapitalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddCapitalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald" />
                  Tambah / Tarik Modal
                </h3>
                <button
                  onClick={() => setIsAddCapitalOpen(false)}
                  className="rounded-lg p-1 text-text-muted hover:bg-elevated cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCapital} className="mt-4 space-y-4">
                {/* Transaction Type Radio */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                    Jenis Transaksi Modal
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCapitalForm({ ...capitalForm, type: "add_capital" })}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        capitalForm.type === "add_capital"
                          ? "bg-emerald/15 border-emerald text-emerald font-bold"
                          : "border-border bg-elevated/40 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Tambah Modal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCapitalForm({ ...capitalForm, type: "withdrawal" })}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        capitalForm.type === "withdrawal"
                          ? "bg-error/15 border-error text-error font-bold"
                          : "border-border bg-elevated/40 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                      <span>Tarik Modal</span>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Nominal Modal (Rp) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capitalForm.amount === 0 ? "" : capitalForm.amount}
                    onChange={(e) =>
                      setCapitalForm({
                        ...capitalForm,
                        amount: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      })
                    }
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex gap-1.5 mt-2">
                    {[100000, 500000, 1000000, 2000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCapitalForm({ ...capitalForm, amount: amt })}
                        className="flex-1 rounded-lg border border-border bg-elevated/60 py-1 text-[11px] font-medium text-text-secondary hover:bg-emerald/10 hover:text-emerald cursor-pointer"
                      >
                        {amt >= 1000000 ? `${amt / 1000000} Juta` : `${amt / 1000}rb`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Catatan / Sumber Dana (Opsional)
                  </label>
                  <input
                    type="text"
                    value={capitalForm.description}
                    onChange={(e) => setCapitalForm({ ...capitalForm, description: e.target.value })}
                    placeholder="Contoh: Tabungan pribadi / Suntikan modal"
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCapitalOpen(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover shadow-md shadow-emerald/20 cursor-pointer"
                  >
                    Simpan Modal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT CAPITAL / SALDO MODAL */}
      <AnimatePresence>
        {editingCapital && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCapital(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-emerald" />
                  Edit Saldo / Catatan Modal
                </h3>
                <button
                  onClick={() => setEditingCapital(null)}
                  className="rounded-lg p-1 text-text-muted hover:bg-elevated cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCapital} className="mt-4 space-y-4">
                {/* Transaction Type */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
                    Jenis Transaksi Modal
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditCapitalForm({ ...editCapitalForm, type: "initial_capital" })}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        editCapitalForm.type === "initial_capital"
                          ? "bg-emerald/15 border-emerald text-emerald font-bold"
                          : "border-border bg-elevated/40 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <span>Modal Awal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditCapitalForm({ ...editCapitalForm, type: "add_capital" })}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        editCapitalForm.type === "add_capital"
                          ? "bg-info/15 border-info text-info font-bold"
                          : "border-border bg-elevated/40 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <span>Tambah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditCapitalForm({ ...editCapitalForm, type: "withdrawal" })}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        editCapitalForm.type === "withdrawal"
                          ? "bg-error/15 border-error text-error font-bold"
                          : "border-border bg-elevated/40 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <span>Tarik</span>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Nominal Saldo Modal (Rp) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editCapitalForm.amount === 0 ? "" : editCapitalForm.amount}
                    onChange={(e) =>
                      setEditCapitalForm({
                        ...editCapitalForm,
                        amount: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      })
                    }
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                  />
                  {/* Preset quick buttons */}
                  <div className="flex gap-1.5 mt-2">
                    {[500000, 1000000, 1500000, 2000000, 5000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setEditCapitalForm({ ...editCapitalForm, amount: amt })}
                        className="flex-1 rounded-lg border border-border bg-elevated/60 py-1 text-[11px] font-medium text-text-secondary hover:bg-emerald/10 hover:text-emerald cursor-pointer"
                      >
                        {amt >= 1000000 ? `${amt / 1000000}Jt` : `${amt / 1000}rb`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Catatan / Keterangan
                  </label>
                  <input
                    type="text"
                    value={editCapitalForm.description}
                    onChange={(e) => setEditCapitalForm({ ...editCapitalForm, description: e.target.value })}
                    placeholder="Contoh: Modal Awal Bisnis"
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCapital(null)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover shadow-md shadow-emerald/20 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CAPITAL MODAL */}
      <AnimatePresence>
        {deletingCapital && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingCapital(null)}
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
                <h3 className="text-lg font-bold text-text-primary">Hapus Transaksi Modal?</h3>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Hapus catatan modal sebesar <strong>{formatCurrency(deletingCapital.amount)}</strong>?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCapital(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCapitalConfirm}
                  className="rounded-xl bg-error px-5 py-2.5 text-sm font-semibold text-white hover:bg-error-hover cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD EXPENSE MODAL */}
      <AnimatePresence>
        {isAddExpenseOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddExpenseOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber" />
                  Catat Biaya Operasional
                </h3>
                <button
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="rounded-lg p-1 text-text-muted hover:bg-elevated cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-emerald focus:outline-none cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Nominal Biaya (Rp) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expenseForm.amount === 0 ? "" : expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({
                        ...expenseForm,
                        amount: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                      })
                    }
                    placeholder="0"
                    required
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm font-bold text-text-primary tabular-nums focus:border-emerald focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
                    Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="Contoh: Beli bubble wrap 1 roll"
                    className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-hover shadow-md shadow-amber/20 cursor-pointer"
                  >
                    Simpan Biaya
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE EXPENSE MODAL */}
      <AnimatePresence>
        {deletingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingExpense(null)}
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
                <h3 className="text-lg font-bold text-text-primary">Hapus Pengeluaran?</h3>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Hapus catatan biaya "{deletingExpense.category}" sebesar{" "}
                {formatCurrency(deletingExpense.amount)}?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingExpense(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteExpense}
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
