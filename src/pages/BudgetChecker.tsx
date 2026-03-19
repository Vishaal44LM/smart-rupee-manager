import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getBudget, saveBudget, formatINR, BudgetData } from "@/lib/finance-store";
import BudgetDecisionAssistant from "@/components/BudgetDecisionAssistant";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment"];
const COLORS = [
  "hsl(217, 71%, 53%)",
  "hsl(152, 44%, 49%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 55%)",
];

export default function BudgetChecker() {
  const [data, setData] = useState<BudgetData>({ income: 0, expenses: {} });

  useEffect(() => setData(getBudget()), []);

  const update = (d: BudgetData) => { setData(d); saveBudget(d); };

  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const remaining = data.income - totalExpenses;
  const overspent = remaining < 0;

  const pieData = CATEGORIES
    .filter((c) => (data.expenses[c] || 0) > 0)
    .map((c) => ({ name: c, value: data.expenses[c] }));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>📊</span> Budget Checker
        </h1>
        <p className="text-muted-foreground mt-1">Monitor your monthly income vs expenses</p>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Monthly Income</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-muted-foreground">Income (₹)</Label>
          <Input
            type="number"
            placeholder="e.g. 30000"
            value={data.income || ""}
            onChange={(e) => update({ ...data, income: parseFloat(e.target.value) || 0 })}
          />
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader><CardTitle className="text-lg">Expenses by Category</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <Label className="text-muted-foreground">{cat} (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={data.expenses[cat] || ""}
                onChange={(e) => update({ ...data, expenses: { ...data.expenses, [cat]: parseFloat(e.target.value) || 0 } })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {overspent && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-semibold">
            ⚠ You have overspent your monthly budget by {formatINR(Math.abs(remaining))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">{formatINR(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-2xl font-bold text-primary">{formatINR(data.income)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`text-2xl font-bold ${overspent ? "text-destructive" : "text-success"}`}>{formatINR(remaining)}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Budget Decision Assistant */}
      <BudgetDecisionAssistant monthlyIncome={data.income} totalSpent={totalExpenses} />

      {pieData.length > 0 && (
        <Card className="shadow-md">
          <CardHeader><CardTitle className="text-lg">Expense Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
