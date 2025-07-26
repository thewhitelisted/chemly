// Credit utility functions for the new credit-based system

export interface CreditInfo {
  basic_credits_used: number;
  basic_credits_limit: number;
  premium_credits_used: number;
  premium_credits_limit: number;
  subscription_plan: string;
}

export const calculateCreditPercentage = (used: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.round((used / limit) * 100);
};

export const getRemainingCredits = (used: number, limit: number): number => {
  return Math.max(0, limit - used);
};

export const getCreditStatus = (used: number, limit: number): 'low' | 'medium' | 'high' => {
  const percentage = calculateCreditPercentage(used, limit);
  if (percentage >= 90) return 'low';
  if (percentage >= 70) return 'medium';
  return 'high';
};

export const formatCreditDisplay = (used: number, limit: number): string => {
  return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
};

export const getCreditStatusColor = (status: 'low' | 'medium' | 'high'): string => {
  switch (status) {
    case 'low': return 'text-red-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

export const getPlanDisplayName = (plan: string): string => {
  switch (plan.toLowerCase()) {
    case 'free': return 'Free';
    case 'pro': return 'Pro';
    case 'premium': return 'Premium';
    default: return plan;
  }
};

export const getPlanColor = (plan: string): string => {
  switch (plan.toLowerCase()) {
    case 'free': return 'text-gray-600';
    case 'pro': return 'text-blue-600';
    case 'premium': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

// Get plan-specific credit limits from Pricing.tsx
export const PLAN_LIMITS = {
  free: {
    basic_credits_limit: 200,
    premium_credits_limit: 35,
  },
  pro: {
    basic_credits_limit: 1000,
    premium_credits_limit: 750,
  },
  premium: {
    basic_credits_limit: 2000,
    premium_credits_limit: 1500,
  },
};

export const getExpectedLimitsForPlan = (plan: string) => {
  return PLAN_LIMITS[plan.toLowerCase() as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
};

// Check if user should consider upgrading
export const shouldSuggestUpgrade = (creditInfo: CreditInfo): boolean => {
  const basicPercentage = calculateCreditPercentage(creditInfo.basic_credits_used, creditInfo.basic_credits_limit);
  const premiumPercentage = calculateCreditPercentage(creditInfo.premium_credits_used, creditInfo.premium_credits_limit);
  
  // Suggest upgrade if either credit type is above 80% usage
  return basicPercentage >= 80 || premiumPercentage >= 80;
};

// Get next plan suggestion
export const getUpgradeSuggestion = (currentPlan: string): string | null => {
  switch (currentPlan.toLowerCase()) {
    case 'free': return 'pro';
    case 'pro': return 'premium';
    default: return null;
  }
}; 