import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { APP_NAME, APP_TAGLINE } from "@/constants";

export function AuthLayout() {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();

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
          <p className="text-sm text-text-secondary">Memuat...</p>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel - desktop only */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-card p-12">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt={APP_NAME}
            className="h-11 w-11 object-contain drop-shadow-md"
          />
          <span className="text-2xl font-black tracking-tight text-text-primary">{APP_NAME}</span>
        </div>

        <div className="max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold leading-tight text-text-primary"
          >
            Kelola bisnis kamu dengan{" "}
            <span className="text-emerald">lebih mudah</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-text-secondary leading-relaxed"
          >
            {APP_TAGLINE}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-2 gap-4"
          >
            {[
              { label: "Modal Terkelola", value: "100%" },
              { label: "Laporan Real-time", value: "24/7" },
              { label: "Keuntungan Jelas", value: "✓" },
              { label: "Gratis Selamanya", value: "Rp0" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-elevated/50 p-4"
              >
                <p className="text-lg font-bold text-emerald">{item.value}</p>
                <p className="mt-1 text-xs text-text-muted">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="text-xs text-text-muted">
          © 2024 {APP_NAME}. Semua hak dilindungi.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12 safe-area-top safe-area-bottom">
        <div className="w-full max-w-md my-auto">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img
              src="/logo.png"
              alt={APP_NAME}
              className="h-10 w-10 object-contain drop-shadow-md"
            />
            <span className="text-xl font-bold text-text-primary">{APP_NAME}</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
