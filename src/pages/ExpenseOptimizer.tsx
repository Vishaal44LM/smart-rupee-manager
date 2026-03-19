import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Plus, Trash2, Zap, CheckCircle2, XCircle } from "lucide-react";
import { KnapsackExpense, KnapsackResult, knapsackOptimize } from "@/lib/knapsack";
import { formatINR } from "@/lib/finance-store";

const PRIORITY_LABELS: Record<number, string> = {
  1: "Very Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Critical",
};

export default function ExpenseOptimizer() {
  const [expenses, setExpenses] = useState<KnapsackExpense[]>([
    { id: "1", name: "Food", amount: 2000, priority: 5 },
    { id: "2", name: "Netflix", amount: 500, priority: 2 },
    { id: "3", name: "Shopping", amount: 3000, priority: 1 },
    { id: "4", name: "Transport", amount: 1000, priority: 4 },
  ]);
  const [budget, setBudget] = useState<number>(4000);
  const [result, setResult] = useState<KnapsackResult | null>(null);

  // New expense form
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newPriority, setNewPriority] = useState<string>("");

  const addExpense = () => {
    if (!newName || !newAmount || !newPriority) return;
    setExpenses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newName, amount: newAmount, priority: parseInt(newPriority) },
    ]);
    setNewName("");
    setNewAmount(0);
    setNewPriority("");
    setResult(null);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setResult(null);
  };

  const optimize = () => {
    setResult(knapsackOptimize(expenses, budget));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>💡</span> Expense Optimization Advisor
        </h1>
        <p className="text-muted-foreground mt-1">
          Uses the <strong>0/1 Knapsack Algorithm</strong> to select the most important expenses within your budget.
        </p>
      </div>

      {/* Budget Input */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" /> Budget Limit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-muted-foreground">Total Budget (₹)</Label>
          <Input
            type="number"
            placeholder="e.g. 4000"
            value={budget || ""}
            onChange={(e) => { setBudget(parseFloat(e.target.value) || 0); setResult(null); }}
          />
        </CardContent>
      </Card>

      {/* Add Expense */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <Input placeholder="e.g. Groceries" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <Label className="text-muted-foreground">Amount (₹)</Label>
              <Input type="number" placeholder="e.g. 1500" value={newAmount || ""} onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-muted-foreground">Priority</Label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger><SelectValue placeholder="1–5" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <SelectItem key={p} value={String(p)}>{p} – {PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addExpense} disabled={!newName || !newAmount || !newPriority} className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      {expenses.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Your Expenses ({expenses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">{exp.name}</TableCell>
                    <TableCell className="text-right">{formatINR(exp.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={exp.priority >= 4 ? "default" : exp.priority >= 2 ? "secondary" : "outline"}>
                        {exp.priority} – {PRIORITY_LABELS[exp.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeExpense(exp.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center mt-4 pt-3 border-t text-sm text-muted-foreground">
              <span>Total: <strong className="text-foreground">{formatINR(expenses.reduce((s, e) => s + e.amount, 0))}</strong></span>
              <span>Budget: <strong className="text-foreground">{formatINR(budget)}</strong></span>
            </div>

            <Button onClick={optimize} className="w-full mt-4 gap-2" size="lg">
              <Zap className="h-4 w-4" /> Optimize Expenses (Knapsack)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Selected */}
          <Card className="shadow-md border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" /> Recommended to KEEP ({result.selected.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.selected.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.selected.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="text-right">{formatINR(e.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge>{e.priority}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No expenses fit within the budget.</p>
              )}
            </CardContent>
          </Card>

          {/* Rejected */}
          {result.rejected.length > 0 && (
            <Card className="shadow-md border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" /> Suggested to REMOVE ({result.rejected.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rejected.map((e) => (
                      <TableRow key={e.id} className="opacity-60">
                        <TableCell className="font-medium line-through">{e.name}</TableCell>
                        <TableCell className="text-right">{formatINR(e.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{e.priority}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-md">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Selected Cost</p>
                <p className="text-2xl font-bold text-primary">{formatINR(result.totalCost)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Remaining Budget</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatINR(result.remainingBudget)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">Total Priority Score</p>
                <p className="text-2xl font-bold text-foreground">{result.totalPriority} / {expenses.reduce((s, e) => s + e.priority, 0)}</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Solved using 0/1 Knapsack with Dynamic Programming: dp[i][w] = max priority using first i items with budget w. Backtracked to find selected items.
          </p>
        </div>
      )}
    </div>
  );
}
