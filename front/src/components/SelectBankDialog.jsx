import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function SelectBankDialog({ open, onOpenChange, onSelectBank }) {
  const { apiUrl, token, onLogout } = useAuth();
  const { loading, error, run } = useAsyncAction();

  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;

    run(async () => {
      const data = await apiFetch(
        `${apiUrl}/api/banking/aspsps?country=PL`,
        token,
        {},
        onLogout
      );
      setBanks(data.aspsps || []);
    });
  }, [open, apiUrl, token, onLogout, run]);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    return banks.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [banks, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select your bank</DialogTitle>
          <DialogDescription>
            Choose the bank you want to connect.
          </DialogDescription>
        </DialogHeader>
        <Label htmlFor="bank-search">Search Banks</Label>
        <Input
          placeholder="Search banks..."
          id="bank-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1 mt-2">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading banks...
            </p>
          )}
          {!loading && !error && filteredBanks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No banks found.
            </p>
          )}

          {filteredBanks.map((bank) => (
            <Button
              key={`${bank.name}-${bank.country}`}
              variant="ghost"
              className="justify-start gap-3 h-auto py-2"
              onClick={() => onSelectBank(bank)}
            >
              {bank.logo ? (
                <img
                  src={bank.logo}
                  alt=""
                  className="size-6 rounded object-contain shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="size-6 rounded bg-muted shrink-0" />
              )}
              <span className="truncate">{bank.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
