import { NavLink } from "react-router-dom";
import { MOBILE_NAV_ITEMS } from "@/constants";
import {
  LayoutDashboard,
  Calculator,
  Package,
  ShoppingCart,
  MoreHorizontal,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Calculator,
  Package,
  ShoppingCart,
  MoreHorizontal,
};

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-xl safe-area-bottom shadow-2xl">
      <div className="flex items-center justify-around px-1 py-1.5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[60px] min-h-[48px] px-2 py-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "text-emerald bg-emerald/10 font-bold"
                    : "text-text-muted hover:text-text-secondary active:scale-95"
                }`
              }
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
