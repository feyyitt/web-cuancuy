import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { SalesPage } from "@/pages/SalesPage";
import { CapitalPage } from "@/pages/CapitalPage";
import { CalculatorPage } from "@/pages/CalculatorPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MorePage } from "@/pages/MorePage";
import { useSettingsStore, applyThemeToDOM } from "@/stores/settingsStore";
import { useEffect } from "react";

export function App() {
  const theme = useSettingsStore((s) => s.theme);

  // Apply theme and listen to system theme changes in real-time
  useEffect(() => {
    applyThemeToDOM(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        applyThemeToDOM("system");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/capital" element={<CapitalPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/more" element={<MorePage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
