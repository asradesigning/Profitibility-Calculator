import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertScenarioSchema, 
  insertUserSchema, 
  transformProjectData,
  transformScenarioData 
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

import { setupAuth } from "./auth";

// Authentication middleware
const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up authentication
  setupAuth(app);

  // Projects API routes
  const projectsRouter = express.Router();

  // Apply authentication middleware to all project endpoints
  projectsRouter.use(authenticateUser);

  // Get all projects for the current user
  projectsRouter.get("/", async (req, res) => {
    try {
      // Get the current user from the session
      // The authenticateUser middleware guarantees req.user exists
      const userId = req.user!.id;
      
      // Get projects filtered by user ID
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get a specific project with scenarios
  projectsRouter.get("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get the current user ID from the session
      const userId = req.user!.id;

      // First get the project to check ownership
      const projectInfo = await storage.getProject(id);
      
      // Check if project exists and belongs to the current user
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view this project" });
      }

      // Now get the full project with scenarios
      const project = await storage.getProjectWithScenarios(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Create a new project
  projectsRouter.post("/", async (req, res) => {
    try {
      // The authenticateUser middleware guarantees req.user exists
      // Apply data transformation first
      const transformedData = transformProjectData({
        ...req.body,
        userId: req.user!.id // Set the current user ID with non-null assertion
      });
      
      // Then validate the transformed data
      const validatedData = insertProjectSchema.parse(transformedData);
      
      const newProject = await storage.createProject(validatedData);
      
      // Create default scenarios
      const scenarioNames = ["Realistic", "Optimistic", "Pessimistic"];
      const growthRates = [15, 25, 8];
      const costAdjustments = [0, -5, 15];
      
      for (let i = 0; i < scenarioNames.length; i++) {
        await storage.createScenario({
          projectId: newProject.id,
          name: scenarioNames[i],
          enabled: true,
          growthRate: growthRates[i].toString(),
          costAdjustment: costAdjustments[i].toString()
        });
      }
      
      // Return project with scenarios
      const projectWithScenarios = await storage.getProjectWithScenarios(newProject.id);
      res.status(201).json(projectWithScenarios);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error during project creation:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Update a project
  projectsRouter.put("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get the current user ID from the session
      const userId = req.user!.id;

      // First get the project to check ownership
      const projectInfo = await storage.getProject(id);
      
      // Check if project exists and belongs to the current user
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to update this project" });
      }

      // Apply data transformation first
      // Remove any userId from the request body to prevent ownership changes
      const { userId: clientUserId, ...safeData } = req.body;
      const transformedData = transformProjectData(safeData);
      
      // Then validate the transformed data
      const validatedData = insertProjectSchema.partial().parse(transformedData);
      
      const updatedProject = await storage.updateProject(id, validatedData);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error during project update:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete a project
  projectsRouter.delete("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get the current user ID from the session
      const userId = req.user!.id;

      // First get the project to check ownership
      const projectInfo = await storage.getProject(id);
      
      // Check if project exists and belongs to the current user
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to delete this project" });
      }

      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Scenarios API routes
  const scenariosRouter = express.Router();
  
  // Apply authentication middleware to all scenario endpoints
  scenariosRouter.use(authenticateUser);
  
  // Get all scenarios for a project
  scenariosRouter.get("/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get the current user ID from the session
      const userId = req.user!.id;

      // First get the project to check ownership
      const projectInfo = await storage.getProject(projectId);
      
      // Check if project exists and belongs to the current user
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to view scenarios for this project" });
      }

      const scenarios = await storage.getScenarios(projectId);
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ message: "Failed to fetch scenarios" });
    }
  });

  // Create a new scenario
  scenariosRouter.post("/", async (req, res) => {
    try {
      // Apply data transformation first
      const transformedData = transformScenarioData(req.body);
      
      // Then validate the transformed data
      const validatedData = insertScenarioSchema.parse(transformedData);
      
      // Get the current user ID from the session
      const userId = req.user!.id;
      
      // Check if the project belongs to the current user
      if (validatedData.projectId) {
        const projectInfo = await storage.getProject(validatedData.projectId);
        
        if (!projectInfo) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        if (projectInfo.userId !== userId) {
          return res.status(403).json({ message: "Access denied: You don't have permission to add scenarios to this project" });
        }
      }
      
      // Remove empty string values for numeric fields to prevent database errors
      // Create a copy of validatedData to modify
      const sanitizedData = { ...validatedData };
      
      // Handle empty string values for numeric fields
      if (sanitizedData.growthRate === "") {
        sanitizedData.growthRate = "0"; // Default to zero instead of empty string
      }
      
      if (sanitizedData.costAdjustment === "") {
        sanitizedData.costAdjustment = "0"; // Default to zero instead of empty string
      }
      
      const newScenario = await storage.createScenario(sanitizedData);
      res.status(201).json(newScenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error during scenario creation:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      console.error("Error creating scenario:", error);
      res.status(500).json({ message: "Failed to create scenario" });
    }
  });

  // Update a scenario
  scenariosRouter.put("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }

      // First, get the scenario to check if it exists 
      const scenario = await storage.getScenarioById(id);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      // Get the current user ID from the session
      const userId = req.user!.id;
      
      // Check if the project associated with this scenario belongs to the current user
      const projectInfo = await storage.getProject(scenario.projectId);
      
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to update this scenario" });
      }

      // Apply data transformation first
      const transformedData = transformScenarioData(req.body);
      
      // Then validate the transformed data
      const validatedData = insertScenarioSchema.partial().parse(transformedData);
      
      // Remove empty string values for numeric fields to prevent database errors
      // Create a copy of validatedData to modify
      const sanitizedData = { ...validatedData };
      
      // Handle empty string values for numeric fields
      if (sanitizedData.growthRate === "") {
        sanitizedData.growthRate = "0"; // Default to zero instead of empty string
      }
      
      if (sanitizedData.costAdjustment === "") {
        sanitizedData.costAdjustment = "0"; // Default to zero instead of empty string
      }
      
      const updatedScenario = await storage.updateScenario(id, sanitizedData);
      
      if (!updatedScenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json(updatedScenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error during scenario update:", JSON.stringify(error.errors));
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      console.error("Error updating scenario:", error);
      res.status(500).json({ message: "Failed to update scenario" });
    }
  });

  // Delete a scenario
  scenariosRouter.delete("/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }
      
      // First, get the scenario to check if it exists 
      const scenario = await storage.getScenarioById(id);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      // Get the current user ID from the session
      const userId = req.user!.id;
      
      // Check if the project associated with this scenario belongs to the current user
      const projectInfo = await storage.getProject(scenario.projectId);
      
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to delete this scenario" });
      }

      const success = await storage.deleteScenario(id);
      if (!success) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting scenario:", error);
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });

  // Analysis API route to calculate financial metrics
  // API for generating missing data questions
  app.post("/api/generate-questions", authenticateUser, async (req, res) => {
    try {
      const { projectData, language = 'en' } = req.body;
      
      if (!projectData) {
        return res.status(400).json({ message: "Project data is required" });
      }

      // Import the service for generating questions
      const { generateQuestionsForMissingData } = await import("./services/openai");
      
      // Generate questions based on the project data
      const questions = await generateQuestionsForMissingData(projectData, language as 'en' | 'fr');
      
      res.json({ questions });
    } catch (error) {
      console.error("Error generating missing data questions:", error);
      res.status(500).json({ 
        message: "Failed to generate questions",
        questions: [] 
      });
    }
  });
  
  // API for updating project data with answers to follow-up questions
  app.post("/api/projects/update-with-answers", authenticateUser, async (req, res) => {
    try {
      const { projectId, questions, answers, language = 'en' } = req.body;
      
      if (!projectId || !questions || !answers) {
        return res.status(400).json({ message: "ProjectId, questions, and answers are required" });
      }
      
      // Get the current user ID from the session
      const userId = req.user!.id;

      // Check if project exists and belongs to the current user
      const projectInfo = await storage.getProject(projectId);
      
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ 
          message: "Access denied: You don't have permission to update this project" 
        });
      }
      
      // Import the OpenAI service to process the answers
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Create pairs of questions and answers
      const questionAnswerPairs = questions.map((question: string, index: number) => {
        return {
          question,
          answer: answers[index] || ""
        };
      }).filter((pair: any) => pair.answer.trim() !== "");
      
      // If there are no valid answers, return error
      if (questionAnswerPairs.length === 0) {
        return res.status(400).json({ message: "No valid answers provided" });
      }
      
      // Use OpenAI to extract structured data from the answers
      const prompt = language === 'en' 
        ? `You are a financial assistant helping to extract structured project data from user responses. Based on the following question-answer pairs, update the project information. Return ONLY a JSON object with the fields that should be updated, with no explanation or commentary.`
        : `Vous êtes un assistant financier aidant à extraire des données de projet structurées à partir des réponses des utilisateurs. À partir des paires question-réponse suivantes, mettez à jour les informations du projet. Renvoyez UNIQUEMENT un objet JSON avec les champs qui doivent être mis à jour, sans explication ni commentaire.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: prompt
          },
          {
            role: "user",
            content: `Current project data: ${JSON.stringify(projectInfo)}\n\nQuestion-answer pairs: ${JSON.stringify(questionAnswerPairs)}`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Extract the updates from the response
      const content = response.choices[0].message.content || '{}';
      const updates = JSON.parse(content);
      
      // Clean up values that might contain non-numeric characters
      if (updates.variableCosts && typeof updates.variableCosts === 'string') {
        // Remove percentage signs or any other non-numeric characters except decimal points
        updates.variableCosts = updates.variableCosts.replace(/[^0-9.]/g, '');
      }
      
      // Apply the updates to the project
      const updatedProject = await storage.updateProject(projectId, updates);
      
      if (!updatedProject) {
        return res.status(404).json({ message: "Failed to update project" });
      }
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project with answers:", error);
      res.status(500).json({ message: "Failed to update project with answers" });
    }
  });
  
  app.post("/api/analysis", authenticateUser, async (req, res) => {
    try {
      const { projectId, language = 'en' } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      
      // Get the current user ID from the session
      const userId = req.user!.id;

      // First get the project to check ownership
      const projectInfo = await storage.getProject(projectId);
      
      // Check if project exists and belongs to the current user
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to analyze this project" });
      }
      
      const projectWithScenarios = await storage.getProjectWithScenarios(projectId);
      
      if (!projectWithScenarios) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Perform financial calculations for each scenario
      // In a real app, this would be more complex and would use actual calculation logic
      // For now, we'll return some sample calculations
      
      const { initialInvestment, monthlyFixedCosts, variableCosts, expectedMonthlyRevenue } = projectWithScenarios;
      
      // Calculate for each scenario
      const scenarioCalculations = projectWithScenarios.scenarios.map(scenario => {
        // Adjust values based on scenario parameters
        const growthMultiplier = 1 + (Number(scenario.growthRate) / 100);
        const costMultiplier = 1 + (Number(scenario.costAdjustment) / 100);
        
        const adjustedMonthlyRevenue = Number(expectedMonthlyRevenue) * growthMultiplier;
        const adjustedMonthlyFixedCosts = Number(monthlyFixedCosts) * costMultiplier;
        const adjustedVariableCosts = Number(variableCosts) * costMultiplier;
        
        // Calculate financial metrics
        const annualRevenue = adjustedMonthlyRevenue * 12;
        const annualFixedCosts = adjustedMonthlyFixedCosts * 12;
        const annualVariableCosts = (adjustedVariableCosts / 100) * annualRevenue;
        const totalAnnualCosts = annualFixedCosts + annualVariableCosts;
        const annualProfit = annualRevenue - totalAnnualCosts;
        
        // ROI calculation: (Net Profit / Initial Investment) * 100
        const roi = (annualProfit / Number(initialInvestment)) * 100;
        
        // Break-even calculation (months): Initial Investment / Monthly Profit
        const monthlyProfit = adjustedMonthlyRevenue - adjustedMonthlyFixedCosts - ((adjustedVariableCosts / 100) * adjustedMonthlyRevenue);
        const breakEven = Number(initialInvestment) / monthlyProfit;
        
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
        
        // Generate monthly projections
        const monthlyProjections = Array.from({ length: 12 }, (_, i) => {
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
        
        return {
          scenario,
          financialMetrics: {
            roi: parseFloat(roi.toFixed(1)),
            breakEven: parseFloat(breakEven.toFixed(1)),
            netProfit: parseFloat(annualProfit.toFixed(2)),
            profitMargin: parseFloat(profitMargin.toFixed(1)),
            riskLevel
          },
          monthlyProjections
        };
      });
      
      // Generate cost breakdown
      const costBreakdown = {
        initialInvestment: Number(initialInvestment),
        fixedCosts: Number(monthlyFixedCosts) * 12,
        variableCosts: Number(expectedMonthlyRevenue) * (Number(variableCosts) / 100) * 12
      };
      
      // Import OpenAI service and generate AI recommendations
      const { generateRecommendations } = await import('./services/openai');
      let recommendations;
      try {
        recommendations = await generateRecommendations(
          projectWithScenarios, 
          scenarioCalculations,
          language as 'en' | 'fr'
        );
      } catch (aiError) {
        console.error("Error generating AI recommendations:", aiError);
        // Fallback to default recommendations if AI fails
        recommendations = [
          "Consider phasing the initial investment to reduce upfront risk.",
          "Negotiate fixed-price contracts for key services to minimize variable cost risk.",
          "Implement a tiered pricing strategy to improve profit margins."
        ];
      }
      
      // Construct the full analysis response
      const analysis = {
        project: projectWithScenarios,
        scenarios: scenarioCalculations,
        costBreakdown,
        recommendations
      };
      
      res.json(analysis);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to perform analysis" });
    }
  });

  // User API routes
  const usersRouter = express.Router();
  
  // Create user (signup)
  usersRouter.post("/signup", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const newUser = await storage.createUser(validatedData);
      // Don't send password in response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Login
  usersRouter.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Don't send password in response
      const { password: userPassword, ...userWithoutPassword } = user;
      
      res.json({
        ...userWithoutPassword,
        message: "Login successful"
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // API route for generating reports using AI
  app.post("/api/report", authenticateUser, async (req, res) => {
    try {
      const { projectId, language = 'en', scenarioType } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      
      // Get the current user ID from the session
      const userId = req.user!.id;

      // First get the project to check ownership
      const projectInfo = await storage.getProject(projectId);
      
      // Check if project exists and belongs to the current user
      if (!projectInfo) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (projectInfo.userId !== userId) {
        return res.status(403).json({ message: "Access denied: You don't have permission to generate a report for this project" });
      }
      
      const projectWithScenarios = await storage.getProjectWithScenarios(projectId);
      
      if (!projectWithScenarios) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Calculate the scenario metrics first (reusing code from analysis endpoint)
      const { initialInvestment, monthlyFixedCosts, variableCosts, expectedMonthlyRevenue } = projectWithScenarios;
      
      // Calculate for each scenario
      const scenarioCalculations = projectWithScenarios.scenarios.map(scenario => {
        // Adjust values based on scenario parameters
        const growthMultiplier = 1 + (Number(scenario.growthRate) / 100);
        const costMultiplier = 1 + (Number(scenario.costAdjustment) / 100);
        
        const adjustedMonthlyRevenue = Number(expectedMonthlyRevenue) * growthMultiplier;
        const adjustedMonthlyFixedCosts = Number(monthlyFixedCosts) * costMultiplier;
        const adjustedVariableCosts = Number(variableCosts) * costMultiplier;
        
        // Calculate financial metrics
        const annualRevenue = adjustedMonthlyRevenue * 12;
        const annualFixedCosts = adjustedMonthlyFixedCosts * 12;
        const annualVariableCosts = (adjustedVariableCosts / 100) * annualRevenue;
        const totalAnnualCosts = annualFixedCosts + annualVariableCosts;
        const annualProfit = annualRevenue - totalAnnualCosts;
        
        // ROI calculation: (Net Profit / Initial Investment) * 100
        const roi = (annualProfit / Number(initialInvestment)) * 100;
        
        // Break-even calculation (months): Initial Investment / Monthly Profit
        const monthlyProfit = adjustedMonthlyRevenue - adjustedMonthlyFixedCosts - ((adjustedVariableCosts / 100) * adjustedMonthlyRevenue);
        const breakEven = Number(initialInvestment) / monthlyProfit;
        
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
        
        // Generate monthly projections
        const monthlyProjections = Array.from({ length: 12 }, (_, i) => {
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
        
        return {
          scenario,
          financialMetrics: {
            roi: parseFloat(roi.toFixed(1)),
            breakEven: parseFloat(breakEven.toFixed(1)),
            netProfit: parseFloat(annualProfit.toFixed(2)),
            profitMargin: parseFloat(profitMargin.toFixed(1)),
            riskLevel
          },
          monthlyProjections
        };
      });
      
      // Import OpenAI service for generating a detailed report
      const { generateAnalysisReport } = await import('./services/openai');
      let reportMarkdown;
      
      // Validate scenario type if provided
      let validatedScenarioType: 'Optimistic' | 'Realistic' | 'Pessimistic' | undefined = undefined;
      if (scenarioType) {
        if (['Optimistic', 'Realistic', 'Pessimistic'].includes(scenarioType)) {
          validatedScenarioType = scenarioType as 'Optimistic' | 'Realistic' | 'Pessimistic';
        } else {
          return res.status(400).json({ message: "Invalid scenario type. Must be one of: Optimistic, Realistic, Pessimistic" });
        }
      }
      
      try {
        reportMarkdown = await generateAnalysisReport(
          projectWithScenarios, 
          scenarioCalculations,
          language as 'en' | 'fr',
          validatedScenarioType
        );
      } catch (aiError) {
        console.error("Error generating AI report:", aiError);
        // Return error for report generation
        return res.status(500).json({ message: "Failed to generate AI report" });
      }
      
      res.json({ 
        reportMarkdown,
        language,
        scenarioType: validatedScenarioType
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // API route for explaining financial metrics
  app.post("/api/explain-metrics", authenticateUser, async (req, res) => {
    try {
      const { metrics, language = 'en' } = req.body;
      
      if (!metrics) {
        return res.status(400).json({ message: "Financial metrics are required" });
      }
      
      // Import OpenAI service for explaining metrics
      const { explainFinancialMetrics } = await import('./services/openai');
      let explanation;
      
      try {
        explanation = await explainFinancialMetrics(
          metrics,
          language as 'en' | 'fr'
        );
      } catch (aiError) {
        console.error("Error generating explanation:", aiError);
        // Return error for explanation generation
        return res.status(500).json({ message: "Failed to generate explanation" });
      }
      
      res.json({ explanation });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to explain metrics" });
    }
  });

  // API route for generating questions for missing data
  app.post("/api/missing-data-questions", authenticateUser, async (req, res) => {
    try {
      const { partialProject, language = 'en' } = req.body;
      
      if (!partialProject) {
        return res.status(400).json({ message: "Partial project data is required" });
      }
      
      // Import OpenAI service for generating questions
      const { generateQuestionsForMissingData } = await import('./services/openai');
      let questions;
      
      try {
        questions = await generateQuestionsForMissingData(
          partialProject,
          language as 'en' | 'fr'
        );
      } catch (aiError) {
        console.error("Error generating questions:", aiError);
        // Return error for question generation
        return res.status(500).json({ message: "Failed to generate questions" });
      }
      
      res.json({ questions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate questions" });
    }
  });

  // Register API routers
  app.use("/api/projects", projectsRouter);
  app.use("/api/scenarios", scenariosRouter);
  app.use("/api/users", usersRouter);

  return httpServer;
}
