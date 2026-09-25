export interface BenefitItem {
  benefitId: number;
  title: string;
  description: string;
  icon: string;
}

export interface FeatureItem {
  featureId: number;
  title: string;
  description: string;
  icon: string;
}

export interface PricingPlan {
  planId: number;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  variant: "primary" | "outline";
  popular?: boolean;
}

export interface SolutionStep {
  step: string;
  title: string;
  description: string;
  icon: string;
}
