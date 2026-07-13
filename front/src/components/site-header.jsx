import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { IconBell, IconX } from '@tabler/icons-react';
import { AddTransactionDialog } from '@/components/AddTransactionDialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function SiteHeader() {
  const { user, apiUrl, token, onLogout } = useAuth();
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : '';

  const [notifications, setNotifications] = useState([]);

  const { run: runMarkAsRead } = useAsyncAction();
  const { loading: isClearing, run: runMarkAllAsRead } = useAsyncAction();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const data = await apiFetch(
          `${baseUrl}/notifications`,
          token,
          {},
          onLogout
        );
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();

    return () => clearInterval(interval);
  }, [token, baseUrl, onLogout]);

  const handleMarkAsRead = (id) => {
    runMarkAsRead(async () => {
      await apiFetch(
        `${baseUrl}/notifications/${id}/read`,
        token,
        { method: 'PATCH' },
        onLogout
      );
      setNotifications((prev) => prev.filter((n) => n.id_notification !== id));
    });
  };

  const handleMarkAllAsRead = () => {
    if (isClearing) return;

    runMarkAllAsRead(async () => {
      await apiFetch(
        `${baseUrl}/notifications/read-all`,
        token,
        { method: 'PATCH' },
        onLogout
      );
      setNotifications([]);
    });
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 hidden md:block"
        />
        <h1 className="text-base font-medium">
          {user?.name ? `Hello, ${user.name} 👋` : 'Expense Dashboard'}
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <IconBell className="size-4" />
                <span className="sr-only">Notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive animate-pulse" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
              <div className="flex items-center justify-between p-3 border-b bg-muted/20">
                <h4 className="font-semibold text-sm">
                  Notifications ({notifications.length})
                </h4>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleMarkAllAsRead}
                    disabled={isClearing}
                  >
                    {isClearing ? 'Clearing...' : 'Clear all'}
                  </Button>
                )}
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
                            {new Date(item.date).toLocaleTimeString('pl-PL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            - {new Date(item.date).toLocaleDateString('pl-PL')}
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

          <div className="hidden md:flex">
            <AddTransactionDialog />
          </div>
        </div>
      </div>
    </header>
  );
}
