// Minimax-based Budget Decision Assistant
// MAX level: user wants to maximize usefulness of spending
// MIN level: system wants to minimize risk of overspending

export interface DecisionInput {
  monthlyBudget: number;
  totalSpent: number;
  newExpenseAmount: number;
  expenseCategory: string;
  remainingDays: number;
  minimumReserve: number;
}

export interface DecisionResult {
  recommendation: "SPEND" | "SAVE";
  score: number;
  reason: string;
  spendScore: number;
  saveScore: number;
}

const ESSENTIAL_CATEGORIES = ["food", "transport", "bills"];
const NON_ESSENTIAL_CATEGORIES = ["shopping", "entertainment"];

function isEssential(category: string): boolean {
  return ESSENTIAL_CATEGORIES.includes(category.toLowerCase());
}

/**
 * Evaluate a terminal node's utility score.
 * Higher score = better outcome for the user.
 * Range roughly -100 to +100.
 */
function evaluateUtility(
  balanceAfter: number,
  minimumReserve: number,
  remainingDays: number,
  category: string,
  didSpend: boolean,
  expenseAmount: number,
  totalBudget: number
): number {
  let score = 0;
  const essential = isEssential(category);
  // How much of the budget this expense represents (0 to 1+)
  const expenseRatio = totalBudget > 0 ? expenseAmount / totalBudget : 0;
  // How safe the remaining balance is relative to the reserve
  const bufferRatio = minimumReserve > 0 ? balanceAfter / minimumReserve : 10;
  // Usage percentage after this decision
  const usageRatio = totalBudget > 0 ? (totalBudget - balanceAfter) / totalBudget : 0;

  if (didSpend) {
    // === SPEND PATH ===

    // 1. Reserve safety — scales with how far below/above reserve
    if (balanceAfter < 0) {
      score -= 40 - Math.round(expenseRatio * 20); // bigger expense = worse
    } else if (balanceAfter < minimumReserve) {
      score -= Math.round(20 + expenseRatio * 15);
    } else {
      score += Math.round(15 + (bufferRatio - 1) * 8); // more buffer = more confident
    }

    // 2. Category importance — essential expenses get higher spend scores
    if (essential) {
      score += Math.round(20 + expenseRatio * 10); // essential + costly = still worth it
    } else {
      score -= Math.round(5 + expenseRatio * 20); // non-essential + costly = penalized more
    }

    // 3. Expense size impact — small expenses score better for spending
    if (expenseRatio < 0.05) {
      score += 15; // tiny expense, safe to spend
    } else if (expenseRatio < 0.15) {
      score += 8;
    } else if (expenseRatio < 0.3) {
      score -= 5;
    } else {
      score -= Math.round(15 + expenseRatio * 10); // large chunk of budget
    }

    // 4. Overall budget health
    if (usageRatio > 0.9) {
      score -= 20;
    } else if (usageRatio > 0.75) {
      score -= 10;
    } else if (usageRatio < 0.5) {
      score += 10;
    }

  } else {
    // === SAVE PATH ===

    // 1. Budget tightness — saving is more valuable when budget is tight
    if (bufferRatio < 0.5) {
      score += 35; // critically low, saving is essential
    } else if (bufferRatio < 1) {
      score += 25 + Math.round(expenseRatio * 10);
    } else if (bufferRatio < 1.5) {
      score += 15 + Math.round(expenseRatio * 8);
    } else if (bufferRatio < 2.5) {
      score += 8 + Math.round(expenseRatio * 5);
    } else {
      score += 3; // plenty of buffer, saving has low urgency
    }

    // 2. Expense size — saving on bigger expenses has more impact
    if (expenseRatio >= 0.3) {
      score += Math.round(20 + expenseRatio * 10); // big expense, saving matters a lot
    } else if (expenseRatio >= 0.15) {
      score += 12;
    } else if (expenseRatio >= 0.05) {
      score += 5;
    } else {
      score += 1; // tiny expense, saving doesn't matter much
    }

    // 3. Category — skipping essentials has a cost
    if (essential) {
      score -= Math.round(15 + expenseRatio * 10); // worse to skip expensive essentials
    } else {
      score += Math.round(10 + expenseRatio * 12); // better to skip expensive non-essentials
    }

    // 4. Overall budget health — more spent = more reason to save
    if (usageRatio > 0.9) {
      score += 20;
    } else if (usageRatio > 0.75) {
      score += 12;
    } else if (usageRatio < 0.4) {
      score -= 5; // budget is healthy, saving is less urgent
    }
  }

  return score;
}

/**
 * Minimax decision tree (depth 2):
 *
 * Root (MAX — user's turn: choose spend or save)
 * ├── SPEND (MIN — system evaluates worst-case risk)
 * │   ├── Scenario: remaining days are low → utility(...)
 * │   └── Scenario: remaining days are normal → utility(...)
 * └── SAVE  (MIN — system evaluates worst-case risk)
 *     ├── Scenario: remaining days are low → utility(...)
 *     └── Scenario: remaining days are normal → utility(...)
 *
 * At MIN level we take the minimum (worst case).
 * At MAX level we take the maximum (best choice for user).
 */
export function minimaxDecision(input: DecisionInput): DecisionResult {
  const {
    monthlyBudget,
    totalSpent,
    newExpenseAmount,
    expenseCategory,
    remainingDays,
    minimumReserve,
  } = input;

  const balanceIfSpend = monthlyBudget - (totalSpent + newExpenseAmount);
  const balanceIfSave = monthlyBudget - totalSpent;

  // --- MIN level for SPEND: evaluate two scenarios (pessimistic & normal) ---
  const spendScoreWorst = evaluateUtility(
    balanceIfSpend,
    minimumReserve,
    Math.max(1, Math.floor(remainingDays * 0.5)),
    expenseCategory,
    true,
    newExpenseAmount,
    monthlyBudget
  );
  const spendScoreNormal = evaluateUtility(
    balanceIfSpend,
    minimumReserve,
    remainingDays,
    expenseCategory,
    true,
    newExpenseAmount,
    monthlyBudget
  );
  // MIN picks worst case
  const spendScore = Math.min(spendScoreWorst, spendScoreNormal);

  // --- MIN level for SAVE: evaluate two scenarios ---
  const saveScoreWorst = evaluateUtility(
    balanceIfSave,
    minimumReserve,
    Math.max(1, Math.floor(remainingDays * 0.5)),
    expenseCategory,
    false,
    newExpenseAmount,
    monthlyBudget
  );
  const saveScoreNormal = evaluateUtility(
    balanceIfSave,
    minimumReserve,
    remainingDays,
    expenseCategory,
    false,
    newExpenseAmount,
    monthlyBudget
  );
  const saveScore = Math.min(saveScoreWorst, saveScoreNormal);

  // --- MAX level: user picks the best option ---
  const recommendation: "SPEND" | "SAVE" = spendScore >= saveScore ? "SPEND" : "SAVE";

  // Generate human-readable reason
  const reason = generateReason(input, balanceIfSpend, recommendation);

  return {
    recommendation,
    score: Math.max(spendScore, saveScore),
    reason,
    spendScore,
    saveScore,
  };
}

function generateReason(
  input: DecisionInput,
  balanceAfterSpend: number,
  rec: "SPEND" | "SAVE"
): string {
  const { minimumReserve, expenseCategory, remainingDays, newExpenseAmount } = input;
  const essential = isEssential(expenseCategory);

  if (rec === "SPEND") {
    if (essential && balanceAfterSpend >= minimumReserve) {
      return `Recommended: "${expenseCategory}" is an essential expense and your remaining budget (₹${balanceAfterSpend.toLocaleString("en-IN")}) is still above your safe reserve.`;
    }
    if (balanceAfterSpend >= minimumReserve) {
      return `Acceptable: your remaining balance (₹${balanceAfterSpend.toLocaleString("en-IN")}) stays above the safety reserve of ₹${minimumReserve.toLocaleString("en-IN")}.`;
    }
    return `Proceed with caution: spending ₹${newExpenseAmount.toLocaleString("en-IN")} leaves a tight budget, but the expense may be justified.`;
  }

  // SAVE
  if (balanceAfterSpend < 0) {
    return `Not recommended: this expense would exceed your total monthly budget.`;
  }
  if (balanceAfterSpend < minimumReserve) {
    return `Not recommended: spending ₹${newExpenseAmount.toLocaleString("en-IN")} would reduce your balance below the safe reserve of ₹${minimumReserve.toLocaleString("en-IN")}.`;
  }
  if (!essential && remainingDays <= 7) {
    return `Not recommended: with only ${remainingDays} days left, saving on non-essential "${expenseCategory}" expenses is wiser.`;
  }
  return `Saving is the better choice right now to maintain a healthy budget for the remaining ${remainingDays} days.`;
}
