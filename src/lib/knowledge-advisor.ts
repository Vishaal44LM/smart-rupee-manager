// Knowledge-Based Financial Advisor – Rule Engine

export type RuleSeverity = "positive" | "suggestion" | "warning" | "critical";

export interface TriggeredRule {
  id: string;
  severity: RuleSeverity;
  title: string;
  explanation: string;
  condition: string; // human-readable condition
  metricLabel?: string;
  metricValue?: string;
}

export interface AdvisorInput {
  monthlyBudget: number;
  totalSpent: number;
  remainingBalance: number;
  categorySpending: Record<string, number>;
  savingsAmount: number;
}

export interface AdvisorResult {
  triggeredRules: TriggeredRule[];
  alertsCount: number;
  suggestionsCount: number;
  positiveCount: number;
  totalTriggered: number;
}

interface RuleDefinition {
  id: string;
  severity: RuleSeverity;
  title: string;
  explanation: string;
  condition: string;
  test: (input: AdvisorInput) => boolean;
  metric?: (input: AdvisorInput) => { label: string; value: string };
}

const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

const catSum = (cats: Record<string, number>, ...keys: string[]) =>
  keys.reduce((s, k) => {
    const lower = k.toLowerCase();
    for (const [ck, cv] of Object.entries(cats)) {
      if (ck.toLowerCase().includes(lower)) s += cv;
    }
    return s;
  }, 0);

const rules: RuleDefinition[] = [
  {
    id: "entertainment_overspend",
    severity: "warning",
    title: "High Entertainment Spending",
    explanation: "You are overspending on non-essential items like entertainment.",
    condition: "IF entertainment spending > 30% of total budget",
    test: (i) => pct(catSum(i.categorySpending, "entertainment", "movie", "game"), i.monthlyBudget) > 30,
    metric: (i) => ({ label: "Entertainment %", value: `${pct(catSum(i.categorySpending, "entertainment", "movie", "game"), i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "low_remaining",
    severity: "warning",
    title: "Low Remaining Balance",
    explanation: "Your remaining balance is dangerously low relative to your budget.",
    condition: "IF remaining balance < 20% of total budget",
    test: (i) => i.monthlyBudget > 0 && pct(i.remainingBalance, i.monthlyBudget) < 20,
    metric: (i) => ({ label: "Remaining %", value: `${pct(i.remainingBalance, i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "low_savings",
    severity: "suggestion",
    title: "Increase Your Savings",
    explanation: "Try increasing your monthly savings target to at least 15% of your budget.",
    condition: "IF savings < 15% of budget",
    test: (i) => i.monthlyBudget > 0 && pct(i.savingsAmount, i.monthlyBudget) < 15,
    metric: (i) => ({ label: "Savings %", value: `${pct(i.savingsAmount, i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "essential_heavy",
    severity: "suggestion",
    title: "Essential-Heavy Budget",
    explanation: "Most of your budget is going to essential expenses like food, bills, and transport.",
    condition: "IF food + bills + transport > 70% of total budget",
    test: (i) => pct(catSum(i.categorySpending, "food", "bill", "transport", "rent", "utilities"), i.monthlyBudget) > 70,
    metric: (i) => ({ label: "Essentials %", value: `${pct(catSum(i.categorySpending, "food", "bill", "transport", "rent", "utilities"), i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "shopping_vs_food",
    severity: "suggestion",
    title: "Discretionary Over Essential",
    explanation: "Your discretionary spending (shopping) is higher than your essential spending (food).",
    condition: "IF shopping spending > food spending",
    test: (i) => catSum(i.categorySpending, "shopping") > catSum(i.categorySpending, "food") && catSum(i.categorySpending, "shopping") > 0,
    metric: (i) => ({ label: "Shopping vs Food", value: `₹${catSum(i.categorySpending, "shopping").toLocaleString("en-IN")} vs ₹${catSum(i.categorySpending, "food").toLocaleString("en-IN")}` }),
  },
  {
    id: "budget_critical",
    severity: "critical",
    title: "Budget Critical",
    explanation: "Avoid any more non-essential spending. You have used over 90% of your budget.",
    condition: "IF total spent > 90% of budget",
    test: (i) => i.monthlyBudget > 0 && pct(i.totalSpent, i.monthlyBudget) > 90,
    metric: (i) => ({ label: "Usage %", value: `${pct(i.totalSpent, i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "budget_caution",
    severity: "warning",
    title: "Nearing Budget Limit",
    explanation: "You are nearing your budget limit. Plan remaining spending carefully.",
    condition: "IF total spent is between 75% and 90% of budget",
    test: (i) => {
      const p = pct(i.totalSpent, i.monthlyBudget);
      return i.monthlyBudget > 0 && p >= 75 && p <= 90;
    },
    metric: (i) => ({ label: "Usage %", value: `${pct(i.totalSpent, i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "excellent_savings",
    severity: "positive",
    title: "Excellent Savings Discipline",
    explanation: "Your savings rate is above 25%. Keep up the great work!",
    condition: "IF savings rate > 25% of budget",
    test: (i) => i.monthlyBudget > 0 && pct(i.savingsAmount, i.monthlyBudget) > 25,
    metric: (i) => ({ label: "Savings Rate", value: `${pct(i.savingsAmount, i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "good_remaining",
    severity: "positive",
    title: "Healthy Remaining Balance",
    explanation: "You still have a comfortable buffer in your budget. Well managed!",
    condition: "IF remaining balance > 40% of budget",
    test: (i) => i.monthlyBudget > 0 && pct(i.remainingBalance, i.monthlyBudget) > 40,
    metric: (i) => ({ label: "Remaining %", value: `${pct(i.remainingBalance, i.monthlyBudget).toFixed(1)}%` }),
  },
  {
    id: "zero_budget",
    severity: "critical",
    title: "No Budget Set",
    explanation: "Set a monthly budget in the Budget Checker to get personalised advice.",
    condition: "IF monthly budget is 0 or not set",
    test: (i) => i.monthlyBudget <= 0,
  },
];

export function runAdvisor(input: AdvisorInput): AdvisorResult {
  const triggeredRules: TriggeredRule[] = [];

  for (const rule of rules) {
    if (rule.test(input)) {
      const m = rule.metric?.(input);
      triggeredRules.push({
        id: rule.id,
        severity: rule.severity,
        title: rule.title,
        explanation: rule.explanation,
        condition: rule.condition,
        metricLabel: m?.label,
        metricValue: m?.value,
      });
    }
  }

  return {
    triggeredRules,
    alertsCount: triggeredRules.filter((r) => r.severity === "warning" || r.severity === "critical").length,
    suggestionsCount: triggeredRules.filter((r) => r.severity === "suggestion").length,
    positiveCount: triggeredRules.filter((r) => r.severity === "positive").length,
    totalTriggered: triggeredRules.length,
  };
}
