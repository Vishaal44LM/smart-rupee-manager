// Greedy Algorithm for Expense Priority Scheduling

export type PriorityLevel = "High" | "Medium" | "Low";
export type ExpenseCategory = "Essential" | "Non-Essential";

export interface SchedulerExpense {
  id: string;
  name: string;
  amount: number;
  priority: PriorityLevel;
  category: ExpenseCategory;
}

export interface SchedulerResult {
  selected: SchedulerExpense[];
  postponed: SchedulerExpense[];
  totalSelectedCost: number;
  remainingBudget: number;
}

const PRIORITY_SCORE: Record<PriorityLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const CATEGORY_SCORE: Record<ExpenseCategory, number> = {
  Essential: 10,
  "Non-Essential": 0,
};

const ESSENTIAL_KEYWORDS = [
  "rent", "food", "groceries", "grocery", "transport", "fuel", "petrol", "diesel",
  "electricity", "water", "gas", "bills", "bill", "fees", "fee", "medicine",
  "medical", "hospital", "insurance", "emi", "loan", "school", "college",
  "tuition", "milk", "vegetables", "ration", "mobile recharge", "internet",
  "wifi", "tax", "maintenance",
];

const HIGH_PRIORITY_KEYWORDS = [
  "rent", "emi", "loan", "electricity", "water", "gas", "medicine", "medical",
  "hospital", "insurance", "fees", "fee", "tax", "school", "college", "tuition",
  "fuel", "petrol", "diesel", "milk", "groceries", "grocery", "ration",
];

const MEDIUM_PRIORITY_KEYWORDS = [
  "food", "transport", "mobile recharge", "internet", "wifi", "bills", "bill",
  "maintenance", "vegetables",
];

/**
 * Auto-detect priority and category from expense name using keyword matching.
 */
export function detectExpenseAttributes(name: string): {
  priority: PriorityLevel;
  category: ExpenseCategory;
} {
  const lower = name.toLowerCase().trim();

  const isEssential = ESSENTIAL_KEYWORDS.some((kw) => lower.includes(kw));
  const category: ExpenseCategory = isEssential ? "Essential" : "Non-Essential";

  let priority: PriorityLevel = "Low";
  if (HIGH_PRIORITY_KEYWORDS.some((kw) => lower.includes(kw))) {
    priority = "High";
  } else if (MEDIUM_PRIORITY_KEYWORDS.some((kw) => lower.includes(kw))) {
    priority = "Medium";
  }

  return { priority, category };
}

/**
 * Greedy Expense Priority Scheduler
 *
 * Steps:
 * 1. Compute a composite score for each expense:
 *      score = categoryScore + priorityScore
 *    (Essential expenses get +10, so they always rank above non-essential)
 * 2. Sort expenses descending by score; if tied, prefer lower amount.
 * 3. Iterate through the sorted list — greedily pick each expense
 *    if it fits within the remaining budget.
 * 4. Expenses that don't fit go into the "Postpone / Skip" list.
 */
export function greedySchedule(
  expenses: SchedulerExpense[],
  budget: number
): SchedulerResult {
  if (expenses.length === 0 || budget <= 0) {
    return { selected: [], postponed: [...expenses], totalSelectedCost: 0, remainingBudget: budget };
  }

  // Step 1 & 2: Sort by composite score desc, then amount asc
  const sorted = [...expenses].sort((a, b) => {
    const scoreA = CATEGORY_SCORE[a.category] + PRIORITY_SCORE[a.priority];
    const scoreB = CATEGORY_SCORE[b.category] + PRIORITY_SCORE[b.priority];
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.amount - b.amount; // prefer cheaper if tied
  });

  // Step 3 & 4: Greedy selection
  const selected: SchedulerExpense[] = [];
  const postponed: SchedulerExpense[] = [];
  let remaining = budget;

  for (const expense of sorted) {
    if (expense.amount <= remaining) {
      selected.push(expense);
      remaining -= expense.amount;
    } else {
      postponed.push(expense);
    }
  }

  return {
    selected,
    postponed,
    totalSelectedCost: budget - remaining,
    remainingBudget: remaining,
  };
}
