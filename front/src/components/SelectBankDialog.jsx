import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useApi } from '@/hooks/useApi';

export function SelectBankDialog({ open, onOpenChange, onSelectBank }) {
  const { get } = useApi();
  const { loading, error, run } = useAsyncAction();

  const [banks, setBanks] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;

    run(async () => {
      const data = await get('/api/banking/aspsps?country=PL');
      setBanks(data.aspsps || []);
    });
  }, [open, get, run]);

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return banks;
    return banks.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [banks, search]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Select your bank"
      description="Choose the bank you want to connect."
    >
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
    </ResponsiveDialog>
  );
}
