import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { IconPlus } from "@tabler/icons-react";

export function AddAccountDialog({ token, onAccountAdded, currencies = [], apiUrl }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [balance, setBalance] = useState("");
    const [currencyId, setCurrencyId] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !balance || !currencyId) return;

        try {
            const response = await fetch(`${apiUrl}/accounts/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name,
                    current_balance: parseFloat(balance),
                    Currency_id_currency: parseInt(currencyId)
                }),
            });

            if (response.ok) {
                setName("");
                setBalance("");
                setCurrencyId("");
                setOpen(false);
                if (onAccountAdded) onAccountAdded();
            }
        } catch (error) {
            console.error("Error creating account:", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <IconPlus className="size-4" />
                    Add Account
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Account Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Main Wallet"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Initial Balance</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="e.g. 1500"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Currency</label>
                        <Select value={currencyId} onValueChange={setCurrencyId} required>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {currencies.map((currency) => (
                                    <SelectItem 
                                        key={currency.id_currency} 
                                        value={currency.id_currency.toString()}
                                    >
                                        {currency.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full mt-2">
                        Confirm Account
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}