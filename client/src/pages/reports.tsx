import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MissingDataQuestions from "@/components/missing-data-questions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileText, Printer } from "lucide-react";
import {
  formatCurrency,
  formatPercentage,
  formatMonths,
} from "@/lib/calculations";
import RevenueExpensesChart from "@/components/charts/revenue-expenses";
import ProfitProjectionChart from "@/components/charts/profit-projection";
import CostBreakdownChart from "@/components/charts/cost-breakdown";
import ScenarioComparison from "@/components/scenario-comparison";
import RecommendationPanel from "@/components/recommendation-panel";

export default function Reports() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [showProjectAnalysis, setShowProjectAnalysis] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr">("fr"); // Set French as default language

  // Fetch projects
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  // If a project is selected, fetch the analysis data
  const {
    data: analysis,
    isLoading: analysisLoading,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ["/api/analysis", selectedProjectId],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/analysis", {
        projectId: selectedProjectId,
      });
      return await res.json();
    },
  });

  // Generate follow-up questions mutation
  const generateProjectAnalysisMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProjectId) return null;
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
    },
  });

  // Trigger project analysis when a project is selected
  useEffect(() => {
    if (selectedProjectId && analysis) {
      // Increased frequency to show follow-up questions more often (~70% of the time)
      if (Math.random() < 0.7) {
        // Wait a bit to ensure analysis data is loaded
        setTimeout(() => {
          generateProjectAnalysisMutation.mutate();
        }, 1000);
      }
    }
  }, [selectedProjectId, analysis]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Project selection view
  if (!selectedProjectId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">
          Rapports Financiers
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-[#666666]">
              Sélectionnez un projet pour voir les rapports financiers détaillés
              :
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects?.map((project: any) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
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
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="font-medium">
                        {formatDate(project.lastUpdated)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 text-[#FF6B00] border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
                    >
                      View Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Report view for selected project
  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">
            {analysis?.project?.name || "Projet"} - Rapport Financier
          </h1>
          <p className="text-[#666666]">
            Généré le{" "}
            {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedProjectId(null)}
            className="w-full sm:w-auto"
          >
            Back to Projects
          </Button>
          <Button
            className="bg-[#1A1A1A] hover:bg-[#333333] w-full sm:w-auto"
            onClick={() => {
              toast({
                title: "Preparing print view...",
                description: "The print dialog will open shortly",
              });

              // Generate a printable report with all analysis data
              setTimeout(() => {
                // Create a document with all the relevant analysis data
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>${analysis?.project?.name} - Rapport Financier</title>
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
                        <h1>${analysis?.project?.name} - Rapport Financier</h1>
                        <p>Généré le ${new Date().toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}</p>
                        
                        <div class="section">
                          <h2>Project Overview</h2>
                          <table>
                            <tr><td class="metric-name">Project Name:</td><td class="metric-value">${analysis?.project?.name}</td></tr>
                            <tr><td class="metric-name">Industry:</td><td class="metric-value">${analysis?.project?.industry}</td></tr>
                            <tr><td class="metric-name">Time Horizon:</td><td class="metric-value">${analysis?.project?.timeHorizon} months</td></tr>
                            <tr><td class="metric-name">Initial Investment:</td><td class="metric-value">$${Number(analysis?.project?.initialInvestment).toLocaleString()}</td></tr>
                            <tr><td class="metric-name">Monthly Fixed Costs:</td><td class="metric-value">$${Number(analysis?.project?.monthlyFixedCosts).toLocaleString()}</td></tr>
                            <tr><td class="metric-name">Variable Costs:</td><td class="metric-value">${analysis?.project?.variableCosts}% of revenue</td></tr>
                            <tr><td class="metric-name">Expected Monthly Revenue:</td><td class="metric-value">$${Number(analysis?.project?.expectedMonthlyRevenue).toLocaleString()}</td></tr>
                          </table>
                        </div>
                        
                        <div class="section">
                          <h2>Scenario Analysis</h2>
                          ${analysis?.scenarios
                            .map(
                              (scenarioData: any) => `
                            <h3>${scenarioData.scenario.name} Scenario</h3>
                            <table>
                              <tr><td class="metric-name">ROI:</td><td class="metric-value">${formatPercentage(scenarioData.financialMetrics.roi)}</td></tr>
                              <tr><td class="metric-name">Break-even:</td><td class="metric-value">${formatMonths(scenarioData.financialMetrics.breakEven)}</td></tr>
                              <tr><td class="metric-name">Net Profit (12 mo):</td><td class="metric-value">${formatCurrency(scenarioData.financialMetrics.netProfit)}</td></tr>
                              <tr><td class="metric-name">Profit Margin:</td><td class="metric-value">${formatPercentage(scenarioData.financialMetrics.profitMargin)}</td></tr>
                              <tr><td class="metric-name">Risk Level:</td><td class="metric-value">${scenarioData.financialMetrics.riskLevel}</td></tr>
                            </table>
                          `,
                            )
                            .join("")}
                        </div>
                        
                        <div class="section">
                          <h2>Monthly Projections (Realistic Scenario)</h2>
                          <table>
                            <thead>
                              <tr>
                                <th>Month</th>
                                <th>Revenue</th>
                                <th>Expenses</th>
                                <th>Profit</th>
                                <th>Cumulative Profit</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${analysis?.scenarios
                                .find(
                                  (s: any) => s.scenario.name === "Realistic",
                                )
                                ?.monthlyProjections.map(
                                  (month: any, index: number) => {
                                    let cumulativeProfit = 0;
                                    for (let i = 0; i <= index; i++) {
                                      cumulativeProfit +=
                                        analysis?.scenarios.find(
                                          (s: any) =>
                                            s.scenario.name === "Realistic",
                                        )?.monthlyProjections[i].profit;
                                    }
                                    return `
                                  <tr>
                                    <td>${month.month}</td>
                                    <td>$${month.revenue.toLocaleString()}</td>
                                    <td>$${month.expenses.toLocaleString()}</td>
                                    <td>$${month.profit.toLocaleString()}</td>
                                    <td>$${cumulativeProfit.toLocaleString()}</td>
                                  </tr>
                                `;
                                  },
                                )
                                .join("")}
                            </tbody>
                          </table>
                        </div>
                        
                        <div class="section recommendations">
                          <h2>Recommendations</h2>
                          <ul>
                            ${analysis?.recommendations.map((rec: string) => `<li>${rec}</li>`).join("")}
                          </ul>
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }
              }, 1000);
            }}
          >
            <Printer className="h-4 w-4 mr-2" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {analysisLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B00]"></div>
        </div>
      ) : (
        <Tabs defaultValue="summary">
          <TabsList className="mb-6 flex flex-wrap">
            <TabsTrigger value="summary" className="flex-1">
              Summary
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1">
              Detailed
            </TabsTrigger>
            <TabsTrigger value="scenario" className="flex-1">
              Comparison
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex-1">
              Charts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      Project Details
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Project Name:</span>
                        <span className="font-medium">
                          {analysis?.project?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Industry:</span>
                        <span className="font-medium">
                          {analysis?.project?.industry}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Time Horizon:</span>
                        <span className="font-medium">
                          {analysis?.project?.timeHorizon} months
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Created On:</span>
                        <span className="font-medium">
                          {formatDate(analysis?.project?.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      Financial Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#666666]">
                          Initial Investment:
                        </span>
                        <span className="font-medium">
                          $
                          {Number(
                            analysis?.project?.initialInvestment,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">
                          Monthly Fixed Costs:
                        </span>
                        <span className="font-medium">
                          $
                          {Number(
                            analysis?.project?.monthlyFixedCosts,
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Variable Costs:</span>
                        <span className="font-medium">
                          {analysis?.project?.variableCosts}% of revenue
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">
                          Expected Monthly Revenue:
                        </span>
                        <span className="font-medium">
                          $
                          {Number(
                            analysis?.project?.expectedMonthlyRevenue,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {analysis?.scenarios.map((scenarioData: any) => (
                <Card key={scenarioData.scenario.name}>
                  <CardHeader
                    className={`pb-2 ${
                      scenarioData.scenario.name === "Optimistic"
                        ? "bg-green-50"
                        : scenarioData.scenario.name === "Pessimistic"
                          ? "bg-red-50"
                          : "bg-yellow-50"
                    }`}
                  >
                    <CardTitle className="flex items-center">
                      {scenarioData.scenario.name === "Optimistic" && (
                        <span className="material-icons text-green-500 mr-2">
                          trending_up
                        </span>
                      )}
                      {scenarioData.scenario.name === "Realistic" && (
                        <span className="material-icons text-yellow-500 mr-2">
                          trending_flat
                        </span>
                      )}
                      {scenarioData.scenario.name === "Pessimistic" && (
                        <span className="material-icons text-red-500 mr-2">
                          trending_down
                        </span>
                      )}
                      {scenarioData.scenario.name} Scenario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#666666]">ROI:</span>
                        <span className="font-medium">
                          {formatPercentage(scenarioData.financialMetrics.roi)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Break-even:</span>
                        <span className="font-medium">
                          {formatMonths(
                            scenarioData.financialMetrics.breakEven,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">
                          Net Profit (12 mo):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            scenarioData.financialMetrics.netProfit,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Profit Margin:</span>
                        <span className="font-medium">
                          {formatPercentage(
                            scenarioData.financialMetrics.profitMargin,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Risk Level:</span>
                        <span
                          className={`font-medium ${
                            scenarioData.financialMetrics.riskLevel === "Low"
                              ? "text-green-500"
                              : scenarioData.financialMetrics.riskLevel ===
                                  "High"
                                ? "text-red-500"
                                : "text-yellow-500"
                          }`}
                        >
                          {scenarioData.financialMetrics.riskLevel}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <RecommendationPanel
              recommendations={analysis?.recommendations}
              metrics={
                analysis?.scenarios.find(
                  (s: any) => s.scenario.name === "Realistic",
                )?.financialMetrics
              }
              projectId={selectedProjectId}
            />

            <div className="flex justify-center">
              {/* <Button 
                className="bg-[#FF6B00] hover:bg-[#FF9D4D]"
                onClick={() => {
                  const detailedTab = document.querySelector('button[value="detailed"]') as HTMLButtonElement;
                  if (detailedTab) detailedTab.click();
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Detailed Analysis
              </Button> */}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <RevenueExpensesChart
                monthlyData={
                  analysis?.scenarios.find(
                    (s: any) => s.scenario.name === "Realistic",
                  )?.monthlyProjections
                }
              />
              <CostBreakdownChart costBreakdown={analysis?.costBreakdown} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Projections (Realistic Scenario)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-500">
                          Month
                        </th>
                        <th className="text-right py-2 font-medium text-gray-500">
                          Revenue
                        </th>
                        <th className="text-right py-2 font-medium text-gray-500">
                          Expenses
                        </th>
                        <th className="text-right py-2 font-medium text-gray-500">
                          Profit
                        </th>
                        <th className="text-right py-2 font-medium text-gray-500">
                          Cumulative Profit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis?.scenarios
                        .find((s: any) => s.scenario.name === "Realistic")
                        ?.monthlyProjections.map(
                          (month: any, index: number) => {
                            const cumulativeProfit = analysis.scenarios
                              .find((s: any) => s.scenario.name === "Realistic")
                              ?.monthlyProjections.slice(0, index + 1)
                              .reduce(
                                (sum: number, m: any) => sum + m.profit,
                                0,
                              );

                            return (
                              <tr
                                key={month.month}
                                className="border-b border-gray-100"
                              >
                                <td className="py-2">Month {month.month}</td>
                                <td className="text-right">
                                  ${month.revenue.toLocaleString()}
                                </td>
                                <td className="text-right">
                                  ${month.expenses.toLocaleString()}
                                </td>
                                <td
                                  className={`text-right ${month.profit >= 0 ? "text-green-500" : "text-red-500"}`}
                                >
                                  ${month.profit.toLocaleString()}
                                </td>
                                <td
                                  className={`text-right ${cumulativeProfit >= 0 ? "text-green-500" : "text-red-500"}`}
                                >
                                  ${cumulativeProfit.toLocaleString()}
                                </td>
                              </tr>
                            );
                          },
                        )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ScenarioComparison scenarios={analysis?.scenarios} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scenario Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-500">
                          Parameter
                        </th>
                        {analysis?.scenarios.map((scenarioData: any) => (
                          <th
                            key={scenarioData.scenario.name}
                            className="text-right py-2 font-medium text-gray-500"
                          >
                            {scenarioData.scenario.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2">Growth Rate</td>
                        {analysis?.scenarios.map((scenarioData: any) => (
                          <td
                            key={scenarioData.scenario.name}
                            className="text-right"
                          >
                            {formatPercentage(scenarioData.scenario.growthRate)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2">Cost Adjustment</td>
                        {analysis?.scenarios.map((scenarioData: any) => (
                          <td
                            key={scenarioData.scenario.name}
                            className="text-right"
                          >
                            {formatPercentage(
                              scenarioData.scenario.costAdjustment,
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Break-Even Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {/* Break-even timeline visualization */}
                    <div className="flex items-center h-full">
                      <div className="w-full bg-gray-200 h-6 rounded-full relative">
                        {analysis?.scenarios.map((scenarioData: any) => {
                          const breakEvenPercentage =
                            (scenarioData.financialMetrics.breakEven / 12) *
                            100;
                          const cappedPercentage = Math.min(
                            breakEvenPercentage,
                            100,
                          );

                          let color;
                          if (scenarioData.scenario.name === "Optimistic") {
                            color = "bg-green-500";
                          } else if (
                            scenarioData.scenario.name === "Realistic"
                          ) {
                            color = "bg-yellow-500";
                          } else {
                            color = "bg-red-500";
                          }

                          return (
                            <div
                              key={scenarioData.scenario.name}
                              className="absolute top-0 flex flex-col items-center"
                              style={{ left: `${cappedPercentage}%` }}
                            >
                              <div
                                className={`w-3 h-8 ${color} rounded-full`}
                              ></div>
                              <div className="text-xs font-medium mt-2">
                                {scenarioData.scenario.name}
                              </div>
                              <div className="text-xs">
                                {formatMonths(
                                  scenarioData.financialMetrics.breakEven,
                                )}
                              </div>
                            </div>
                          );
                        })}

                        <div className="absolute -bottom-6 left-0 text-xs">
                          0 months
                        </div>
                        <div className="absolute -bottom-6 right-0 text-xs">
                          12 months
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ProfitProjectionChart scenariosData={analysis?.scenarios} />
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-12">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
                Visualisation des Données Financières
              </h2>
              <p className="text-[#666666] mb-6">
                Ces graphiques présentent une analyse visuelle des projections
                financières sous différents angles.
              </p>
            </div>

            {/* First row - larger, full width chart */}
            <div className="mb-10">
              <Card className="shadow-md overflow-hidden border-none">
                <CardHeader className="pb-2 bg-gray-50">
                  <CardTitle>Revenue vs Expenses (Scenario Réaliste)</CardTitle>
                  <p className="text-sm text-[#666666]">
                    Cette visualisation montre l'évolution des revenus et
                    dépenses mois par mois.
                  </p>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                  <div className="h-[500px]">
                    <RevenueExpensesChart
                      monthlyData={
                        analysis?.scenarios.find(
                          (s: any) => s.scenario.name === "Realistic",
                        )?.monthlyProjections
                      }
                      height={450}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second row - Two charts side by side on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              <Card className="shadow-md overflow-hidden border-none">
                <CardHeader className="pb-2 bg-gray-50">
                  <CardTitle>Projection des Profits par Scénario</CardTitle>
                  <p className="text-sm text-[#666666]">
                    Comparaison des profits entre les scénarios optimiste,
                    réaliste et pessimiste.
                  </p>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                  <div className="h-[400px]">
                    <ProfitProjectionChart
                      scenariosData={analysis?.scenarios}
                      height={350}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md overflow-hidden border-none">
                <CardHeader className="pb-2 bg-gray-50">
                  <CardTitle>Répartition des Coûts</CardTitle>
                  <p className="text-sm text-[#666666]">
                    Visualisation de la répartition entre investissement
                    initial, coûts fixes et coûts variables.
                  </p>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                  <div className="h-[400px]">
                    <CostBreakdownChart
                      costBreakdown={analysis?.costBreakdown}
                      height={350}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Legend and notes */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Notes sur les Graphiques</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#666666]">
                <li>
                  Toutes les projections financières sont basées sur les données
                  fournies et les paramètres des scénarios.
                </li>
                <li>
                  Les graphiques sont interactifs - survolez pour voir plus de
                  détails.
                </li>
                <li>
                  Pour une analyse plus détaillée, consultez les sections
                  "Résumé" et "Détaillé".
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Missing Data Questions */}
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
    </div>
  );
}
