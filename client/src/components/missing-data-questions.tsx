
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface MissingDataQuestionsProps {
  projectData: any;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function MissingDataQuestions({
  projectData,
  onClose,
  onUpdate,
}: MissingDataQuestionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<"en" | "fr">("fr"); // Set French as default language
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize responses array when questions change
  useEffect(() => {
    setResponses(new Array(questions.length).fill(""));
  }, [questions]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Mutation to fetch follow-up questions
  const generateQuestionsMutation = useMutation({
    mutationFn: async (lang: "en" | "fr") => {
      const res = await apiRequest("POST", "/api/generate-questions", {
        projectData,
        language: lang,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data && data.questions) {
        setQuestions(data.questions);
      }
    },
  });

  // Mutation to update project data
  const updateProjectMutation = useMutation({
    mutationFn: async (updateData: any) => {
      if (!projectData.id) return null;
      
      const res = await apiRequest("POST", "/api/projects/update-with-answers", {
        projectId: projectData.id,
        questions,
        answers: responses,
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: language === "en" ? "Project Updated" : "Projet Mis à Jour",
        description: language === "en" 
          ? "Your project information has been updated successfully." 
          : "Les informations de votre projet ont été mises à jour avec succès."
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectData.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/analysis', projectData.id] });
      
      if (onUpdate) {
        onUpdate();
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: language === "en" ? "Update Failed" : "Échec de la Mise à Jour",
        description: language === "en" 
          ? "Failed to update project information. Please try again." 
          : "Échec de la mise à jour des informations du projet. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  });

  // Generate questions automatically when component mounts
  useEffect(() => {
    handleGenerateQuestions();
  }, [language]);

  // Generate questions when button is clicked
  const handleGenerateQuestions = () => {
    generateQuestionsMutation.mutate(language);
  };

  // Handle language change
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value as "en" | "fr";
    setLanguage(newLanguage);
  };

  // Handle response change
  const handleResponseChange = (index: number, value: string) => {
    const newResponses = [...responses];
    newResponses[index] = value;
    setResponses(newResponses);
  };

  // Handle form submission
  const handleSubmit = () => {
    // Check if at least one response is provided
    if (responses.every(r => !r.trim())) {
      toast({
        title: language === "en" ? "No Information Provided" : "Aucune Information Fournie",
        description: language === "en" 
          ? "Please provide at least one answer before submitting." 
          : "Veuillez fournir au moins une réponse avant de soumettre.",
        variant: "destructive"
      });
      return;
    }
    
    updateProjectMutation.mutate({});
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl mx-auto w-full overflow-auto max-h-[90vh]" ref={modalRef}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {language === "en"
                ? "Additional Information Needed"
                : "Informations Supplémentaires Nécessaires"}
            </CardTitle>
            <select
              className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg p-1.5"
              value={language}
              onChange={handleLanguageChange}
              disabled={generateQuestionsMutation.isPending || updateProjectMutation.isPending}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {!questions.length && !generateQuestionsMutation.isPending && (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="mb-4 text-gray-500">
                {language === "en"
                  ? "We can suggest some follow-up questions to help improve your analysis."
                  : "Nous pouvons suggérer des questions de suivi pour améliorer votre analyse."}
              </p>
              <Button
                onClick={handleGenerateQuestions}
                type="button"
                className="bg-[#FF6B00] hover:bg-[#FF9D4D]"
              >
                {language === "en"
                  ? "Generate Questions"
                  : "Générer des Questions"}
              </Button>
            </div>
          )}

          {(generateQuestionsMutation.isPending || updateProjectMutation.isPending) && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF6B00]"></div>
            </div>
          )}

          {questions.length > 0 && !generateQuestionsMutation.isPending && !updateProjectMutation.isPending && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-4">
                  {language === "en"
                    ? isEditing 
                      ? "Please provide answers to the following questions to improve your analysis:" 
                      : "Consider addressing these questions to improve the accuracy of your analysis:"
                    : isEditing 
                      ? "Veuillez répondre aux questions suivantes pour améliorer votre analyse:" 
                      : "Envisagez de répondre à ces questions pour améliorer la précision de votre analyse:"}
                </p>
                <ul className="space-y-6">
                  {questions.map((question, index) => (
                    <li key={index} className="flex flex-col">
                      <div className="flex items-start mb-2">
                        <Badge
                          variant="outline"
                          className="min-w-[24px] h-6 mr-2 bg-[#FF6B00] text-white flex-shrink-0 mt-0.5"
                        >
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{question}</span>
                      </div>
                      {isEditing && (
                        <div className="ml-9">
                          {question.includes("goal") || question.includes("objectif") || question.includes("describe") || question.includes("décrire") ? (
                            <Textarea
                              placeholder={language === "en" ? "Your answer..." : "Votre réponse..."}
                              value={responses[index]}
                              onChange={(e) => handleResponseChange(index, e.target.value)}
                              className="text-sm"
                              rows={3}
                            />
                          ) : (
                            <Input
                              placeholder={language === "en" ? "Your answer..." : "Votre réponse..."}
                              value={responses[index]}
                              onChange={(e) => handleResponseChange(index, e.target.value)}
                              className="text-sm"
                            />
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                {!isEditing ? (
                  <>
                    <Button variant="outline" onClick={onClose}>
                      {language === "en" ? "Close" : "Fermer"}
                    </Button>
                    <Button 
                      className="bg-[#FF6B00] hover:bg-[#FF9D4D]" 
                      onClick={() => setIsEditing(true)}
                    >
                      {language === "en" ? "Answer Questions" : "Répondre aux Questions"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={updateProjectMutation.isPending}
                    >
                      {language === "en" ? "Cancel" : "Annuler"}
                    </Button>
                    <Button 
                      className="bg-[#FF6B00] hover:bg-[#FF9D4D]" 
                      onClick={handleSubmit}
                      disabled={updateProjectMutation.isPending}
                    >
                      {language === "en" ? "Submit Answers" : "Soumettre les Réponses"}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
