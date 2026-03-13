// localStorage helpers for all finance data

export interface BudgetData {
  income: number;
  expenses: Record<string, number>;
}

export interface Subscription {
  id: string;
  name: string;
  monthlyCost: number;
}

export interface SavingsGoal {
  targetAmount: number;
  deadlineDate: string;
  savedSoFar: number;
}

export interface TripExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
}

export interface Trip {
  id: string;
  name: string;
  members: string[];
  expenses: TripExpense[];
}

function get<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Budget
export const getBudget = (): BudgetData => get("sfm_budget", { income: 0, expenses: {} });
export const saveBudget = (d: BudgetData) => set("sfm_budget", d);

// Subscriptions
export const getSubscriptions = (): Subscription[] => get("sfm_subs", []);
export const saveSubscriptions = (d: Subscription[]) => set("sfm_subs", d);

// Savings Goal
export const getSavingsGoal = (): SavingsGoal => get("sfm_savings", { targetAmount: 0, deadlineDate: "", savedSoFar: 0 });
export const saveSavingsGoal = (d: SavingsGoal) => set("sfm_savings", d);

// Trips
export const getTrips = (): Trip[] => get("sfm_trips", []);
export const saveTrips = (d: Trip[]) => set("sfm_trips", d);

// Format currency
export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
