import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";

export default function Settings({ user, token, onLogout }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-card border-border/50 border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Customize how SpendWise looks on your device.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="w-32 flex items-center gap-2"
              onClick={() => setTheme("light")}
            >
              <IconSun className="size-4" />
              Light
            </Button>

            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="w-32 flex items-center gap-2"
              onClick={() => setTheme("dark")}
            >
              <IconMoon className="size-4" />
              Dark
            </Button>

            <Button
              variant={theme === "system" ? "default" : "outline"}
              className="w-32 flex items-center gap-2"
              onClick={() => setTheme("system")}
            >
              <IconDeviceDesktop className="size-4" />
              System
            </Button>
          </div>
        </div>

        <div className="bg-card border-border/50 border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <p className="text-sm text-muted-foreground">
            More settings coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
