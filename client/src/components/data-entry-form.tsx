import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle } from "lucide-react";
import MissingDataQuestions from "@/components/missing-data-questions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Flag, Coins } from "lucide-react";

// Create a form schema with validation
// Since insertProjectSchema has a transform now, we'll create a base validation schema separately
const projectFormSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  goal: z.string().min(10, "Project goal must be at least 10 characters"),
  industry: z.string(),
  timeHorizon: z.coerce.number().int().min(1, "Time horizon must be at least 1 month"),
  initialInvestment: z.coerce.number().min(1, "Initial investment must be greater than 0"),
  monthlyFixedCosts: z.coerce.number().min(0, "Monthly fixed costs cannot be negative"),
  variableCosts: z.coerce.number().min(0, "Variable costs cannot be negative").max(100, "Variable costs cannot exceed 100%"),
  expectedMonthlyRevenue: z.coerce.number().min(1, "Expected monthly revenue must be greater than 0"),
  userId: z.number(),
});

interface DataEntryFormProps {
  project?: any;
  scenarios?: any[];
  onClose: () => void;
  onSave: () => void;
}

export default function DataEntryForm({ project, scenarios = [], onClose, onSave }: DataEntryFormProps) {
  const { toast } = useToast();
  const [showMissingDataQuestions, setShowMissingDataQuestions] = useState(false);
  const [scenarioValues, setScenarioValues] = useState(
    scenarios.map(scenario => ({
      id: scenario.id,
      projectId: scenario.projectId,
      name: scenario.name,
      enabled: scenario.enabled,
      growthRate: scenario.growthRate,
      costAdjustment: scenario.costAdjustment
    }))
  );
  
  // Initialize form with project data or defaults
  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project ? {
      ...project,
      initialInvestment: Number(project.initialInvestment),
      monthlyFixedCosts: Number(project.monthlyFixedCosts),
      variableCosts: Number(project.variableCosts),
      expectedMonthlyRevenue: Number(project.expectedMonthlyRevenue),
    } : {
      name: "New Project",
      goal: "Define your project objectives",
      timeHorizon: 12,
      industry: "Technology",
      initialInvestment: 50000,
      monthlyFixedCosts: 5000,
      variableCosts: 20,
      expectedMonthlyRevenue: 15000,
      userId: 1, // Demo user ID
    }
  });
  
  // Update project mutation
  const updateProject = useMutation({
    mutationFn: async (data: z.infer<typeof projectFormSchema>) => {
      if (project) {
        // Update existing project
        await apiRequest('PUT', `/api/projects/${project.id}`, data);
        
        // Update scenarios
        for (const scenario of scenarioValues) {
          await apiRequest('PUT', `/api/scenarios/${scenario.id}`, {
            growthRate: scenario.growthRate,
            costAdjustment: scenario.costAdjustment,
            enabled: scenario.enabled
          });
        }
      } else {
        // Create new project
        await apiRequest('POST', '/api/projects', data);
      }
    },
    onSuccess: () => {
      toast({
        title: project ? "Project Updated" : "Project Created",
        description: project ? "Project data has been updated successfully." : "New project has been created successfully.",
      });
      onSave();
    },
    onError: (error: any) => {
      console.error("Save project error details:", error);
      toast({
        title: "Error",
        description: "Failed to save project data. See console for details.",
        variant: "destructive"
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof projectFormSchema>) => {
    // Check for potentially incomplete data
    const hasGenericOrVagueData = 
      data.name === "New Project" || 
      data.goal === "Define your project objectives" ||
      data.goal.length < 15 ||
      data.industry === "Other" || 
      data.monthlyFixedCosts <= 0 || 
      data.variableCosts <= 0;
    
    // Process the update regardless, but show missing data questions if needed
    updateProject.mutate(data, {
      onSuccess: () => {
        // Always show follow-up questions for new projects or incomplete data
        if (!project || hasGenericOrVagueData) {
          // Wait briefly for the UI to update before showing questions
          setTimeout(() => {
            setShowMissingDataQuestions(true);
          }, 500);
        } else {
          // Complete the flow normally if data seems complete
          onSave();
        }
      }
    });
  };
  
  // Update scenario values
  const handleScenarioChange = (id: number, field: string, value: any) => {
    setScenarioValues(prev => 
      prev.map(scenario => 
        scenario.id === id 
          ? { ...scenario, [field]: value } 
          : scenario
      )
    );
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Project Data Entry</h2>
          <Button variant="ghost" onClick={onClose} size="icon" aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-[#1A1A1A] mb-4 flex items-center">
                  <Flag className="text-[#FF6B00] mr-2 h-5 w-5" />
                  Project Information
                </h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Web Application Development" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Goal</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of project objectives" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeHorizon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Horizon (months)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-[#1A1A1A] mb-4 flex items-center">
                  <Coins className="text-[#FF6B00] mr-2 h-5 w-5" />
                  Financial Data
                </h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="initialInvestment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Investment ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="monthlyFixedCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Fixed Costs ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 5000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="variableCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variable Costs (% of revenue)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expectedMonthlyRevenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Monthly Revenue ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 20000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-medium text-[#1A1A1A] mb-4 flex items-center">
                <span className="material-icons text-[#FF6B00] mr-2">scatter_plot</span>
                Scenario Parameters
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scenarioValues.map((scenario) => (
                  <div key={scenario.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{scenario.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Enable</span>
                        <Switch 
                          checked={scenario.enabled}
                          onCheckedChange={(checked) => handleScenarioChange(scenario.id, 'enabled', checked)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <FormLabel htmlFor={`growth-${scenario.id}`}>Growth Rate (%)</FormLabel>
                        <Input
                          id={`growth-${scenario.id}`}
                          type="number"
                          value={Number(scenario.growthRate)}
                          onChange={(e) => handleScenarioChange(scenario.id, 'growthRate', e.target.value)}
                          disabled={!scenario.enabled}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel htmlFor={`cost-${scenario.id}`}>Cost Adjustment (%)</FormLabel>
                        <Input
                          id={`cost-${scenario.id}`}
                          type="number"
                          value={Number(scenario.costAdjustment)}
                          onChange={(e) => handleScenarioChange(scenario.id, 'costAdjustment', e.target.value)}
                          disabled={!scenario.enabled}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#FF6B00] hover:bg-[#FF9D4D] w-full sm:w-auto"
                  disabled={updateProject.isPending}
                >
                  {updateProject.isPending ? "Saving..." : "Calculate Profitability"}
                </Button>
              </div>
            </div>
            
            {/* Missing Data Questions Panel */}
            {showMissingDataQuestions && (
              <MissingDataQuestions
                projectData={form.getValues()}
                onClose={() => setShowMissingDataQuestions(false)}
                onUpdate={onSave}
              />
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
