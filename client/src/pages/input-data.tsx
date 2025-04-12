import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import DataEntryForm from "@/components/data-entry-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InputData() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Fetch projects
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ['/api/projects'],
  });

  // Create a new project
  const createProject = useMutation({
    mutationFn: async () => {
      // Create a default new project with appropriate type values
      const defaultProject = {
        name: "New Project",
        goal: "Define your project objectives",
        timeHorizon: 12, // This needs to be a number
        industry: "Technology",
        initialInvestment: 50000, // Convert numeric values to match DB schema
        monthlyFixedCosts: 5000,
        variableCosts: 20,
        expectedMonthlyRevenue: 15000,
        userId: 1, // Demo user ID
      };

      console.log("Creating project with data:", defaultProject);
      const res = await apiRequest("POST", "/api/projects", defaultProject);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Project Created",
        description: "New project has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setSelectedProjectId(data.id);
    },
    onError: (error) => {
      console.error("Project creation error:", error);
      
      toast({
        title: "Error",
        description: "Failed to create new project. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Project details query - defined at the top level
  const { data: project, isLoading: loadingProject } = useQuery<any>({
    queryKey: [`/api/projects/${selectedProjectId}`],
    enabled: !!selectedProjectId,
  });

  // If a project is selected, show the data entry form
  if (selectedProjectId) {
    if (loadingProject) {
      return <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>;
    }

    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Edit Project Data</h1>
        
        {project && (
          <DataEntryForm 
            project={project}
            scenarios={project.scenarios || []}
            onClose={() => setSelectedProjectId(null)}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
              queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}`] });
              setSelectedProjectId(null);
              toast({
                title: "Success",
                description: "Project data updated successfully",
              });
            }}
          />
        )}
      </div>
    );
  }

  // Otherwise, show the project list
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Project Management</h1>
        <Button 
          onClick={() => createProject.mutate()}
          className="bg-[#FF6B00] hover:bg-[#FF9D4D] w-full sm:w-auto"
          disabled={createProject.isPending}
        >
          {createProject.isPending ? "Creating..." : "Create New Project"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project: any) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle>{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">{project.goal}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Industry:</span>
                  <span className="font-medium">{project.industry}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Initial Investment:</span>
                  <span className="font-medium">${Number(project.initialInvestment).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(project.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4 text-[#FF6B00] border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProjectId(project.id);
                  }}
                >
                  Edit Data
                </Button>
              </CardContent>
            </Card>
          ))}

          {projects?.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No projects found. Create your first project to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
