import { AddAccountDialog } from "@/components/AddAccountDialog";

const formatAccountAmount = (amount, currencyCode) => {
  const value = new Intl.NumberFormat("pl-PL", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.abs(parseFloat(amount)).toFixed(2));
  const code = (currencyCode || "PLN").toUpperCase();
  switch (code) {
    case "USD":
      return `$${value}`;
    case "EUR":
      return `${value} €`;
    case "GBP":
      return `£${value}`;
    case "PLN":
    default:
      return `${value} zł`;
  }
};
export default function Accounts({ token, accounts, setRefreshing, loading }) {
  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Financial Accounts
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage your available wallets and balances
          </p>
        </div>
        <AddAccountDialog
          token={token}
          onAccountAdded={() => {
            setRefreshing((prev) => prev + 1);
          }}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading accounts...
        </p>
      ) : (accounts || []).length === 0 ? (
        <p className="text-sm text-muted-foreground col-span-full text-center py-8">
          You haven't created any financial accounts yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            if (!account) return null;
            const compactNumber = formatAccountAmount(
              account.current_balance,
              account.currency_code,
            );

            return (
              <div
                key={account.id_account}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-2 duration-200 hover:shadow-md"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg text-foreground">
                    {account.name}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {account.currency_code}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground block">
                    Current Balance
                  </span>
                  <span className="text-3xl font-bold tracking-tight text-primary">
                    {compactNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
