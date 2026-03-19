// 0/1 Knapsack Algorithm for Expense Optimization

export interface KnapsackExpense {
  id: string;
  name: string;
  amount: number;
  priority: number; // 1-5
}

export interface KnapsackResult {
  selected: KnapsackExpense[];
  rejected: KnapsackExpense[];
  totalCost: number;
  totalPriority: number;
  remainingBudget: number;
}

/**
 * 0/1 Knapsack using Dynamic Programming.
 *
 * weights[] = expense amounts
 * values[]  = expense priorities
 * capacity  = total budget
 *
 * dp[i][w] = max priority using first i items with budget w
 * Backtrack to find which items were selected.
 */
export function knapsackOptimize(
  expenses: KnapsackExpense[],
  budget: number
): KnapsackResult {
  const n = expenses.length;
  const W = Math.floor(budget);

  if (n === 0 || W <= 0) {
    return { selected: [], rejected: [...expenses], totalCost: 0, totalPriority: 0, remainingBudget: budget };
  }

  // Build DP table: dp[i][w]
  // i = 0..n, w = 0..W
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const weight = Math.floor(expenses[i - 1].amount);
    const value = expenses[i - 1].priority;
    for (let w = 0; w <= W; w++) {
      if (weight <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - weight] + value);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find selected items
  const selectedIndices = new Set<number>();
  let w = W;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedIndices.add(i - 1);
      w -= Math.floor(expenses[i - 1].amount);
    }
  }

  const selected = expenses.filter((_, i) => selectedIndices.has(i));
  const rejected = expenses.filter((_, i) => !selectedIndices.has(i));
  const totalCost = selected.reduce((sum, e) => sum + e.amount, 0);
  const totalPriority = selected.reduce((sum, e) => sum + e.priority, 0);

  return {
    selected,
    rejected,
    totalCost,
    totalPriority,
    remainingBudget: budget - totalCost,
  };
}
