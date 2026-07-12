import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout({
  accounts,
  categories,
  currencies,
  setRefreshing,
}) {
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }}
    >
      <div className="hidden md:block">
        <AppSidebar variant="inset" />
      </div>
      <SidebarInset>
        <SiteHeader
          setRefreshing={setRefreshing}
          categories={categories}
          currencies={currencies}
          accounts={accounts}
        />

        <div className="flex flex-1 flex-col pb-24 md:pb-0">
          <Outlet />
        </div>
      </SidebarInset>

      <BottomNav
        setRefreshing={setRefreshing}
        accounts={accounts}
        categories={categories}
        currencies={currencies}
      />
    </SidebarProvider>
  );
}
