import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, ArrowRightLeft, PieChart, Settings, MoreHorizontal, Wallet, Target } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const linkStyles = ({ isActive }) =>
    `flex flex-col items-center justify-center text-[10px] sm:text-xs gap-1 py-2 transition-all active:scale-95 ${
      isActive
        ? "text-primary font-semibold"
        : "text-muted-foreground hover:text-foreground"
    }`;

  const moreLinks = [
    { to: "/accounts", label: "Accounts", icon: Wallet },
    { to: "/savings-goals", label: "Savings Goals", icon: Target },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-[0_-5px_15px_rgba(0,0,0,0.05)] md:hidden pb-6 pt-2 px-2">
        <div className="grid w-full grid-cols-5 mx-auto max-w-md">
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

          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center text-[10px] sm:text-xs gap-1 py-2 transition-all active:scale-95 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-2 p-4 pb-10">
            {moreLinks.map(({ to, label, icon: Icon }) => (
              <button
                key={to}
                onClick={() => {
                  navigate(to);
                  setMoreOpen(false);
                }}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted transition-colors text-left"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default BottomNav;