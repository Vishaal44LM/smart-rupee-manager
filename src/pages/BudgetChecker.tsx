import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, AlertTriangle, Brain, ShieldCheck, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getBudget, saveBudget, formatINR, BudgetData } from "@/lib/finance-store";
import { minimaxDecision, DecisionResult } from "@/lib/minimax-budget";

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

  const update = (d: BudgetData) => {
    // Clean out zero/falsy expense entries so they don't linger
    const cleanedExpenses: Record<string, number> = {};
    for (const [k, v] of Object.entries(d.expenses)) {
      if (v > 0) cleanedExpenses[k] = v;
    }
    const cleaned = { ...d, expenses: cleanedExpenses };
    setData(cleaned);
    saveBudget(cleaned);
  };

  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const remaining = data.income - totalExpenses;
  const overspent = remaining < 0;

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const remainingDays = Math.max(1, Math.ceil((endOfMonth.getTime() - now.getTime()) / 86400000));

  // Run minimax analysis for each category with a non-zero expense
  const categoryAnalysis = useMemo(() => {
    if (data.income <= 0) return {};
    const results: Record<string, DecisionResult> = {};
    const otherExpenses = (cat: string) =>
      Object.entries(data.expenses)
        .filter(([k]) => k !== cat)
        .reduce((a, [, v]) => a + v, 0);

    CATEGORIES.forEach((cat) => {
      const amount = data.expenses[cat] || 0;
      if (amount > 0) {
        results[cat] = minimaxDecision({
          monthlyBudget: data.income,
          totalSpent: otherExpenses(cat),
          newExpenseAmount: amount,
          expenseCategory: cat,
          remainingDays,
          minimumReserve: Math.round(data.income * 0.1),
        });
      }
    });
    return results;
  }, [data, remainingDays]);

  // Overall recommendation: aggregate per-category minimax scores
  const overallResult = useMemo(() => {
    if (data.income <= 0 || totalExpenses <= 0) return null;

    const entries = Object.entries(categoryAnalysis);
    if (entries.length === 0) return null;

    let totalSpendScore = 0;
    let totalSaveScore = 0;
    entries.forEach(([, res]) => {
      totalSpendScore += res.spendScore;
      totalSaveScore += res.saveScore;
    });

    const avgSpend = Math.round(totalSpendScore / entries.length);
    const avgSave = Math.round(totalSaveScore / entries.length);
    const recommendation: "SPEND" | "SAVE" = avgSpend >= avgSave ? "SPEND" : "SAVE";
    const usagePercent = Math.round((totalExpenses / data.income) * 100);
    const reserve = Math.round(data.income * 0.1);

    let reason: string;
    if (remaining < 0) {
      reason = `You've exceeded your budget by ${formatINR(Math.abs(remaining))}. Reduce non-essential spending immediately.`;
    } else if (remaining < reserve) {
      reason = `Your remaining balance (${formatINR(remaining)}) is below the safe reserve of ${formatINR(reserve)}. Consider cutting back.`;
    } else if (usagePercent > 75) {
      reason = `You've used ${usagePercent}% of your budget with ${remainingDays} days left. Spend cautiously.`;
    } else {
      reason = `You've used ${usagePercent}% of your budget. Your spending is within safe limits for the remaining ${remainingDays} days.`;
    }

    return {
      recommendation,
      score: Math.max(avgSpend, avgSave),
      reason,
      spendScore: avgSpend,
      saveScore: avgSave,
    } as DecisionResult;
  }, [categoryAnalysis, data.income, totalExpenses, remaining, remainingDays]);

  const pieData = CATEGORIES
    .filter((c) => (data.expenses[c] || 0) > 0)
    .map((c) => ({ name: c, value: data.expenses[c] }));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>📊</span> Budget Checker
        </h1>
        <p className="text-muted-foreground mt-1">Monitor your monthly income vs expenses with AI-powered Minimax analysis</p>
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
          {CATEGORIES.map((cat) => {
            const analysis = categoryAnalysis[cat];
            const isSpend = analysis?.recommendation === "SPEND";
            return (
              <div key={cat} className="space-y-1">
                <Label className="text-muted-foreground">{cat} (₹)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={data.expenses[cat] || ""}
                  onChange={(e) => update({ ...data, expenses: { ...data.expenses, [cat]: parseFloat(e.target.value) || 0 } })}
                />
                {analysis && (
                  <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${isSpend ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
                    {isSpend ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    <span className="font-medium">{analysis.recommendation}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="truncate">{analysis.reason}</span>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Minimax Overall Analysis */}
      {overallResult && (
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Minimax Budget Analysis
              
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert variant={overallResult.recommendation === "SPEND" ? "default" : "destructive"}
              className={overallResult.recommendation === "SPEND" ? "border-green-500/50 bg-green-50 dark:bg-green-950/20" : ""}>
              {overallResult.recommendation === "SPEND" ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription className="font-semibold">
                {overallResult.recommendation === "SPEND" ? "✅" : "⚠️"} Overall: Your spending is{" "}
                <span className={overallResult.recommendation === "SPEND" ? "text-green-700 dark:text-green-400" : "text-destructive"}>
                  {overallResult.recommendation === "SPEND" ? "within safe limits" : "risky — consider saving"}
                </span>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">{overallResult.reason}</p>
            <div className="grid grid-cols-2 gap-3">
              <Card className={`shadow-sm ${overallResult.recommendation === "SPEND" ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/10" : "border-muted"}`}>
                <CardContent className="pt-4 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Spend Score</p>
                  <p className="text-xl font-bold">{overallResult.spendScore}</p>
                </CardContent>
              </Card>
              <Card className={`shadow-sm ${overallResult.recommendation === "SAVE" ? "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/10" : "border-muted"}`}>
                <CardContent className="pt-4 text-center">
                  <ShieldCheck className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Save Score</p>
                  <p className="text-xl font-bold">{overallResult.saveScore}</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Minimax tree: MAX(user) picks best of MIN(risk) evaluated scenarios for both Spend &amp; Save options.
            </p>
          </CardContent>
        </Card>
      )}

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
