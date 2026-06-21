import { NavLink } from "react-router-dom";
import { Home, ArrowRightLeft, PieChart, Settings } from "lucide-react";

export function BottomNav() {
  const linkStyles = ({ isActive }) =>
    `flex flex-col items-center justify-center text-[10px] sm:text-xs gap-1 py-2 transition-all active:scale-95 ${
      isActive
        ? "text-primary font-semibold"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-[0_-5px_15px_rgba(0,0,0,0.05)] md:hidden pb-6 pt-2 px-2">
      <div className="grid w-full grid-cols-4 mx-auto max-w-md">

        <NavLink to="/dashboard" className={linkStyles}>
          <Home className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/transactions" className={linkStyles}>
          <ArrowRightLeft className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
          <span>Transactions</span>
        </NavLink>

        <NavLink to="/budgets" className={linkStyles}>
          <PieChart className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
          <span>Budgets</span>
        </NavLink>

        <NavLink to="/settings" className={linkStyles}>
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
          <span>Settings</span>
        </NavLink>

      </div>
    </nav>
  );
}

export default BottomNav;