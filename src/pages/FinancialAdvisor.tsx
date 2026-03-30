import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertTriangle, CheckCircle2, Info, ShieldAlert, Brain, Lightbulb,
} from "lucide-react";
import { getBudget, getSavingsGoal, formatINR } from "@/lib/finance-store";
import { runAdvisor, type AdvisorInput, type RuleSeverity, type TriggeredRule } from "@/lib/knowledge-advisor";

const severityConfig: Record<RuleSeverity, { color: string; icon: typeof Info; label: string }> = {
  positive: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle2, label: "Positive" },
  suggestion: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", icon: Lightbulb, label: "Suggestion" },
  warning: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", icon: AlertTriangle, label: "Warning" },
  critical: { color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300", icon: ShieldAlert, label: "Critical" },
};

export default function FinancialAdvisor() {
  const [budget, setBudget] = useState(getBudget());
  const [savings, setSavings] = useState(getSavingsGoal());

  useEffect(() => {
    setBudget(getBudget());
    setSavings(getSavingsGoal());
  }, []);

  const totalSpent = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
  const remaining = budget.income - totalSpent;

  const advisorInput: AdvisorInput = useMemo(() => ({
    monthlyBudget: budget.income,
    totalSpent,
    remainingBalance: remaining,
    categorySpending: budget.expenses,
    savingsAmount: savings.savedSoFar,
  }), [budget, totalSpent, remaining, savings]);

  const result = useMemo(() => runAdvisor(advisorInput), [advisorInput]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Brain className="h-8 w-8 text-primary mt-1 shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Knowledge-Based Financial Advisor</h1>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">A <strong>Knowledge-Based System</strong> uses IF-THEN rules to emulate expert decision-making. Rules are evaluated against your current financial data to generate personalised advice.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground mt-1">Rule-based expert suggestions for smarter money decisions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Rules Triggered" value={result.totalTriggered} color="text-primary" />
        <SummaryCard label="Alerts" value={result.alertsCount} color="text-destructive" />
        <SummaryCard label="Suggestions" value={result.suggestionsCount} color="text-blue-600 dark:text-blue-400" />
        <SummaryCard label="Positive Insights" value={result.positiveCount} color="text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* Quick Context */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Current Financial Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <span><strong>Budget:</strong> {formatINR(budget.income)}</span>
          <span><strong>Spent:</strong> {formatINR(totalSpent)}</span>
          <span><strong>Remaining:</strong> {formatINR(remaining)}</span>
          <span><strong>Savings:</strong> {formatINR(savings.savedSoFar)}</span>
        </CardContent>
      </Card>

      {/* Advisor Insights */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Advisor Insights</h2>
        {result.triggeredRules.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
              <p className="font-medium">Your finances look balanced.</p>
              <p className="text-sm">No major rule-based alerts right now.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {result.triggeredRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        )}
      </div>

      {/* Why this advice */}
      {result.triggeredRules.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Why This Advice Was Generated</CardTitle>
            <CardDescription>Matched rule conditions in plain English</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {result.triggeredRules.map((rule) => (
                <li key={rule.id} className="flex items-start gap-2">
                  <span className="text-primary font-mono text-xs mt-0.5">▸</span>
                  <span className="text-muted-foreground">{rule.condition} → <span className="text-foreground font-medium">{rule.title}</span></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="shadow-md">
      <CardContent className="pt-6 text-center">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function RuleCard({ rule }: { rule: TriggeredRule }) {
  const cfg = severityConfig[rule.severity];
  const Icon = cfg.icon;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold">{rule.title}</span>
              <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{rule.explanation}</p>
            {rule.metricLabel && rule.metricValue && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-muted/60 rounded px-2 py-1 text-xs font-medium">
                <span className="text-muted-foreground">{rule.metricLabel}:</span>
                <span className="text-foreground">{rule.metricValue}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
