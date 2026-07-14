import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { IconBell, IconX } from '@tabler/icons-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useApi } from '@/hooks/useApi';

export function NotificationsPopover() {
  const { get, patch } = useApi();

  const [notifications, setNotifications] = useState([]);
  const { run: runMarkAsRead } = useAsyncAction();
  const { loading: isClearing, run: runMarkAllAsRead } = useAsyncAction();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await get('/notifications');
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [get]);

  const handleMarkAsRead = (id) => {
    runMarkAsRead(async () => {
      await patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id_notification !== id));
    });
  };

  const handleMarkAllAsRead = () => {
    if (isClearing) return;
    runMarkAllAsRead(async () => {
      await patch('/notifications/read-all');
      setNotifications([]);
    });
  };

  return (
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
  );
}
