import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  scenarios, type Scenario, type InsertScenario,
  type ProjectWithScenarios, type ProjectAnalysis, type FinancialCalculation, type MonthlyProjection, type ScenarioCalculations,
  transformScenarioData, transformProjectData
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Scenario operations
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  getScenarios(projectId: number): Promise<Scenario[]>;
  getScenarioById(id: number): Promise<Scenario | undefined>;
  updateScenario(id: number, scenario: Partial<Scenario>): Promise<Scenario | undefined>;
  deleteScenario(id: number): Promise<boolean>;
  
  // Get project with scenarios
  getProjectWithScenarios(projectId: number): Promise<ProjectWithScenarios | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    // Transform the data to ensure proper type handling
    const transformedData = transformProjectData(insertProject);
    const now = new Date();
    const [project] = await db.insert(projects).values({
      ...transformedData,
      createdAt: now,
      lastUpdated: now
    }).returning();
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjects(): Promise<Project[]> {
    console.log("WARNING: The getProjects() method is used, which doesn't filter by user ID. Should use getProjectsByUserId() instead.");
    return await db.select().from(projects);
  }
  
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    console.log(`Fetching projects for user ID: ${userId}`);
    const results = await db.select().from(projects).where(eq(projects.userId, userId));
    console.log(`Found ${results.length} projects for user ID ${userId}:`, results.map(p => p.id));
    return results;
  }

  async updateProject(id: number, projectUpdate: Partial<Project>): Promise<Project | undefined> {
    // Transform the data to ensure proper type handling
    const transformedData = transformProjectData(projectUpdate);
    const [project] = await db
      .update(projects)
      .set({
        ...transformedData,
        lastUpdated: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Delete associated scenarios first
    await db.delete(scenarios).where(eq(scenarios.projectId, id));
    
    // Then delete the project
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    
    return !!deletedProject;
  }

  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    // Transform the data to ensure proper type handling
    const transformedData = transformScenarioData(insertScenario);
    
    // Extract only the fields needed for the insert
    const dataToInsert = {
      projectId: transformedData.projectId,
      name: transformedData.name || 'Unnamed Scenario',
      enabled: transformedData.enabled !== undefined ? transformedData.enabled : true,
      growthRate: transformedData.growthRate || '0',
      costAdjustment: transformedData.costAdjustment || '0'
    };
    
    const [scenario] = await db.insert(scenarios).values(dataToInsert).returning();
    return scenario;
  }

  async getScenarios(projectId: number): Promise<Scenario[]> {
    return await db.select().from(scenarios).where(eq(scenarios.projectId, projectId));
  }
  
  async getScenarioById(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }

  async updateScenario(id: number, scenarioUpdate: Partial<Scenario>): Promise<Scenario | undefined> {
    // Transform the data to ensure proper type handling
    const transformedData = transformScenarioData(scenarioUpdate);
    
    // Create a properly structured update object
    const updateObj: Record<string, any> = {};
    
    // Only add fields that are present in the transformed data
    if (transformedData.name !== undefined) updateObj.name = transformedData.name;
    if (transformedData.enabled !== undefined) updateObj.enabled = transformedData.enabled;
    if (transformedData.growthRate !== undefined) updateObj.growthRate = transformedData.growthRate;
    if (transformedData.costAdjustment !== undefined) updateObj.costAdjustment = transformedData.costAdjustment;
    
    // Only proceed with update if there are fields to update
    if (Object.keys(updateObj).length === 0) {
      // If nothing to update, fetch and return the current scenario
      const [currentScenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
      return currentScenario;
    }
    
    const [scenario] = await db
      .update(scenarios)
      .set(updateObj)
      .where(eq(scenarios.id, id))
      .returning();
      
    return scenario;
  }

  async deleteScenario(id: number): Promise<boolean> {
    const [deletedScenario] = await db
      .delete(scenarios)
      .where(eq(scenarios.id, id))
      .returning({ id: scenarios.id });
    
    return !!deletedScenario;
  }

  async getProjectWithScenarios(projectId: number): Promise<ProjectWithScenarios | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;
    
    const scenarioList = await this.getScenarios(projectId);
    
    return {
      ...project,
      scenarios: scenarioList
    };
  }
}

export const storage = new DatabaseStorage();
