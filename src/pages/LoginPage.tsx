import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/utils/validators";
import { authService } from "@/services/dataProvider";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { setProfile } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const res = await authService.login(data.username, data.password);
    if (res.error) {
      setServerError(res.error);
    } else {
      if (res.profile) setProfile(res.profile);
      navigate("/");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-2xl font-bold text-text-primary">
          Selamat datang kembali 👋
        </h2>
      </div>
      <p className="text-sm text-text-secondary">
        Kelola penjualan dan keuntungan bisnis Anda dengan lebih mudah.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {serverError}
          </motion.div>
        )}

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="Masukkan username"
            {...register("username")}
            className="w-full rounded-xl border border-border bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-error">{errors.username.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan password"
              {...register("password")}
              className="w-full rounded-xl border border-border bg-elevated px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-error">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-emerald px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-emerald/20 cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses masuk...
            </span>
          ) : (
            "Masuk ke Akun"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="font-semibold text-emerald hover:text-emerald-hover transition-colors"
        >
          Daftar sekarang
        </Link>
      </p>
    </motion.div>
  );
}
