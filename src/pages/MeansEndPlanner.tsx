import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Target, TrendingUp, ArrowRight, Info, Lightbulb, CheckCircle, AlertTriangle, Sparkles, Wallet, PiggyBank, ArrowDown } from "lucide-react";
import { getBudget, getSavingsGoal, formatINR } from "@/lib/finance-store";
import { analyzeMeansEnd, MeansEndResult } from "@/lib/means-end-planner";

export default function MeansEndPlanner() {
  const [currentSavings, setCurrentSavings] = useState(0);
  const [targetSavings, setTargetSavings] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  

  useEffect(() => {
    const budget = getBudget();
    const savings = getSavingsGoal();
    if (budget.income > 0) setMonthlyBudget(budget.income);
    if (savings.savedSoFar > 0) setCurrentSavings(savings.savedSoFar);
    if (savings.targetAmount > 0) setTargetSavings(savings.targetAmount);
  }, []);

  const result: MeansEndResult | null = useMemo(() => {
    if (targetSavings <= 0) return null;
    return analyzeMeansEnd({
      currentSavings,
      targetSavings,
      monthlyBudget,
      targetDuration: null,
    });
  }, [currentSavings, targetSavings, monthlyBudget]);

  const priorityColor = (p: "High" | "Medium" | "Low") => {
    if (p === "High") return "bg-destructive/10 text-destructive border-destructive/20";
    if (p === "Medium") return "bg-warning/10 text-warning border-warning/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <span>🧭</span> Means-End Savings Planner
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1">
          Bridge the gap between your current savings and target savings using AI planning
          <Tooltip>
            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">Means-End Analysis compares your current state to your goal state, identifies the difference, and suggests actions (means) to close the gap.</p>
            </TooltipContent>
          </Tooltip>
        </p>
      </div>

      {/* Input Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Planning Inputs
          </CardTitle>
          <CardDescription>Enter your savings details or they'll be loaded from your existing data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Current Savings (₹)</Label>
              <Input type="number" placeholder="e.g. 4000" value={currentSavings || ""} onChange={e => setCurrentSavings(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-muted-foreground">Target Savings Goal (₹)</Label>
              <Input type="number" placeholder="e.g. 10000" value={targetSavings || ""} onChange={e => setTargetSavings(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-muted-foreground">Monthly Budget / Income (₹)</Label>
              <Input type="number" placeholder="e.g. 30000" value={monthlyBudget || ""} onChange={e => setMonthlyBudget(parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-muted-foreground">Target Duration (months, optional)</Label>
              <Input type="number" placeholder="e.g. 6" value={targetDuration} onChange={e => setTargetDuration(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!result && targetSavings <= 0 && (
        <Card className="shadow-md border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Enter a target savings goal above to generate your personalized savings plan.</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Current Savings</p>
                <p className="text-xl font-bold text-primary">{formatINR(result.currentSavings)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Target Savings</p>
                <p className="text-xl font-bold text-foreground">{formatINR(result.targetSavings)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Savings Gap</p>
                <p className={`text-xl font-bold ${result.goalAchieved ? "text-success" : "text-destructive"}`}>
                  {result.goalAchieved ? "₹0" : formatINR(result.savingsGap)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Est. Months to Goal</p>
                <p className="text-xl font-bold text-foreground">
                  {result.goalAchieved ? "✅" : result.estimatedMonths ? `~${result.estimatedMonths}` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Goal Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={result.progressPercentage} className="h-4" />
              <p className="text-center text-sm text-muted-foreground">{result.progressPercentage}% of goal reached</p>

              {/* Current → Gap → Goal flow */}
              <div className="flex items-center justify-between gap-2 mt-4 px-2">
                <div className="text-center flex-1">
                  <PiggyBank className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="font-semibold text-sm">{formatINR(result.currentSavings)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-center flex-1">
                  <ArrowDown className="h-5 w-5 mx-auto text-destructive mb-1" />
                  <p className="text-xs text-muted-foreground">Gap</p>
                  <p className="font-semibold text-sm text-destructive">{formatINR(result.savingsGap)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-center flex-1">
                  <Target className="h-5 w-5 mx-auto text-success mb-1" />
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="font-semibold text-sm text-success">{formatINR(result.targetSavings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal Achieved */}
          {result.goalAchieved && (
            <Card className="shadow-md border-success/30 bg-success/5">
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
                <h3 className="text-xl font-bold text-success mb-1">🎉 Goal Achieved!</h3>
                <p className="text-muted-foreground">Your savings have reached the target. Consider setting a new, higher goal.</p>
              </CardContent>
            </Card>
          )}

          {/* Recommended Actions */}
          {!result.goalAchieved && result.actions.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" /> Recommended Actions to Reach Goal
                </CardTitle>
                <CardDescription>Means identified to close your savings gap</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.actions.map((action, i) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{action.title}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColor(action.priority)}`}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.explanation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Impact</p>
                      <p className="text-sm font-semibold text-success">+{formatINR(action.expectedImpact)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Step Plan */}
          {!result.goalAchieved && result.stepPlan.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.stepPlan.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span>{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Financial Context */}
          {!result.goalAchieved && (result.totalSpent > 0 || result.discretionarySpending > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardContent className="pt-5 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-lg font-bold text-foreground">{formatINR(result.totalSpent)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="pt-5 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Remaining Balance</p>
                  <p className="text-lg font-bold text-primary">{formatINR(result.remainingBalance)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="pt-5 pb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Discretionary Spending</p>
                  <p className="text-lg font-bold text-warning">{formatINR(result.discretionarySpending)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Explanation */}
          <Card className="shadow-md border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" /> How This Advice Was Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
