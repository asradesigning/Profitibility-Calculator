import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatPercentage, formatMonths } from "@/lib/calculations";
import { type ProjectWithScenarios, type ProjectAnalysis, type Scenario, type Project } from "@shared/schema";
import ScenarioSelector from "@/components/scenario-selector";
import KpiSummary from "@/components/kpi-summary";
import RevenueExpensesChart from "@/components/charts/revenue-expenses";
import ProfitProjectionChart from "@/components/charts/profit-projection";
import CostBreakdownChart from "@/components/charts/cost-breakdown";
import ScenarioComparison from "@/components/scenario-comparison";
import RecommendationPanel from "@/components/recommendation-panel";
import DataEntryForm from "@/components/data-entry-form";
import MissingDataQuestions from "@/components/missing-data-questions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Share2Icon, DownloadIcon, FolderIcon, Trash } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [showDataForm, setShowDataForm] = useState(false);
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>("Realistic");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [language, setLanguage] = useState<"en" | "fr">("fr"); // Set French as default language
  
  // Fetch projects and sort by createdAt (most recent first)
  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    select: (data) => {
      // Sort projects by createdAt date (newest first)
      return [...data].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
    }
  });

  // Set the most recent project as default when projects are loaded
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id); // Select the most recent project
    }
  }, [projects, selectedProjectId]);
  
  // Use the selected project ID
  const currentProjectId = selectedProjectId;

  // Perform analysis for the selected project
  const { data: analysis, isLoading: loadingAnalysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ['/api/analysis', currentProjectId],
    enabled: !!currentProjectId,
    queryFn: async () => {
      try {
        const res = await apiRequest('POST', '/api/analysis', { projectId: currentProjectId });
        return await res.json();
      } catch (error) {
        toast({
          title: "Analysis Error",
          description: "Failed to perform financial analysis",
          variant: "destructive"
        });
        throw error;
      }
    },
  });
  
  // Mutation for generating project analysis
  const generateProjectAnalysisMutation = useMutation({
    mutationFn: async () => {
      if (!currentProjectId) return null;
      const res = await apiRequest("POST", "/api/generate-questions", {
        projectData: analysis?.project,
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.questions?.length > 0) {
        setShowProjectAnalysis(true);
      }
    },
    onError: (error) => {
      console.error("Error analyzing project:", error);
    }
  });

  // Update analysis when the selected project changes
  useEffect(() => {
    if (currentProjectId) {
      refetchAnalysis().then(() => {
        // After analysis is refreshed, occasionally check if the project needs more data
        // Increased frequency to show follow-up questions more often (~70% of the time)
        if (Math.random() < 0.7) {
          setTimeout(() => {
            generateProjectAnalysisMutation.mutate();
          }, 1000); // Wait a second to ensure analysis data is loaded
        }
      });
    }
  }, [currentProjectId, refetchAnalysis]);

  const isLoading = loadingProjects || loadingAnalysis;
  
  // Get the active scenario data
  const activeScenarioData = analysis?.scenarios?.find(
    (s: any) => s.scenario.name === selectedScenario
  );

  // Format the last updated date
  const formatLastUpdated = (dateString?: string | Date) => {
    if (!dateString) return "Never";
    
    const date = typeof dateString === 'string' 
      ? new Date(dateString) 
      : dateString;
      
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle form toggle
  const toggleDataForm = () => {
    setShowDataForm(!showDataForm);
  };
  
  return (
    <>
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">Analyse de Rentabilité d'Entreprise</h1>
            <p className="text-[#666666]">
              Tableau de bord pour <span className="font-medium">
                {analysis?.project?.name || "Chargement..."}
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            {/* <Button 
              variant="outline" 
              className="flex items-center text-sm"
              onClick={() => {
                // Create shareable link
                const url = window.location.href;
                // Copy to clipboard
                navigator.clipboard.writeText(url).then(() => {
                  toast({
                    title: "Lien copié dans le presse-papiers",
                    description: "Vous pouvez maintenant partager ce tableau de bord avec d'autres personnes",
                  });
                });
              }}
            >
              <Share2Icon className="h-4 w-4 mr-2" />
              Partager
            </Button> */}
            <Button 
              variant="default" 
              className="bg-[#1A1A1A] hover:bg-[#333333] flex items-center text-sm"
              onClick={() => {
                toast({
                  title: "Préparation de l'exportation...",
                  description: "Votre rapport sera disponible sous peu",
                });
                
                try {
                  // Generate a comprehensive report with all the analysis data
                  setTimeout(() => {
                    // Create a document with all the relevant analysis data from selected project
                    const selectedProject = projects?.find(p => p.id === selectedProjectId);
                    if (!selectedProject) {
                      toast({
                        title: "Erreur d'exportation",
                        description: "Veuillez sélectionner un projet d'abord",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    // Get the analysis data for the project
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>${selectedProject.name} - Rapport Financier</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 20px; }
                              h1, h2, h3 { color: #1A1A1A; }
                              .section { margin-bottom: 20px; }
                              table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                              th { background-color: #f2f2f2; }
                              .metric-name { color: #666666; }
                              .metric-value { font-weight: bold; }
                              .recommendations { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
                            </style>
                          </head>
                          <body>
                            <h1>${selectedProject.name} - Rapport Financier</h1>
                            <p>Généré le ${new Date().toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}</p>
                            
                            <div class="section">
                              <h2>Aperçu du Projet</h2>
                              <table>
                                <tr><td class="metric-name">Nom du projet:</td><td class="metric-value">${selectedProject.name}</td></tr>
                                <tr><td class="metric-name">Industrie:</td><td class="metric-value">${selectedProject.industry}</td></tr>
                                <tr><td class="metric-name">Horizon temporel:</td><td class="metric-value">${selectedProject.timeHorizon} mois</td></tr>
                                <tr><td class="metric-name">Investissement initial:</td><td class="metric-value">$${Number(selectedProject.initialInvestment).toLocaleString()}</td></tr>
                                <tr><td class="metric-name">Coûts fixes mensuels:</td><td class="metric-value">$${Number(selectedProject.monthlyFixedCosts).toLocaleString()}</td></tr>
                                <tr><td class="metric-name">Coûts variables:</td><td class="metric-value">${selectedProject.variableCosts}% du revenu</td></tr>
                                <tr><td class="metric-name">Revenu mensuel prévu:</td><td class="metric-value">$${Number(selectedProject.expectedMonthlyRevenue).toLocaleString()}</td></tr>
                              </table>
                            </div>
                            
                            <div class="section">
                              <h2>Analyse de Scénarios</h2>
                              <p>L'analyse complète des scénarios optimiste, réaliste et pessimiste est disponible dans l'application.</p>
                            </div>
                            
                            <div class="section recommendations">
                              <h2>Message</h2>
                              <p>Pour visualiser l'analyse financière complète avec toutes les projections et recommandations, veuillez utiliser l'application.</p>
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                      
                      setTimeout(() => {
                        toast({
                          title: "Rapport exporté",
                          description: "Votre rapport financier a été préparé pour impression",
                        });
                      }, 1000);
                    }
                  }, 1000);
                } catch (error) {
                  console.error("Report generation error:", error);
                  toast({
                    title: "Erreur d'exportation",
                    description: "Impossible de générer le rapport. Veuillez réessayer.",
                    variant: "destructive"
                  });
                }
              }}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Exporter le Rapport
            </Button>
          </div>
        </div>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
        </div>
      )}

      {/* Project Selector */}
      {!isLoading && projects && projects.length > 0 && (
        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderIcon className="h-5 w-5 text-[#FF6B00]" />
              <span className="font-medium">Sélectionner un Projet:</span>
              <Select 
                value={selectedProjectId?.toString() || ''} 
                onValueChange={(value) => setSelectedProjectId(Number(value))}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProjectId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash className="h-4 w-4 mr-1" /> Supprimer le Projet
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la Suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer ce projet ? Cette action ne peut pas être annulée.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await apiRequest("DELETE", `/api/projects/${selectedProjectId}`);
                          toast({
                            title: "Projet Supprimé",
                            description: "Le projet a été supprimé avec succès."
                          });
                          queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
                          setSelectedProjectId(null);
                        } catch (error) {
                          toast({
                            title: "Erreur",
                            description: "Échec de la suppression du projet.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {!isLoading && analysis && (
        <>
          {/* Scenario Selector */}
          <ScenarioSelector 
            scenarios={analysis.scenarios.map((s: any) => s.scenario)} 
            selectedScenario={selectedScenario}
            onSelectScenario={setSelectedScenario} 
          />

          {/* KPI Summary */}
          <KpiSummary 
            financialMetrics={activeScenarioData?.financialMetrics} 
          />

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <RevenueExpensesChart 
              monthlyData={activeScenarioData?.monthlyProjections} 
            />
            <ProfitProjectionChart 
              scenariosData={analysis.scenarios} 
            />
          </div>

          {/* Additional Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <CostBreakdownChart 
              costBreakdown={analysis.costBreakdown} 
            />
            <ScenarioComparison 
              scenarios={analysis.scenarios} 
            />
            <RecommendationPanel 
              recommendations={analysis.recommendations} 
              metrics={activeScenarioData?.financialMetrics}
              projectId={selectedProjectId}
              scenarioType={selectedScenario as 'Optimistic' | 'Realistic' | 'Pessimistic'}
            />
          </div>

          {/* Data Entry Form (hidden by default) */}
          {showDataForm && (
            <DataEntryForm 
              project={analysis.project}
              scenarios={analysis.project.scenarios}
              onClose={toggleDataForm}
              onSave={() => {
                toggleDataForm();
                refetchAnalysis();
              }}
            />
          )}
          
          {/* Missing Data Questions (shown automatically) */}
          {showProjectAnalysis && analysis?.project && (
            <MissingDataQuestions
              projectData={analysis.project}
              onClose={() => setShowProjectAnalysis(false)}
              onUpdate={() => {
                setShowProjectAnalysis(false);
                refetchAnalysis();
              }}
            />
          )}

          {/* Form Toggle Button */}
          <div className="flex justify-between mt-4 mb-6">
            <Button 
              onClick={toggleDataForm}
              className="flex items-center bg-[#FF6B00] hover:bg-[#FF9D4D] text-white"
            >
              <span className="material-icons mr-1">edit</span>
              Modifier les Données du Projet
            </Button>
            
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-[#666666]">Dernière mise à jour:</span>
              <span className="font-medium">
                {formatLastUpdated(analysis.project.lastUpdated)}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}
