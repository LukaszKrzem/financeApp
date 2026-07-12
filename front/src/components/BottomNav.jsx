import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  ArrowRightLeft,
  PieChart,
  Settings,
  MoreHorizontal,
  Wallet,
  Target,
  Plus,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';

export function BottomNav({
  setRefreshing,
  accounts = [],
  categories = [],
  currencies = [],
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const linkStyles = ({ isActive }) =>
    `flex flex-col items-center justify-center text-[10px] sm:text-xs gap-1 py-2 transition-all active:scale-95 ${
      isActive
        ? 'text-primary font-semibold'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  const moreLinks = [
    { to: '/accounts', label: 'Accounts', icon: Wallet },
    { to: '/savings-goals', label: 'Savings Goals', icon: Target },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-[0_-5px_15px_rgba(0,0,0,0.05)] md:hidden pb-6 pt-2 px-2">
        <div className="grid w-full grid-cols-5 mx-auto max-w-md items-end">
          <NavLink to="/dashboard" className={linkStyles}>
            <Home className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/transactions" className={linkStyles}>
            <ArrowRightLeft className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
            <span>Transactions</span>
          </NavLink>

          <div className="flex flex-col items-center justify-end pb-1">
            <AddTransactionDialog
              setRefreshing={setRefreshing}
              accounts={accounts}
              categories={categories}
              currencies={currencies}
              trigger={
                <Button
                  variant="default"
                  size="icon"
                  className="flex flex-col items-center justify-center -mt-6 h-auto w-auto p-0 bg-transparent shadow-none hover:bg-transparent active:scale-95 transition-all"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                    <Plus className="size-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    Add
                  </span>
                </Button>
              }
            />
          </div>

          <NavLink to="/budgets" className={linkStyles}>
            <PieChart className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
            <span>Budgets</span>
          </NavLink>

          <Button
            variant="ghost"
            onClick={() => setMoreOpen(true)}
            className="flex-col h-auto gap-1 py-2 text-[10px] sm:text-xs text-muted-foreground"
          >
            <MoreHorizontal className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5" />
            <span>More</span>
          </Button>
        </div>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>More</DrawerTitle>
            <DrawerDescription className="sr-only">
              Additional navigation options
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-2 p-4 pb-10">
            {moreLinks.map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                variant="outline"
                onClick={() => {
                  navigate(to);
                  setMoreOpen(false);
                }}
                className="justify-start gap-4 p-4 h-auto rounded-xl bg-card hover:bg-muted"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <span className="font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default BottomNav;
