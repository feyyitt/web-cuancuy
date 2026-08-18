import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/dataProvider";
import { useAuthStore } from "@/stores/authStore";
import { APP_NAME, NAV_ITEMS } from "@/constants";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calculator,
  Package,
  ShoppingCart,
  Wallet,
  FileBarChart,
  Settings,
  LogOut,
  ChevronLeft,
  User,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Calculator,
  Package,
  ShoppingCart,
  Wallet,
  FileBarChart,
  Settings,
};

export function Sidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const reset = useAuthStore((s) => s.reset);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    const { error } = await authService.logout();
    if (!error) {
      reset();
      navigate("/login");
    }
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="sticky top-0 flex h-screen flex-col border-r border-border bg-surface"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo.png"
              alt={APP_NAME}
              className="h-9 w-9 shrink-0 object-contain drop-shadow-md"
            />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-text-primary whitespace-nowrap"
              >
                {APP_NAME}
              </motion.span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-elevated hover:text-text-secondary transition-colors"
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-emerald/10 text-emerald"
                      : "text-text-secondary hover:bg-elevated hover:text-text-primary"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                {Icon && <Icon className="h-5 w-5 shrink-0" />}
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-1">
          {/* Profile */}
          <div
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated text-text-secondary">
              <User className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {profile?.full_name ?? "User"}
                </p>
                <p className="truncate text-xs text-text-muted">
                  @{profile?.username ?? "user"}
                </p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-error/10 hover:text-error transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-elevated mx-4"
          >
            <h3 className="text-lg font-semibold text-text-primary">
              Apakah kamu yakin ingin keluar?
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              Kamu perlu login kembali untuk mengakses data bisnismu.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-elevated transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-medium text-white hover:bg-error-hover transition-colors"
              >
                Keluar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
