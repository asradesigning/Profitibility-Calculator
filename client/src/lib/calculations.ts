import { 
  type Project, 
  type Scenario, 
  type ProjectWithScenarios,
  type FinancialCalculation,
  type MonthlyProjection,
  type ScenarioCalculations,
  type ProjectAnalysis
} from "@shared/schema";

/**
 * Calculate financial metrics for a specific scenario
 */
export function calculateFinancialMetrics(
  project: Project,
  scenario: Scenario
): FinancialCalculation {
  // Adjust values based on scenario parameters
  const growthMultiplier = 1 + (Number(scenario.growthRate) / 100);
  const costMultiplier = 1 + (Number(scenario.costAdjustment) / 100);
  
  const adjustedMonthlyRevenue = Number(project.expectedMonthlyRevenue) * growthMultiplier;
  const adjustedMonthlyFixedCosts = Number(project.monthlyFixedCosts) * costMultiplier;
  const adjustedVariableCosts = Number(project.variableCosts) * costMultiplier;
  
  // Calculate financial metrics
  const annualRevenue = adjustedMonthlyRevenue * 12;
  const annualFixedCosts = adjustedMonthlyFixedCosts * 12;
  const annualVariableCosts = (adjustedVariableCosts / 100) * annualRevenue;
  const totalAnnualCosts = annualFixedCosts + annualVariableCosts;
  const annualProfit = annualRevenue - totalAnnualCosts;
  
  // ROI calculation: (Net Profit / Initial Investment) * 100
  const roi = (annualProfit / Number(project.initialInvestment)) * 100;
  
  // Break-even calculation (months): Initial Investment / Monthly Profit
  const monthlyProfit = adjustedMonthlyRevenue - adjustedMonthlyFixedCosts - ((adjustedVariableCosts / 100) * adjustedMonthlyRevenue);
  const breakEven = Number(project.initialInvestment) / monthlyProfit;
  
  // Profit margin: (Net Profit / Revenue) * 100
  const profitMargin = (annualProfit / annualRevenue) * 100;
  
  // Risk level based on scenario
  let riskLevel: 'Low' | 'Medium' | 'High';
  
  if (scenario.name === 'Optimistic') {
    riskLevel = 'Low';
  } else if (scenario.name === 'Realistic') {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'High';
  }
  
  return {
    roi: parseFloat(roi.toFixed(1)),
    breakEven: parseFloat(breakEven.toFixed(1)),
    netProfit: parseFloat(annualProfit.toFixed(2)),
    profitMargin: parseFloat(profitMargin.toFixed(1)),
    riskLevel
  };
}

/**
 * Generate monthly projections for a specific scenario
 */
export function generateMonthlyProjections(
  project: Project,
  scenario: Scenario
): MonthlyProjection[] {
  // Adjust values based on scenario parameters
  const growthMultiplier = 1 + (Number(scenario.growthRate) / 100);
  const costMultiplier = 1 + (Number(scenario.costAdjustment) / 100);
  
  const adjustedMonthlyRevenue = Number(project.expectedMonthlyRevenue) * growthMultiplier;
  const adjustedMonthlyFixedCosts = Number(project.monthlyFixedCosts) * costMultiplier;
  const adjustedVariableCosts = Number(project.variableCosts) * costMultiplier;

  // Generate monthly projections
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    // Simple linear growth for demo purposes
    const monthRevenue = adjustedMonthlyRevenue * (1 + (0.02 * i));
    const monthExpenses = adjustedMonthlyFixedCosts + ((adjustedVariableCosts / 100) * monthRevenue);
    const monthProfit = monthRevenue - monthExpenses;
    
    return {
      month,
      revenue: parseFloat(monthRevenue.toFixed(2)),
      expenses: parseFloat(monthExpenses.toFixed(2)),
      profit: parseFloat(monthProfit.toFixed(2))
    };
  });
}

/**
 * Generate cost breakdown for a project
 */
export function generateCostBreakdown(project: Project) {
  return {
    initialInvestment: Number(project.initialInvestment),
    fixedCosts: Number(project.monthlyFixedCosts) * 12,
    variableCosts: Number(project.expectedMonthlyRevenue) * (Number(project.variableCosts) / 100) * 12
  };
}

/**
 * Generate recommendations based on analysis
 */
export function generateRecommendations(projectAnalysis: ProjectAnalysis): string[] {
  // In a real app, this would be more sophisticated
  // For now, return some generic recommendations
  return [
    "Consider phasing the initial investment to reduce upfront risk.",
    "Negotiate fixed-price contracts for key services to minimize variable cost risk.",
    "Implement a tiered pricing strategy to improve profit margins."
  ];
}

/**
 * Format currency values
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '$0.00';
  }
  const numValue = typeof value === 'string' ? Number(value) : value;
  
  if (isNaN(numValue)) {
    return '$0.00';
  }
  
  if (numValue >= 1000) {
    return `$${(numValue / 1000).toFixed(1)}K`;
  }
  return `$${numValue.toFixed(2)}`;
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0.0%';
  }
  const numValue = typeof value === 'string' ? Number(value) : value;
  
  if (isNaN(numValue)) {
    return '0.0%';
  }
  
  return `${numValue.toFixed(1)}%`;
}

/**
 * Format time periods (months)
 */
export function formatMonths(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0.0 mo';
  }
  const numValue = typeof value === 'string' ? Number(value) : value;
  
  if (isNaN(numValue)) {
    return '0.0 mo';
  }
  
  return `${numValue.toFixed(1)} mo`;
}
