import { useState, useEffect } from "react";
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
import { IconBell, IconPlus, IconX } from "@tabler/icons-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { no } from "zod/locales";

export function SiteHeader({ user, token, setRefreshing }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8000/notifications", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:8000/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.id_notification !== id),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <IconBell className="size-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
              <div className="p-3 border-b bg-muted/20">
                <h4 className="font-semibold text-sm">
                  Notifications ({notifications.length})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">
                    No new notifications
                  </p>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((item) => (
                      <div
                        key={item.id_notification}
                        className="flex items-start justify-between p-3 border-b last:border-0 hover:bg-muted/40 transition-colors gap-2"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-foreground font-medium leading-normal">
                            {item.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.date).toLocaleTimeString("pl-PL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            - {new Date(item.date).toLocaleDateString("pl-PL")}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleMarkAsRead(item.id_notification)}
                        >
                          <IconX className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {token && (
            <AddTransactionDialog
              user={user}
              token={token}
              setRefreshing={setRefreshing}
              accountId={accountId}
              categoryId={categoryId}
              accounts={accounts}
            />
          )}
        </div>
      </div>
    </header>
  );
}
