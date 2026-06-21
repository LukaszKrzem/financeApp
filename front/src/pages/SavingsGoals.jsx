import { useEffect, useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const formatMoney = (value, currencyCode = "PLN") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(value) || 0);

export default function SavingsGoals({ user, onLogout, token, apiUrl }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [contributions, setContributions] = useState({});

  const reloadGoals = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/savings-goals/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadGoals = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${apiUrl}/savings-goals/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setGoals(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching savings goals:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [token]);

  const handleCreateGoal = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/savings-goals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          target: Number(target),
          current_amount: Number(currentAmount) || 0,
          time_limit: timeLimit || null,
          Currency_id_currency: 1,
        }),
      });

      if (response.ok) {
        setName("");
        setTarget("");
        setCurrentAmount("");
        setTimeLimit("");
        setOpen(false);
        reloadGoals();
      }
    } catch (error) {
      console.error("Error creating savings goal:", error);
    }
  };

  const handleAddContribution = async (goalId) => {
    const amount = Number(contributions[goalId]) || 0;
    if (amount <= 0) return;

    try {
      const response = await fetch(`${apiUrl}/savings-goals/${goalId}/add`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
        }),
      });

      if (response.ok) {
        setContributions((currentValues) => ({
          ...currentValues,
          [goalId]: "",
        }));
        reloadGoals();
      }
    } catch (error) {
      console.error("Error adding contribution:", error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const response = await fetch(`${apiUrl}/savings-goals/${goalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setGoals((currentGoals) =>
          currentGoals.filter((goal) => goal.id_saving_goal !== goalId),
        );
      }
    } catch (error) {
      console.error("Error deleting savings goal:", error);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Savings Goals
          </h2>
          <p className="text-sm text-muted-foreground">
            Track progress towards your planned savings.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <IconPlus className="size-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleCreateGoal}
              className="flex flex-col gap-4 py-4"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Goal name</label>
                <input
                  type="text"
                  placeholder="e.g. New laptop"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Target amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 5000"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Current amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1000"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentAmount}
                  onChange={(event) => setCurrentAmount(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Deadline</label>
                <input
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={timeLimit}
                  onChange={(event) => setTimeLimit(event.target.value)}
                />
              </div>

              <Button type="submit" className="w-full mt-2">
                Confirm Goal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Loading savings goals...
        </p>
      ) : goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          You haven't created any savings goals yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percent = Math.min(Number(goal.percent_complete) || 0, 100);
            const left = Number(goal.target) - Number(goal.current_amount);

            return (
              <div
                key={goal.id_saving_goal}
                className="rounded-xl border bg-card text-card-foreground shadow-sm p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {goal.time_limit
                        ? `Deadline: ${new Date(goal.time_limit).toLocaleDateString()}`
                        : "No deadline"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGoal(goal.id_saving_goal)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      {formatMoney(goal.current_amount, goal.currency_code)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatMoney(goal.target, goal.currency_code)}
                    </span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>

                <p className="text-xs text-muted-foreground">
                  {left > 0
                    ? `${formatMoney(left, goal.currency_code)} left to save`
                    : "Goal completed"}
                </p>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount to add"
                    value={contributions[goal.id_saving_goal] || ""}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    onChange={(event) =>
                      setContributions((currentValues) => ({
                        ...currentValues,
                        [goal.id_saving_goal]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddContribution(goal.id_saving_goal)}
                  >
                    Add
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
