import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconFingerprint,
  IconTrash,
  IconPlus,
  IconPalette,
  IconUser,
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import {
  isBiometricSupported,
  getUserBiometricCredentials,
  registerBiometricDevice,
  deleteBiometricCredential,
} from '@/lib/webauthn';
import { toast } from 'sonner';

export default function Settings() {
  const { user, token, apiUrl, onLogout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [credentials, setCredentials] = useState([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const biometricSupported = isBiometricSupported();

  const fetchCredentials = useCallback(async () => {
    if (!token || !biometricSupported) return;
    setLoadingCredentials(true);
    try {
      const data = await getUserBiometricCredentials(apiUrl, token);
      setCredentials(data || []);
    } catch (err) {
      console.error('Failed to load biometric credentials:', err);
    } finally {
      setLoadingCredentials(false);
    }
  }, [apiUrl, token, biometricSupported]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await registerBiometricDevice(
        apiUrl,
        token,
        deviceName.trim() || undefined
      );
      toast.success('Biometric device added successfully!');
      setDeviceName('');
      fetchCredentials();
    } catch (err) {
      console.error('Biometric registration error:', err);
      toast.error('Failed to register biometric device', {
        description: err.message,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBiometricCredential(
        apiUrl,
        token,
        deleteTarget.id_credential
      );
      toast.success('Device removed successfully');
      setDeleteTarget(null);
      fetchCredentials();
    } catch (err) {
      toast.error('Failed to remove device', {
        description: err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <div className="grid gap-6">
        <div className="bg-card border-border/50 border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <IconPalette className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
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

        {/* Biometrics & Passkeys Section */}
        <div className="bg-card border-border/50 border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <IconFingerprint className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Biometrics & Passkeys</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Securely sign in using Face ID, fingerprint, or device PIN without
            entering a password.
          </p>

          {!biometricSupported ? (
            <p className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
              Your browser or device does not support WebAuthn biometric
              verification.
            </p>
          ) : (
            <div className="space-y-6">
              <form
                onSubmit={handleRegister}
                className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
              >
                <Input
                  placeholder="Device name (e.g., My Phone)"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  disabled={registering}
                  className="max-w-xs"
                />
                <Button type="submit" disabled={registering} className="gap-2">
                  <IconPlus className="size-4" />
                  {registering ? 'Registering...' : 'Add this device'}
                </Button>
              </form>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Registered devices ({credentials.length})
                </h3>

                {loadingCredentials ? (
                  <p className="text-sm text-muted-foreground">
                    Loading devices...
                  </p>
                ) : credentials.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No registered biometric devices. Add your current device
                    above.
                  </p>
                ) : (
                  <div className="divide-y divide-border/40 border border-border/50 rounded-lg overflow-hidden">
                    {credentials.map((cred) => (
                      <div
                        key={cred.id_credential}
                        className="flex items-center justify-between p-4 bg-background/50 hover:bg-background transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <IconFingerprint className="size-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {cred.device_name || 'Biometric Device'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Added:{' '}
                              {new Date(cred.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(cred)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border-border/50 border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <IconUser className="size-6 text-primary" />
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Logged in as{' '}
            <span className="font-medium text-foreground">{user?.name}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">{user?.email}</p>
          <Button variant="destructive" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Biometric Device"
        description={`Are you sure you want to remove the device "${deleteTarget?.device_name || 'Biometric Device'}"? You will no longer be able to log in with it.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
