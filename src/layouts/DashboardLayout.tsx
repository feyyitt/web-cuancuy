import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { Toaster } from "sonner";
import { APP_NAME } from "@/constants";

export function DashboardLayout() {
  const { isAuthenticated, isLoading, isInitialized, profile } = useAuth();

  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <img
            src="/logo.png"
            alt={APP_NAME}
            className="h-16 w-16 object-contain drop-shadow-xl animate-pulse"
          />
          <p className="text-sm font-medium text-text-secondary">Memuat data bisnis...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      {/* Desktop Sidebar (visible on md screens and up) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Top Header (visible on mobile only) */}
        <header className="sticky top-0 z-30 flex md:hidden items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md safe-area-top">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt={APP_NAME}
              className="h-8 w-8 object-contain drop-shadow-sm"
            />
            <span className="text-base font-extrabold tracking-tight text-text-primary">
              {APP_NAME}
            </span>
          </Link>

          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-xl border border-border bg-elevated/70 px-2.5 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald/20 text-emerald">
              <User className="h-3 w-3" />
            </div>
            <span className="max-w-[90px] truncate">{profile?.full_name?.split(" ")[0] || "Akun"}</span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-24 md:pb-8">
          <div className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible on mobile only) */}
      <div className="block md:hidden">
        <MobileNav />
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          className: "!bg-card !text-text-primary !border-border !shadow-2xl !rounded-2xl",
        }}
      />
    </div>
  );
}
