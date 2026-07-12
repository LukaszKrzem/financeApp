import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { SectionCards } from '@/components/section-cards';
import { SpendingCategories } from '@/components/spending-categories';
import { RecentTransactions } from '@/components/recent-transactions';

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
            <SpendingCategories />
            <RecentTransactions />
          </div>
        </div>
      </div>
    </div>
  );
}
