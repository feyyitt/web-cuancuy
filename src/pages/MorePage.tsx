import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/dataProvider";
import { useAuthStore } from "@/stores/authStore";
import { isMissingCredentials } from "@/lib/supabase/client";
import {
  Wallet,
  FileBarChart,
  Settings,
  Calculator,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const moreLinks = [
  {
    label: "Modal & Kas Bisnis",
    path: "/capital",
    icon: Wallet,
    color: "text-emerald",
    bg: "bg-emerald/10",
    description: "Kelola modal disetor, nilai stok, & biaya operasional",
  },
  {
    label: "Laporan Keuangan",
    path: "/reports",
    icon: FileBarChart,
    color: "text-info",
    bg: "bg-info/10",
    description: "Laporan Laba Rugi, performa produk, & ekspor CSV",
  },
  {
    label: "Kalkulator & Simulasi",
    path: "/calculator",
    icon: Calculator,
    color: "text-amber",
    bg: "bg-amber/10",
    description: "Hitung harga jual, target margin %, & simulasi penjualan",
  },
  {
    label: "Pengaturan & Preferensi",
    path: "/settings",
    icon: Settings,
    color: "text-text-primary",
    bg: "bg-elevated",
    description: "Profil, tema gelap/terang, & kelola data bisnis",
  },
];

export function MorePage() {
  const { profile } = useAuth();
  const { reset } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    const { error } = await authService.logout();
    if (!error) {
      reset();
      navigate("/login");
      toast.success("Berhasil keluar dari akun.");
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Menu Lainnya</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Akses seluruh modul dan pengaturan bisnis Cuan Cuy Anda.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-emerald font-bold text-lg">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">{profile?.full_name || "User"}</h3>
            <p className="text-xs text-text-muted">@{profile?.username || "user"}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            isMissingCredentials
              ? "bg-amber/10 text-amber border-amber/20"
              : "bg-emerald/10 text-emerald border-emerald/20"
          }`}
        >
          {isMissingCredentials ? "Mode Standalone" : "Supabase Cloud"}
        </span>
      </div>

      {/* Menu Links List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2.5"
      >
        {moreLinks.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5 hover:bg-elevated hover:border-emerald/30 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text-primary truncate">{item.label}</p>
                <p className="text-xs text-text-muted truncate">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0 ml-2" />
          </Link>
        ))}
      </motion.div>

      {/* Logout button */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-error/30 bg-error/10 p-3.5 text-sm font-bold text-error hover:bg-error hover:text-white transition-all cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        <span>Keluar dari Akun</span>
      </button>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-text-primary">Keluar dari akun?</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Anda dapat masuk kembali kapan saja untuk melanjutkan pencatatan bisnis.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-white hover:bg-error-hover cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
