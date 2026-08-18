import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings } from "@/types";

interface SettingsState {
  settings: AppSettings | null;
  theme: "dark" | "light" | "system";
  setSettings: (settings: AppSettings | null) => void;
  setTheme: (theme: "dark" | "light" | "system") => void;
}

export function applyThemeToDOM(theme: "dark" | "light" | "system") {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  } else if (theme === "dark") {
    root.classList.remove("light");
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    // System theme
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.remove("light");
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: null,
      theme: "dark",
      setSettings: (settings) => set({ settings }),
      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ theme });
      },
    }),
    {
      name: "cuancuy-settings",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDOM(state.theme);
        }
      },
    }
  )
);
