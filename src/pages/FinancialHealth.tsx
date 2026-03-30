import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, Info, Heart, ShieldAlert, TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { getBudget, getSavingsGoal, formatINR } from "@/lib/finance-store";
import { analyzeFuzzyHealth, type FuzzyInput } from "@/lib/fuzzy-analyzer";

const healthColor = (score: number) =>
  score >= 75 ? "text-emerald-600 dark:text-emerald-400" : score >= 45 ? "text-amber-600 dark:text-amber-400" : "text-destructive";

const riskColor = (score: number) =>
  score >= 70 ? "text-destructive" : score >= 40 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";

const progressColor = (score: number, type: "health" | "risk") => {
  if (type === "health") return score >= 75 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-red-500";
  return score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500";
};

export default function FinancialHealth() {
  const [budget, setBudget] = useState(getBudget());
  const [savings, setSavings] = useState(getSavingsGoal());

  useEffect(() => {
    setBudget(getBudget());
    setSavings(getSavingsGoal());
  }, []);

  const totalSpent = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
  const remaining = budget.income - totalSpent;

  const fuzzyInput: FuzzyInput = useMemo(() => ({
    monthlyBudget: budget.income,
    totalSpent,
    remainingBalance: remaining,
    savingsAmount: savings.savedSoFar,
  }), [budget, totalSpent, remaining, savings]);

  const result = useMemo(() => analyzeFuzzyHealth(fuzzyInput), [fuzzyInput]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Activity className="h-8 w-8 text-primary mt-1 shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fuzzy Financial Health Analyzer</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm"><strong>Fuzzy Logic</strong> evaluates conditions in gradual ranges instead of strict yes/no values. A value can partially belong to multiple categories (e.g. spending can be 60% Medium and 40% High), producing more nuanced financial analysis.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground mt-1">AI-based gradual analysis of your financial condition</p>
        </div>
      </div>

      {/* Quick Context */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Current Financial Data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <span><strong>Budget:</strong> {formatINR(budget.income)}</span>
          <span><strong>Spent:</strong> {formatINR(totalSpent)}</span>
          <span><strong>Remaining:</strong> {formatINR(remaining)}</span>
          <span><strong>Savings:</strong> {formatINR(savings.savedSoFar)}</span>
        </CardContent>
      </Card>

      {/* Main Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreCard
          icon={Heart}
          title="Financial Health Score"
          score={result.healthScore}
          label={result.healthLabel}
          colorFn={healthColor}
          progressColorFn={(s) => progressColor(s, "health")}
        />
        <ScoreCard
          icon={ShieldAlert}
          title="Financial Risk Score"
          score={result.riskScore}
          label={result.riskLabel}
          colorFn={riskColor}
          progressColorFn={(s) => progressColor(s, "risk")}
        />
      </div>

      {/* Fuzzy Levels */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Fuzzy Membership Levels</CardTitle>
          <CardDescription>How your values map to fuzzy categories (values represent degree of membership 0–1)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <LevelRow icon={TrendingDown} label="Spending Level" displayLabel={result.spendingLabel} values={{ ...result.spendingLevel }} />
          <LevelRow icon={PiggyBank} label="Savings Level" displayLabel={result.savingsLabel} values={{ ...result.savingsLevel }} />
          <LevelRow icon={Wallet} label="Remaining Balance" displayLabel={result.balanceLabel} values={{ ...result.balanceLevel }} />
        </CardContent>
      </Card>

      {/* Fuzzy Rule Explanation */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Fuzzy Rule Explanation</CardTitle>
          <CardDescription>The dominant fuzzy rule influencing your result</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 text-sm font-medium">
            {result.dominantRule}
          </div>
        </CardContent>
      </Card>

      {/* Health Interpretation */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Health Interpretation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{result.interpretation}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({
  icon: Icon,
  title,
  score,
  label,
  colorFn,
  progressColorFn,
}: {
  icon: typeof Heart;
  title: string;
  score: number;
  label: string;
  colorFn: (s: number) => string;
  progressColorFn: (s: number) => string;
}) {
  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold">{title}</span>
        </div>
        <div className="flex items-end gap-3 mb-3">
          <span className={`text-5xl font-bold ${colorFn(score)}`}>{score}</span>
          <span className="text-muted-foreground text-sm mb-1">/ 100</span>
          <Badge className="mb-1 ml-auto border-0" variant="secondary">{label}</Badge>
        </div>
        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColorFn(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LevelRow({
  icon: Icon,
  label,
  displayLabel,
  values,
}: {
  icon: typeof TrendingDown;
  label: string;
  displayLabel: string;
  values: Record<string, number>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <Badge variant="outline" className="text-xs">{displayLabel}</Badge>
      </div>
      <div className="flex gap-2">
        {Object.entries(values).map(([name, val]) => (
          <div key={name} className="flex-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="capitalize">{name}</span>
              <span>{(val * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-full transition-all duration-500"
                style={{ width: `${val * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
