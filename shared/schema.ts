import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  timeHorizon: integer("time_horizon").notNull().default(12),
  industry: text("industry").notNull(),
  initialInvestment: numeric("initial_investment").notNull(),
  monthlyFixedCosts: numeric("monthly_fixed_costs").notNull(),
  variableCosts: numeric("variable_costs").notNull(),
  expectedMonthlyRevenue: numeric("expected_monthly_revenue").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// Add a separate transformation function for project data
export const transformProjectData = (data: any) => {
  // Create a new object with only the fields we need
  const transformedData = {
    // Required fields with defaults
    name: data.name || "Untitled Project",
    goal: data.goal || "No goal specified",
    industry: data.industry || "Other",
    
    // Ensure timeHorizon is a number
    timeHorizon: data.timeHorizon !== undefined && data.timeHorizon !== null
      ? (typeof data.timeHorizon === 'string' ? parseInt(data.timeHorizon, 10) : data.timeHorizon)
      : 12,
      
    // Convert numeric fields to strings for the database
    initialInvestment: data.initialInvestment !== undefined && data.initialInvestment !== null
      ? String(data.initialInvestment)
      : "0",
    monthlyFixedCosts: data.monthlyFixedCosts !== undefined && data.monthlyFixedCosts !== null
      ? String(data.monthlyFixedCosts)
      : "0",
    variableCosts: data.variableCosts !== undefined && data.variableCosts !== null
      ? String(data.variableCosts)
      : "0",
    expectedMonthlyRevenue: data.expectedMonthlyRevenue !== undefined && data.expectedMonthlyRevenue !== null
      ? String(data.expectedMonthlyRevenue)
      : "0",
  };
  
  // Copy the userId if it exists (will be renamed to user_id by Drizzle ORM)
  if (data.userId !== undefined && data.userId !== null) {
    (transformedData as any).userId = data.userId;
  }
  
  return transformedData;
};

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(), 
  projectId: integer("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true),
  growthRate: numeric("growth_rate").notNull(),
  costAdjustment: numeric("cost_adjustment").notNull(),
});

export const insertScenarioSchema = createInsertSchema(scenarios)
  .omit({
    id: true,
  });

// Add a separate transformation function for scenario data
export const transformScenarioData = (data: any) => {
  if (!data) return {};
  
  // Create a new object with only the fields we need
  const transformedData: Record<string, any> = {};
  
  // Copy projectId and name if they exist
  if (data.projectId !== undefined) transformedData.projectId = data.projectId;
  if (data.name !== undefined) transformedData.name = data.name;
  
  // Copy enabled status
  if (data.enabled !== undefined) {
    transformedData.enabled = Boolean(data.enabled);
  }
  
  // Convert numeric fields to strings for the database
  transformedData.growthRate = data.growthRate !== undefined && data.growthRate !== null 
    ? String(data.growthRate) 
    : "0";
    
  transformedData.costAdjustment = data.costAdjustment !== undefined && data.costAdjustment !== null 
    ? String(data.costAdjustment) 
    : "0";
  
  return transformedData;
};

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;

// Full project data with scenarios
export type ProjectWithScenarios = Project & {
  scenarios: Scenario[];
};

// Financial calculations result types
export type FinancialCalculation = {
  roi: number;
  breakEven: number;
  netProfit: number;
  profitMargin: number;
  riskLevel: 'Low' | 'Medium' | 'High';
};

export type MonthlyProjection = {
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
};

export type ScenarioCalculations = {
  scenario: Scenario;
  financialMetrics: FinancialCalculation;
  monthlyProjections: MonthlyProjection[];
};

export type ProjectAnalysis = {
  project: Project;
  scenarios: ScenarioCalculations[];
  costBreakdown: {
    initialInvestment: number;
    fixedCosts: number;
    variableCosts: number;
  };
  recommendations: string[];
};
