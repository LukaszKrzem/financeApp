import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function RenameAccountDialog({ account, onClose, onSave, isSaving }) {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (account) setNewName(account.name);
  }, [account]);

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Rename account</DialogTitle>
          <DialogDescription>
            Choose a new name for this account.
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
