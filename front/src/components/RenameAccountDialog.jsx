import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';

export function RenameAccountDialog({ account, onClose, onSave, isSaving }) {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (account) setNewName(account.name);
  }, [account]);

  return (
    <ResponsiveDialog
      open={!!account}
      onOpenChange={(o) => !o && onClose()}
      title="Rename account"
      description="Choose a new name for this account."
      contentClassName="sm:max-w-[400px]"
    >
      <Label htmlFor="account-rename">New account name</Label>
      <Input
        id="account-rename"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSave(newName)}
        disabled={isSaving}
        autoFocus
      />
      <Button
        onClick={() => onSave(newName)}
        disabled={isSaving || !newName.trim()}
        className="w-full mt-2"
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </ResponsiveDialog>
  );
}
