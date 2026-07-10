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

export function SiteHeader({
  user,
  token,
  setRefreshing,
  categories = [],
  accounts = [],
  currencies = [],
  apiUrl,
}) {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : '';

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${baseUrl}/notifications`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          console.warn('Session expired. Logging out...');

          localStorage.removeItem('token');

          window.location.href = '/login';
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const interval = setInterval(fetchNotifications, 30000);

    fetchNotifications();

    return () => clearInterval(interval);
  }, [token, apiUrl]);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${baseUrl}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.id_notification !== id)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${baseUrl}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
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
                  >
                    Clear all
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
                            })}{' '}
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

          {token && (
            <div className="hidden md:flex">
              <AddTransactionDialog
                token={token}
                setRefreshing={setRefreshing}
                categories={categories}
                accounts={accounts}
                currencies={currencies}
                apiUrl={apiUrl}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
