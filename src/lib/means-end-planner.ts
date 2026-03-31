import { getBudget, getSubscriptions, getSavingsGoal } from "./finance-store";

export interface MeansEndInput {
  currentSavings: number;
  targetSavings: number;
  monthlyBudget: number;
  targetDuration: number | null; // months, optional
}

export interface RecommendedAction {
  id: string;
  title: string;
  explanation: string;
  expectedImpact: number;
  priority: "High" | "Medium" | "Low";
}

export interface MeansEndResult {
  currentSavings: number;
  targetSavings: number;
  savingsGap: number;
  progressPercentage: number;
  totalSpent: number;
  remainingBalance: number;
  discretionarySpending: number;
  requiredMonthlySavings: number | null;
  estimatedMonths: number | null;
  possibleMonthlySavings: number;
  actions: RecommendedAction[];
  explanation: string;
  goalAchieved: boolean;
  stepPlan: string[];
}

const DISCRETIONARY_CATEGORIES = [
  "shopping", "entertainment", "subscriptions", "luxury", "dining", "travel", "gifts", "hobbies",
];

const ESSENTIAL_CATEGORIES = [
  "food", "rent", "transport", "bills", "fees", "utilities", "education", "health", "insurance",
];

export function analyzeMeansEnd(input: MeansEndInput): MeansEndResult {
  const budget = getBudget();
  const subs = getSubscriptions();

  const monthlyBudget = input.monthlyBudget || budget.income;
  const expenses = budget.expenses;

  const totalSpent = Object.values(expenses).reduce((s, v) => s + v, 0);
  const totalSubCost = subs.reduce((s, sub) => s + sub.monthlyCost, 0);
  const remainingBalance = Math.max(0, monthlyBudget - totalSpent);

  let discretionarySpending = 0;
  const categoryBreakdown: { category: string; amount: number; isDiscretionary: boolean }[] = [];

  for (const [cat, amt] of Object.entries(expenses)) {
    const key = cat.toLowerCase();
    const isDisc = DISCRETIONARY_CATEGORIES.some(d => key.includes(d));
    if (isDisc) discretionarySpending += amt;
    categoryBreakdown.push({ category: cat, amount: amt, isDiscretionary: isDisc });
  }

  // Add subscription cost to discretionary
  discretionarySpending += totalSubCost;

  const savingsGap = Math.max(0, input.targetSavings - input.currentSavings);
  const progressPercentage = input.targetSavings > 0
    ? Math.min(100, Math.round((input.currentSavings / input.targetSavings) * 100))
    : 0;
  const goalAchieved = input.currentSavings >= input.targetSavings && input.targetSavings > 0;

  // Possible monthly savings = remaining balance + 30% of discretionary
  const recoverableFromDisc = Math.round(discretionarySpending * 0.3);
  const possibleMonthlySavings = remainingBalance + recoverableFromDisc;

  const requiredMonthlySavings = input.targetDuration && input.targetDuration > 0
    ? Math.ceil(savingsGap / input.targetDuration)
    : null;

  const estimatedMonths = possibleMonthlySavings > 0
    ? Math.ceil(savingsGap / possibleMonthlySavings)
    : null;

  // Generate actions
  const actions: RecommendedAction[] = [];

  if (goalAchieved) {
    return buildResult({
      input, savingsGap: 0, progressPercentage: 100, totalSpent, remainingBalance,
      discretionarySpending, requiredMonthlySavings, estimatedMonths: 0,
      possibleMonthlySavings, actions: [], goalAchieved: true,
      explanation: `Congratulations! Your current savings of ₹${input.currentSavings.toLocaleString("en-IN")} have reached or exceeded your target of ₹${input.targetSavings.toLocaleString("en-IN")}. Consider setting a new, higher savings goal.`,
      stepPlan: ["🎉 Goal achieved!", "Set a new savings target to keep growing your wealth."],
    });
  }

  // Discretionary categories with amounts
  const discCategories = categoryBreakdown
    .filter(c => c.isDiscretionary && c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Action: reduce each discretionary category
  for (const cat of discCategories.slice(0, 3)) {
    const reduction = Math.round(cat.amount * 0.3);
    actions.push({
      id: `reduce-${cat.category}`,
      title: `Reduce ${cat.category}`,
      explanation: `Cut ${cat.category} spending by ~30% from ₹${cat.amount.toLocaleString("en-IN")} to ₹${(cat.amount - reduction).toLocaleString("en-IN")}`,
      expectedImpact: reduction,
      priority: cat.amount > monthlyBudget * 0.15 ? "High" : "Medium",
    });
  }

  // Action: subscriptions
  if (totalSubCost > 0) {
    const subReduction = Math.round(totalSubCost * 0.4);
    actions.push({
      id: "reduce-subs",
      title: "Review subscriptions",
      explanation: `Your subscriptions cost ₹${totalSubCost.toLocaleString("en-IN")}/month. Consider cancelling unused ones to save ~₹${subReduction.toLocaleString("en-IN")}.`,
      expectedImpact: subReduction,
      priority: totalSubCost > monthlyBudget * 0.1 ? "High" : "Low",
    });
  }

  // Action: remaining balance
  if (remainingBalance > 0) {
    actions.push({
      id: "move-remaining",
      title: "Move remaining balance to savings",
      explanation: `You have ₹${remainingBalance.toLocaleString("en-IN")} unspent this month. Transfer it directly to savings.`,
      expectedImpact: remainingBalance,
      priority: "High",
    });
  }

  // Action: increase monthly savings
  if (requiredMonthlySavings && possibleMonthlySavings < requiredMonthlySavings) {
    actions.push({
      id: "increase-savings",
      title: "Increase monthly savings target",
      explanation: `You need ₹${requiredMonthlySavings.toLocaleString("en-IN")}/month but can currently save ~₹${possibleMonthlySavings.toLocaleString("en-IN")}. Cut more spending or extend your timeline.`,
      expectedImpact: requiredMonthlySavings - possibleMonthlySavings,
      priority: "High",
    });
  }

  // Action: postpone non-essential
  if (discretionarySpending > monthlyBudget * 0.3) {
    actions.push({
      id: "postpone-nonessential",
      title: "Postpone non-essential expenses",
      explanation: `Discretionary spending is ${Math.round((discretionarySpending / monthlyBudget) * 100)}% of your budget. Delay low-priority purchases to accelerate savings.`,
      expectedImpact: Math.round(discretionarySpending * 0.2),
      priority: "Medium",
    });
  }

  // Fallback action
  if (actions.length === 0 && savingsGap > 0) {
    actions.push({
      id: "general-save",
      title: "Set aside a fixed monthly amount",
      explanation: `Save ₹${(estimatedMonths ? Math.ceil(savingsGap / Math.max(estimatedMonths, 1)) : savingsGap).toLocaleString("en-IN")} each month towards your goal.`,
      expectedImpact: estimatedMonths ? Math.ceil(savingsGap / estimatedMonths) : savingsGap,
      priority: "High",
    });
  }

  // Sort by priority
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Explanation
  const explanation = buildExplanation(input, savingsGap, discretionarySpending, monthlyBudget, possibleMonthlySavings, estimatedMonths);

  // Step plan
  const stepPlan: string[] = [];
  stepPlan.push(`📍 Immediate: ${actions[0]?.title || "Review your expenses"}`);
  if (requiredMonthlySavings) {
    stepPlan.push(`📅 Monthly: Save ₹${requiredMonthlySavings.toLocaleString("en-IN")} per month`);
  } else if (possibleMonthlySavings > 0) {
    stepPlan.push(`📅 Monthly: Save ₹${possibleMonthlySavings.toLocaleString("en-IN")} per month`);
  }
  if (estimatedMonths && estimatedMonths > 0) {
    stepPlan.push(`🎯 Goal: Reach ₹${input.targetSavings.toLocaleString("en-IN")} in ~${estimatedMonths} month${estimatedMonths > 1 ? "s" : ""}`);
  }

  return buildResult({
    input, savingsGap, progressPercentage, totalSpent, remainingBalance,
    discretionarySpending, requiredMonthlySavings, estimatedMonths,
    possibleMonthlySavings, actions, goalAchieved, explanation, stepPlan,
  });
}

function buildResult(p: {
  input: MeansEndInput; savingsGap: number; progressPercentage: number;
  totalSpent: number; remainingBalance: number; discretionarySpending: number;
  requiredMonthlySavings: number | null; estimatedMonths: number | null;
  possibleMonthlySavings: number; actions: RecommendedAction[];
  goalAchieved: boolean; explanation: string; stepPlan: string[];
}): MeansEndResult {
  return {
    currentSavings: p.input.currentSavings,
    targetSavings: p.input.targetSavings,
    savingsGap: p.savingsGap,
    progressPercentage: p.progressPercentage,
    totalSpent: p.totalSpent,
    remainingBalance: p.remainingBalance,
    discretionarySpending: p.discretionarySpending,
    requiredMonthlySavings: p.requiredMonthlySavings,
    estimatedMonths: p.estimatedMonths,
    possibleMonthlySavings: p.possibleMonthlySavings,
    actions: p.actions,
    explanation: p.explanation,
    goalAchieved: p.goalAchieved,
    stepPlan: p.stepPlan,
  };
}

function buildExplanation(
  input: MeansEndInput, gap: number, disc: number, budget: number,
  possible: number, months: number | null,
): string {
  const parts: string[] = [];
  parts.push(`Your current savings are ₹${input.currentSavings.toLocaleString("en-IN")} and your target is ₹${input.targetSavings.toLocaleString("en-IN")}.`);
  parts.push(`The savings gap is ₹${gap.toLocaleString("en-IN")}.`);

  if (disc > 0) {
    parts.push(`You spend ₹${disc.toLocaleString("en-IN")} on non-essential items, which is ${Math.round((disc / budget) * 100)}% of your budget.`);
  }
  if (possible > 0) {
    parts.push(`By optimizing your spending, you could save up to ₹${possible.toLocaleString("en-IN")} per month.`);
  }
  if (months && months > 0) {
    parts.push(`At this rate, you can reach your goal in approximately ${months} month${months > 1 ? "s" : ""}.`);
  }
  return parts.join(" ");
}
