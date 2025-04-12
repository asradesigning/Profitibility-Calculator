import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { type FinancialCalculation } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RecommendationPanelProps {
  recommendations?: string[];
  metrics?: FinancialCalculation;
  projectId?: number | null;
  scenarioType?: 'Optimistic' | 'Realistic' | 'Pessimistic';
}

export default function RecommendationPanel({ 
  recommendations, 
  metrics, 
  projectId,
  scenarioType = 'Realistic'
}: RecommendationPanelProps) {
  const [language, setLanguage] = useState<'en' | 'fr'>('fr'); // Set French as default language
  const [isLoading, setIsLoading] = useState(false);
  const [localRecommendations, setLocalRecommendations] = useState<string[] | undefined>(recommendations);
  
  // Reset recommendations when props change
  useEffect(() => {
    setLocalRecommendations(recommendations);
  }, [recommendations]);
  
  // Update recommendations when scenario changes
  useEffect(() => {
    if (projectId && scenarioType) {
      updateRecommendationsMutation.mutate({
        lang: language,
        scenario: scenarioType
      });
    }
  }, [scenarioType, projectId]);
  
  // Mutation to fetch recommendations in the selected language and scenario
  const updateRecommendationsMutation = useMutation({
    mutationFn: async ({
      lang,
      scenario
    }: {
      lang: 'en' | 'fr',
      scenario: 'Optimistic' | 'Realistic' | 'Pessimistic'
    }) => {
      if (!projectId) return null;
      setIsLoading(true);
      const res = await apiRequest('POST', '/api/analysis', { 
        projectId: projectId,
        language: lang,
        scenarioType: scenario
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data && data.recommendations) {
        setLocalRecommendations(data.recommendations);
      }
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    }
  });
  
  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as 'en' | 'fr';
    setLanguage(newLanguage);
    
    // Only call API if we have a projectId
    if (projectId) {
      updateRecommendationsMutation.mutate({
        lang: newLanguage,
        scenario: scenarioType
      });
    }
  };
  if (!recommendations || !metrics) {
    return (
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Analyse & Recommandations</h2>
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">Aucune recommandation disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Determine project viability message based on metrics
  const isViable = metrics.roi > 100 && metrics.breakEven < 9;
  const viabilityMessageFr = isViable 
    ? "Ce projet montre des indicateurs financiers positifs avec un ROI fort de " + metrics.roi.toFixed(0) + "% et une période d'amortissement raisonnable de " + metrics.breakEven.toFixed(1) + " mois."
    : "Ce projet montre des indicateurs financiers modérés. Envisagez de revoir la structure des coûts pour améliorer le ROI et le délai d'amortissement.";
    
  const viabilityMessageEn = isViable 
    ? "This project shows positive financial indicators with a strong ROI of " + metrics.roi.toFixed(0) + "% and a reasonable break-even period of " + metrics.breakEven.toFixed(1) + " months."
    : "This project shows moderate financial indicators. Consider reviewing the cost structure to improve ROI and break-even timeline.";
    
  const viabilityMessage = language === 'fr' ? viabilityMessageFr : viabilityMessageEn;
  
  // Determine risk message based on metrics
  const riskLevel = metrics.riskLevel;
  
  const riskMessageFr = riskLevel === 'Low' 
    ? "Le projet présente un profil de risque faible avec un excellent potentiel de rendement."
    : riskLevel === 'Medium'
      ? "Les coûts variables pourraient augmenter jusqu'à 15% dans le scénario pessimiste, prolongeant significativement la période d'amortissement."
      : "Ce projet présente des facteurs de risque élevés. Envisagez une mise en œuvre par phases pour atténuer l'exposition financière.";
      
  const riskMessageEn = riskLevel === 'Low' 
    ? "The project has a low risk profile with excellent return potential."
    : riskLevel === 'Medium'
      ? "Variable costs could increase by up to 15% in the pessimistic scenario, significantly extending the break-even period."
      : "This project has high risk factors. Consider phased implementation to mitigate financial exposure.";
      
  const riskMessage = language === 'fr' ? riskMessageFr : riskMessageEn;
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">
          {language === 'fr' ? 'Analyse & Recommandations' : 'Analysis & Recommendations'}
        </h2>
        
        <div className="p-3 bg-green-50 rounded-lg mb-4 border border-green-100">
          <h3 className="font-medium text-green-500 flex items-center text-sm">
            <span className="material-icons text-sm mr-1">check_circle</span>
            {language === 'fr' ? 'Viabilité du Projet' : 'Project Viability'}
          </h3>
          <p className="mt-1 text-sm">{viabilityMessage}</p>
        </div>
        
        <div className={`p-3 ${riskLevel === 'Low' ? 'bg-green-50 border-green-100' : riskLevel === 'Medium' ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'} rounded-lg mb-4 border`}>
          <h3 className={`font-medium flex items-center text-sm ${riskLevel === 'Low' ? 'text-green-500' : riskLevel === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>
            <span className="material-icons text-sm mr-1">priority_high</span>
            {language === 'fr' ? 'Risques Clés' : 'Key Risks'}
          </h3>
          <p className="mt-1 text-sm">{riskMessage}</p>
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-[#1A1A1A]">
              {language === 'fr' ? 'Recommandations:' : 'Recommendations:'}
            </h3>
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg p-1.5"
              value={language}
              onChange={handleLanguageChange}
              disabled={isLoading || !projectId}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#FF6B00]"></div>
            </div>
          ) : (
            (localRecommendations || []).map((recommendation, index) => (
              <div key={index} className="flex items-start">
                <span className="material-icons text-[#FF6B00] mr-2 mt-0.5">arrow_right</span>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
