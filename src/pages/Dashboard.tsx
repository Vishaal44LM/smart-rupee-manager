import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Scissors, Plane, BarChart3, Target, Tv,
  TrendingDown, Wallet, CreditCard, PiggyBank,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getBudget, getSubscriptions, getSavingsGoal, formatINR } from "@/lib/finance-store";

const CATEGORY_COLORS = [
  "hsl(217, 71%, 53%)",
  "hsl(152, 44%, 49%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 55%)",
];

const quickActions = [
  { title: "Expense Splitter", icon: Scissors, url: "/splitter", emoji: "💸" },
  { title: "Trip Tracker", icon: Plane, url: "/trips", emoji: "✈️" },
  { title: "Budget Checker", icon: BarChart3, url: "/budget", emoji: "📊" },
  { title: "Savings Goal", icon: Target, url: "/savings", emoji: "🎯" },
  { title: "Subscriptions", icon: Tv, url: "/subscriptions", emoji: "📺" },
  { title: "Priority Scheduler", icon: TrendingDown, url: "/optimizer", emoji: "⚡" },
  { title: "Budget Optimizer", icon: PiggyBank, url: "/knapsack", emoji: "✨" },
  { title: "Financial Advisor", icon: Wallet, url: "/advisor", emoji: "🧠" },
  { title: "Savings Planner", icon: CreditCard, url: "/means-end", emoji: "🧭" },
];

export default function Dashboard() {
  const [budget, setBudget] = useState(getBudget());
  const [subs, setSubs] = useState(getSubscriptions());
  const [savings, setSavings] = useState(getSavingsGoal());

  useEffect(() => {
    setBudget(getBudget());
    setSubs(getSubscriptions());
    setSavings(getSavingsGoal());
  }, []);

  const totalExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
  const remaining = budget.income - totalExpenses;
  const totalSubCost = subs.reduce((a, b) => a + b.monthlyCost, 0);

  const daysLeft = savings.deadlineDate
    ? Math.max(0, Math.ceil((new Date(savings.deadlineDate).getTime() - Date.now()) / 86400000))
    : 0;
  const dailySaving = daysLeft > 0 ? Math.ceil((savings.targetAmount - savings.savedSoFar) / daysLeft) : 0;
  const savingsProgress = savings.targetAmount > 0
    ? Math.min(100, Math.round((savings.savedSoFar / savings.targetAmount) * 100))
    : 0;

  const pieData = Object.entries(budget.expenses)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }));

  const summaryCards = [
    { title: "Monthly Expenses", value: formatINR(totalExpenses), icon: TrendingDown, color: "text-destructive" },
    { title: "Remaining Budget", value: formatINR(remaining), icon: Wallet, color: remaining >= 0 ? "text-success" : "text-destructive" },
    { title: "Subscription Cost", value: formatINR(totalSubCost), icon: CreditCard, color: "text-primary" },
    { title: "Savings Progress", value: `${savingsProgress}%`, icon: PiggyBank, color: "text-secondary" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your financial overview at a glance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-12">No budget data yet. Add expenses in Budget Checker.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            {quickActions.map((a) => (
              <Button key={a.title} variant="outline" className="justify-start gap-3 h-12 text-left" asChild>
                <Link to={a.url}>
                  <span className="text-lg">{a.emoji}</span>
                  <span className="font-medium">{a.title}</span>
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
