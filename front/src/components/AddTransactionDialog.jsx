import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const selectedAccount = accounts.find(acc => acc.id_account.toString() === accountId);
  const currencyDisplay = selectedAccount?.currency_code || "PLN";

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("http://localhost:8000/accounts/", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAccounts(data);

          if (data.length > 0) {
            setAccountId(data[0].id_account.toString());
          }
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    };

    if (token) {
      fetchAccounts();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/transactions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type: type,
          description: description,
          Account_id_account: parseInt(accountId),
          Category_id_category: null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error adding transaction");
      }

      setAmount("");
      setDescription("");
      setOpen(false);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pr-12"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {currencyDisplay}
            </span>
          </div>
          <Input
            type="text" placeholder="Description"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />

          <Select value={accountId} onValueChange={setAccountId} required>
            <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id_account} value={acc.id_account.toString()}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}