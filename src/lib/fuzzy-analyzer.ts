// Fuzzy Financial Health Analyzer – Membership Functions & Rule Engine

export interface FuzzyInput {
  monthlyBudget: number;
  totalSpent: number;
  remainingBalance: number;
  savingsAmount: number;
}

export interface MembershipValues {
  low: number;
  medium: number;
  high: number;
}

export interface FuzzyResult {
  healthScore: number;       // 0–100
  riskScore: number;         // 0–100
  spendingLevel: MembershipValues;
  savingsLevel: MembershipValues;
  balanceLevel: { poor: number; moderate: number; good: number };
  spendingLabel: string;
  savingsLabel: string;
  balanceLabel: string;
  healthLabel: string;
  riskLabel: string;
  dominantRule: string;
  interpretation: string;
}

// ---------- Membership functions (trapezoidal / triangular) ----------

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// Spending % membership (totalSpent / budget * 100)
function spendingMembership(pct: number): MembershipValues {
  return {
    low: clamp01(pct <= 30 ? 1 : (40 - pct) / 10),
    medium: clamp01(pct <= 30 ? (pct - 30) / 10 : pct <= 50 ? 1 : (70 - pct) / 20),
    high: clamp01(pct <= 60 ? (pct - 60) / 15 : 1),
  };
}

// Savings % membership (savings / budget * 100)
function savingsMembership(pct: number): MembershipValues {
  return {
    low: clamp01(pct <= 5 ? 1 : (10 - pct) / 5),
    medium: clamp01(pct <= 5 ? (pct - 5) / 5 : pct <= 12 ? 1 : (20 - pct) / 8),
    high: clamp01(pct <= 15 ? (pct - 15) / 5 : 1),
  };
}

// Remaining balance % membership
function balanceMembership(pct: number): { poor: number; moderate: number; good: number } {
  return {
    poor: clamp01(pct <= 10 ? 1 : (20 - pct) / 10),
    moderate: clamp01(pct <= 15 ? (pct - 15) / 10 : pct <= 30 ? 1 : (45 - pct) / 15),
    good: clamp01(pct <= 40 ? (pct - 40) / 10 : 1),
  };
}

function labelFromMembership(vals: { [key: string]: number }): string {
  const entries = Object.entries(vals).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "Unknown";
  const [top, second] = entries;
  if (!second || second[1] < 0.15 || top[1] - second[1] > 0.4) {
    return capitalize(top[0]);
  }
  return `${capitalize(second[0])}-${capitalize(top[0])}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- Fuzzy rules → health & risk ----------

interface FuzzyRuleResult {
  healthContrib: number;
  riskContrib: number;
  strength: number;
  description: string;
}

function fuzzyRules(
  sp: MembershipValues,
  sv: MembershipValues,
  bl: { poor: number; moderate: number; good: number },
): FuzzyRuleResult[] {
  return [
    {
      strength: Math.min(sp.high, sv.low),
      healthContrib: 20,
      riskContrib: 90,
      description: "Spending is HIGH and savings are LOW → Risk is HIGH, Health is POOR",
    },
    {
      strength: Math.min(sp.medium, sv.medium),
      healthContrib: 55,
      riskContrib: 45,
      description: "Spending is MEDIUM and savings are MEDIUM → Health is MODERATE",
    },
    {
      strength: Math.min(sp.low, sv.high),
      healthContrib: 90,
      riskContrib: 10,
      description: "Spending is LOW and savings are HIGH → Health is GOOD, Risk is LOW",
    },
    {
      strength: Math.min(sp.high, bl.poor),
      healthContrib: 10,
      riskContrib: 95,
      description: "Spending is HIGH and balance is POOR → Risk is VERY HIGH",
    },
    {
      strength: Math.min(sp.low, bl.good),
      healthContrib: 85,
      riskContrib: 10,
      description: "Spending is LOW and balance is GOOD → Health is GOOD",
    },
    {
      strength: Math.min(sv.high, sp.medium),
      healthContrib: 70,
      riskContrib: 25,
      description: "Savings are HIGH even with MEDIUM spending → Health improves",
    },
    {
      strength: Math.min(sp.high, sv.high),
      healthContrib: 50,
      riskContrib: 50,
      description: "Both spending and savings are HIGH → Balanced but stretched",
    },
    {
      strength: Math.min(sp.low, sv.low),
      healthContrib: 45,
      riskContrib: 40,
      description: "Both spending and savings are LOW → Under-utilised budget",
    },
  ];
}

function scoreLabel(score: number, type: "health" | "risk"): string {
  if (type === "health") {
    if (score >= 75) return "Good";
    if (score >= 45) return "Moderate";
    return "Poor";
  }
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

// ---------- Main analyzer ----------

export function analyzeFuzzyHealth(input: FuzzyInput): FuzzyResult {
  const budget = Math.max(input.monthlyBudget, 1);
  const spendPct = (input.totalSpent / budget) * 100;
  const savePct = (input.savingsAmount / budget) * 100;
  const balPct = (input.remainingBalance / budget) * 100;

  const sp = spendingMembership(spendPct);
  const sv = savingsMembership(savePct);
  const bl = balanceMembership(balPct);

  const ruleResults = fuzzyRules(sp, sv, bl);

  // Weighted average defuzzification
  let healthNum = 0, healthDen = 0, riskNum = 0, riskDen = 0;
  for (const r of ruleResults) {
    if (r.strength > 0) {
      healthNum += r.strength * r.healthContrib;
      healthDen += r.strength;
      riskNum += r.strength * r.riskContrib;
      riskDen += r.strength;
    }
  }

  const healthScore = healthDen > 0 ? Math.round(healthNum / healthDen) : 50;
  const riskScore = riskDen > 0 ? Math.round(riskNum / riskDen) : 50;

  const dominant = ruleResults.reduce((a, b) => (b.strength > a.strength ? b : a), ruleResults[0]);

  const spendingLabel = labelFromMembership({ ...sp });
  const savingsLabel = labelFromMembership({ ...sv });
  const balanceLabel = labelFromMembership({ ...bl });
  const healthLabel = scoreLabel(healthScore, "health");
  const riskLabel = scoreLabel(riskScore, "risk");

  const interpretation = buildInterpretation(spendingLabel, savingsLabel, healthLabel, riskLabel);

  return {
    healthScore,
    riskScore,
    spendingLevel: sp,
    savingsLevel: sv,
    balanceLevel: bl,
    spendingLabel,
    savingsLabel,
    balanceLabel,
    healthLabel,
    riskLabel,
    dominantRule: dominant.description,
    interpretation,
  };
}

function buildInterpretation(spending: string, savings: string, health: string, risk: string): string {
  const parts: string[] = [];
  parts.push(`Your spending level is ${spending.toLowerCase()}`);
  parts.push(`your savings level is ${savings.toLowerCase()}`);
  parts.push(`resulting in ${health.toLowerCase()} financial health with ${risk.toLowerCase()} risk.`);

  if (risk === "High") {
    parts.push("Consider cutting non-essential expenses and building an emergency fund.");
  } else if (health === "Good") {
    parts.push("You are managing your finances well. Keep it up!");
  } else {
    parts.push("There is room for improvement. Review your spending categories.");
  }

  return parts.join(", ").replace(", resulting", ". This results").replace(", Consider", " Consider").replace(", You are", " You are").replace(", There", " There");
}
