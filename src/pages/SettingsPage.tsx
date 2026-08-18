import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettingsStore } from "@/stores/settingsStore";
import { authService, settingsService } from "@/services/dataProvider";
import { useAuthStore } from "@/stores/authStore";
import { isMissingCredentials } from "@/lib/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Database,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export function SettingsPage() {
  const { profile } = useAuth();
  const { theme, setTheme } = useSettingsStore();
  const { setProfile, reset } = useAuthStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsUpdatingProfile(true);
    const res = await authService.updateProfile(profile.id, { full_name: fullName });
    if (res.error) {
      toast.error(res.error);
    } else {
      setProfile({ ...profile, full_name: fullName });
      toast.success("Profil berhasil diperbarui!");
    }
    setIsUpdatingProfile(false);
  };

  const handleLogout = async () => {
    const { error } = await authService.logout();
    if (!error) {
      reset();
      navigate("/login");
      toast.success("Berhasil keluar dari akun.");
    }
  };

  const handleResetData = async () => {
    await settingsService.resetAllData();
    setShowResetConfirm(false);
    toast.success("Semua data bisnis telah direset.");
    window.location.reload();
  };

  const themeOptions = [
    { value: "dark" as const, label: "Gelap (Dark)", icon: Moon },
    { value: "light" as const, label: "Terang (Light)", icon: Sun },
    { value: "system" as const, label: "Sistem", icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Pengaturan</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Kelola profil pengguna, preferensi tampilan, dan database bisnis Anda.
        </p>
      </div>

      {/* Backend Status Card */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald/10 p-3 text-emerald">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary">Status Database</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isMissingCredentials
                    ? "bg-amber/10 text-amber border border-amber/20"
                    : "bg-emerald/10 text-emerald border border-emerald/20"
                }`}
              >
                {isMissingCredentials ? "Mode Standalone (Lokal)" : "Supabase Cloud"}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {isMissingCredentials
                ? "Data tersimpan otomatis di browser Anda. Untuk multi-device, konfigurasikan file .env."
                : "Terhubung aman dengan Supabase PostgreSQL & Row Level Security (RLS)."}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-emerald" />
          Profil Bisnis
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
              Nama Lengkap / Nama Bisnis
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
              className="w-full rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary focus:border-emerald focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">
              Username
            </label>
            <input
              type="text"
              disabled
              value={profile?.username || "user"}
              className="w-full rounded-xl border border-border bg-elevated/50 px-4 py-2.5 text-sm text-text-muted cursor-not-allowed"
            />
            <p className="text-[11px] text-text-muted mt-1">Username digunakan sebagai tanda pengenal akun.</p>
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-hover transition-colors shadow-md shadow-emerald/20 cursor-pointer disabled:opacity-50"
          >
            {isUpdatingProfile ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </form>
      </div>

      {/* Appearance Section */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <Moon className="h-4 w-4 text-emerald" />
          Tampilan Tema
        </h3>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-xs font-semibold transition-all cursor-pointer ${
                theme === opt.value
                  ? "border-emerald bg-emerald/10 text-emerald shadow-sm"
                  : "border-border bg-elevated/40 text-text-secondary hover:bg-elevated hover:text-text-primary"
              }`}
            >
              <opt.icon className="h-5 w-5" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-error" />
          Kelola Data Bisnis
        </h3>
        <p className="text-xs text-text-secondary">
          Hapus dan bersihkan seluruh data transaksi, stok produk, dan catatan kas dari akun Anda.
        </p>

        <div className="pt-1">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-xs font-semibold text-error hover:bg-error/20 transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Reset Semua Data Bisnis</span>
          </button>
        </div>
      </div>

      {/* Account / Logout */}
      <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text-primary">Keluar dari Aplikasi</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Sesi Anda akan berakhir dan Anda dapat masuk kembali kapan saja.
          </p>
        </div>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-2 rounded-xl bg-error/10 border border-error/20 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>

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
              <h3 className="text-lg font-bold text-text-primary">Apakah Anda yakin ingin keluar?</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Anda dapat login kembali dengan username Anda untuk mengakses data bisnis.
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

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
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
                <h3 className="text-lg font-bold text-text-primary">Reset Semua Data?</h3>
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Tindakan ini akan menghapus semua produk, riwayat penjualan, dan modal yang pernah dicatat.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetData}
                  className="rounded-xl bg-error px-5 py-2 text-sm font-semibold text-white hover:bg-error-hover cursor-pointer"
                >
                  Ya, Reset Semua
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
