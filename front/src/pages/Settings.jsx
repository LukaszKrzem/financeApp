import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';

export default function Settings() {
  const { user, onLogout } = useAuth();

  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <div className="grid gap-6">
        <div className="bg-card border-border/50 border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customize how SmartBudget looks on your device.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="w-32 flex items-center gap-2"
              onClick={() => setTheme('light')}
            >
              <IconSun className="size-4" />
              Light
            </Button>

            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="w-32 flex items-center gap-2"
              onClick={() => setTheme('dark')}
            >
              <IconMoon className="size-4" />
              Dark
            </Button>

            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="w-32 flex items-center gap-2"
              onClick={() => setTheme('system')}
            >
              <IconDeviceDesktop className="size-4" />
              System
            </Button>
          </div>
        </div>
        <div className="bg-card border-border/50 border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <p className="text-sm text-muted-foreground mb-1">
            Logged in as{' '}
            <span className="font-medium text-foreground">{user?.name}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-4">{user?.email}</p>
          <Button variant="destructive" onClick={onLogout}>
            Log out
          </Button>
        </div>

        <div className="bg-card border-border/50 border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <p className="text-sm text-muted-foreground">
            More settings coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
