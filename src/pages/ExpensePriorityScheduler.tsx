import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Plus, Trash2, Zap, CheckCircle2, Clock } from "lucide-react";
import {
  SchedulerExpense,
  SchedulerResult,
  PriorityLevel,
  greedySchedule,
  detectExpenseAttributes,
} from "@/lib/greedy-scheduler";
import { formatINR } from "@/lib/finance-store";

const priorityColor = (p: PriorityLevel) =>
  p === "High" ? "default" : p === "Medium" ? "secondary" : "outline";

export default function ExpensePriorityScheduler() {
  const [expenses, setExpenses] = useState<SchedulerExpense[]>([
    { id: "1", name: "Rent", amount: 2000, priority: "High", category: "Essential" },
    { id: "2", name: "Food", amount: 1200, priority: "High", category: "Essential" },
    { id: "3", name: "Netflix", amount: 500, priority: "Low", category: "Non-Essential" },
    { id: "4", name: "Shopping", amount: 1800, priority: "Medium", category: "Non-Essential" },
    { id: "5", name: "Transport", amount: 800, priority: "High", category: "Essential" },
  ]);
  const [budget, setBudget] = useState<number>(5000);
  const [result, setResult] = useState<SchedulerResult | null>(null);

  // Form state
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newPriority, setNewPriority] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");

  const addExpense = () => {
    if (!newName || !newAmount || !newPriority || !newCategory) return;
    setExpenses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newName,
        amount: newAmount,
        priority: newPriority as PriorityLevel,
        category: newCategory as ExpenseCategory,
      },
    ]);
    setNewName("");
    setNewAmount(0);
    setNewPriority("");
    setNewCategory("");
    setResult(null);
  };

  const removeExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setResult(null);
  };

  const generate = () => {
    setResult(greedySchedule(expenses, budget));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>📋</span> Expense Priority Scheduler
        </h1>
        <p className="text-muted-foreground mt-1">
          Uses the <strong>Greedy Algorithm</strong> to select the most important expenses first within your budget.
        </p>
      </div>

      {/* Budget */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Total Available Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-muted-foreground">Budget (₹)</Label>
          <Input
            type="number"
            placeholder="e.g. 5000"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
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
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addExpense} disabled={!newName || !newAmount || !newPriority || !newCategory} className="gap-1">
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
                  <TableHead className="text-center">Category</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">{exp.name}</TableCell>
                    <TableCell className="text-right">{formatINR(exp.amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={priorityColor(exp.priority)}>{exp.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={exp.category === "Essential" ? "default" : "outline"}>{exp.category}</Badge>
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

            <Button onClick={generate} className="w-full mt-4 gap-2" size="lg">
              <Zap className="h-4 w-4" /> Generate Smart Expense Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Pay First */}
          <Card className="shadow-md border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" /> Pay First ({result.selected.length})
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
                      <TableHead className="text-center">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.selected.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="text-right">{formatINR(e.amount)}</TableCell>
                        <TableCell className="text-center"><Badge variant={priorityColor(e.priority)}>{e.priority}</Badge></TableCell>
                        <TableCell className="text-center"><Badge variant="default">{e.category}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No expenses fit within the budget.</p>
              )}
            </CardContent>
          </Card>

          {/* Postpone */}
          {result.postponed.length > 0 && (
            <Card className="shadow-md border-destructive/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <Clock className="h-5 w-5" /> Postpone / Skip ({result.postponed.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Priority</TableHead>
                      <TableHead className="text-center">Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.postponed.map((e) => (
                      <TableRow key={e.id} className="opacity-60">
                        <TableCell className="font-medium line-through">{e.name}</TableCell>
                        <TableCell className="text-right">{formatINR(e.amount)}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline">{e.priority}</Badge></TableCell>
                        <TableCell className="text-center"><Badge variant="outline">{e.category}</Badge></TableCell>
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
                <p className="text-sm text-muted-foreground">Total Selected Cost</p>
                <p className="text-2xl font-bold text-primary">{formatINR(result.totalSelectedCost)}</p>
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
                <p className="text-sm text-muted-foreground">Expenses Postponed</p>
                <p className="text-2xl font-bold text-foreground">{result.postponed.length} of {expenses.length}</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Solved using Greedy Algorithm: expenses are sorted by category importance (Essential first), then priority (High → Low), then lowest amount. Items are selected sequentially until the budget is exhausted.
          </p>
        </div>
      )}
    </div>
  );
}
