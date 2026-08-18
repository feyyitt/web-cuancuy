import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/utils/validators";
import { authService } from "@/services/dataProvider";
import { useAuthStore } from "@/stores/authStore";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Lemah", color: "bg-error" };
  if (score <= 2) return { score, label: "Cukup", color: "bg-amber" };
  if (score <= 3) return { score, label: "Kuat", color: "bg-emerald" };
  return { score, label: "Sangat Kuat", color: "bg-emerald" };
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { setProfile, setUser, setSession } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const res = await authService.register(
      data.full_name,
      data.username,
      data.password
    );
    if (res.error) {
      setServerError(res.error);
    } else {
      if (res.user) setProfile(res.user);
      setUser({ id: res.user?.id || "user", email: `${data.username}@cuancuy.app` } as any);
      setSession({ access_token: "token", user: { id: res.user?.id || "user" } } as any);
      navigate("/");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h2 className="text-2xl font-bold text-text-primary">
        Buat akun baru 🚀
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Mulai kelola bisnis dan keuntunganmu sekarang.
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

        {/* Full Name */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Nama Lengkap
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Contoh: Budi Santoso"
            {...register("full_name")}
            className="w-full rounded-xl border border-border bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-error">{errors.full_name.message}</p>
          )}
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="reg-username"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Username
          </label>
          <input
            id="reg-username"
            type="text"
            autoComplete="username"
            placeholder="Pilih username unik"
            {...register("username")}
            className="w-full rounded-xl border border-border bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
          />
          {errors.username && (
            <p className="mt-1 text-xs text-error">{errors.username.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
              {...register("password")}
              className="w-full rounded-xl border border-border bg-elevated px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Password strength indicator */}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= passwordStrength.score
                        ? passwordStrength.color
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Kekuatan password:{" "}
                <span
                  className={
                    passwordStrength.score <= 1
                      ? "text-error"
                      : passwordStrength.score <= 2
                      ? "text-amber"
                      : "text-emerald"
                  }
                >
                  {passwordStrength.label}
                </span>
              </p>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-xs text-error">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Ulangi password"
              {...register("confirm_password")}
              className="w-full rounded-xl border border-border bg-elevated px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:border-emerald focus:outline-none focus:ring-1 focus:ring-emerald transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="mt-1 text-xs text-error">
              {errors.confirm_password.message}
            </p>
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
              Membuat akun...
            </span>
          ) : (
            "Daftar & Mulai Bisnis"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Sudah punya akun?{" "}
        <Link
          to="/login"
          className="font-medium text-emerald hover:text-emerald-hover transition-colors"
        >
          Masuk di sini
        </Link>
      </p>
    </motion.div>
  );
}
