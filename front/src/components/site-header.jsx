import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconBell, IconPlus } from "@tabler/icons-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

export function SiteHeader({ user, token, setRefreshing }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Expense Dashboard</h1>
        <div className="ml-auto flex items-center gap-3">
          <Select defaultValue="may">
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="may">May 2026</SelectItem>
              <SelectItem value="apr">April 2026</SelectItem>
              <SelectItem value="mar">March 2026</SelectItem>
              <SelectItem value="feb">February 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="relative">
            <IconBell className="size-4" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
          </Button>
          {token && (
            <AddTransactionDialog
              user={user}
              token={token}
              setRefreshing={setRefreshing}
            />
          )}
        </div>
      </div>
    </header>
  );
}
