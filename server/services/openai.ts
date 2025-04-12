import OpenAI from "openai";
import {
  ProjectWithScenarios,
  ScenarioCalculations,
  FinancialCalculation,
  MonthlyProjection,
} from "@shared/schema";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o-mini";

/**
 * Generate AI recommendations based on project analysis
 */
export async function generateRecommendations(
  project: ProjectWithScenarios,
  scenarioCalculations: ScenarioCalculations[],
  language: "en" | "fr" = "en",
): Promise<string[]> {
  try {
    const realisticScenario = scenarioCalculations.find(
      (s) => s.scenario.name === "Realistic",
    );
    const optimisticScenario = scenarioCalculations.find(
      (s) => s.scenario.name === "Optimistic",
    );
    const pessimisticScenario = scenarioCalculations.find(
      (s) => s.scenario.name === "Pessimistic",
    );

    const projectData = {
      name: project.name,
      goal: project.goal,
      industry: project.industry,
      timeHorizon: project.timeHorizon,
      initialInvestment: Number(project.initialInvestment),
      monthlyFixedCosts: Number(project.monthlyFixedCosts),
      variableCosts: Number(project.variableCosts),
      expectedMonthlyRevenue: Number(project.expectedMonthlyRevenue),
      realistic: realisticScenario?.financialMetrics,
      optimistic: optimisticScenario?.financialMetrics,
      pessimistic: pessimisticScenario?.financialMetrics,
    };

    // Set up the prompt based on the selected language
    const prompt =
      language === "en"
        ? `You are a financial advisor specializing in profitability analysis for small businesses. Based on the following project data, generate 5 actionable recommendations to improve profitability and reduce risks. Format your response as a JSON array of strings, with each string being a specific recommendation.`
        : `Vous êtes un conseiller financier spécialisé dans l'analyse de rentabilité des petites entreprises. À partir des données de projet suivantes, générez cinq recommandations concrètes pour améliorer la rentabilité et réduire les risques. Formatez votre réponse sous forme de tableau JSON de chaînes, chaque chaîne représentant une recommandation spécifique et la réponse sera en français.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify(projectData, null, 2),
        },
      ],
      response_format: { type: "json_object" },
    });

    // Extract recommendations from response
    const content =
      response.choices[0].message.content || '{"recommendations":[]}';
    const parsedResponse = JSON.parse(content);

    // Return either the recommendations array or an empty array if not found
    return Array.isArray(parsedResponse.recommendations)
      ? parsedResponse.recommendations
      : [];
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    // Return default recommendations in case of error
    if (language === "en") {
      return [
        "Consider phasing the initial investment to reduce upfront risk.",
        "Negotiate fixed-price contracts for key services to minimize variable cost risk.",
        "Implement a tiered pricing strategy to improve profit margins.",
        "Focus on improving customer retention to reduce marketing costs.",
        "Explore partnerships to share fixed costs and expand revenue streams.",
      ];
    } else {
      return [
        "Envisagez d'échelonner l'investissement initial pour réduire le risque initial.",
        "Négociez des contrats à prix fixe pour les services clés afin de minimiser le risque de coûts variables.",
        "Mettez en œuvre une stratégie de prix à plusieurs niveaux pour améliorer les marges bénéficiaires.",
        "Concentrez-vous sur l'amélioration de la fidélisation des clients pour réduire les coûts de marketing.",
        "Explorez des partenariats pour partager les coûts fixes et développer les sources de revenus.",
      ];
    }
  }
}

/**
 * Generate an explanation of financial metrics
 */
export async function explainFinancialMetrics(
  metrics: FinancialCalculation,
  language: "en" | "fr" = "en",
): Promise<string> {
  try {
    const langInstruction =
      language === "en"
        ? "Explain the following metrics in simple terms, what they mean for the business, and how they compare to typical standards. Respond in English."
        : "Expliquez les indicateurs suivants en termes simples, ce qu'ils signifient pour l'entreprise et comment ils se comparent aux normes habituelles. Répondez en français.";

    const userPrompt = `${langInstruction}\nFormat your response as a JSON object with a single key "explanation".\n\n${JSON.stringify(metrics, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
    });

    // Extract explanation from response
    const content = response.choices[0].message.content || '{"explanation":""}';
    const parsedResponse = JSON.parse(content);

    return parsedResponse.explanation || "";
  } catch (error) {
    console.error("Error generating financial metrics explanation:", error);

    // Return default explanation in case of error
    if (language === "en") {
      return `ROI (${metrics.roi}%): Return on Investment - For every dollar invested, you'll earn back your investment plus ${metrics.roi}% more. A higher percentage is better, with anything above 15% generally considered good.\n\nBreak-even point (${metrics.breakEven} months): The time it will take to recover your initial investment. Shorter periods are better, typically under 12 months is considered favorable.\n\nProfit margin (${metrics.profitMargin}%): The percentage of revenue that becomes profit. Industry averages vary, but generally 10-20% is healthy for most businesses.\n\nRisk level (${metrics.riskLevel}): Based on your projections and industry benchmarks, this project has a ${metrics.riskLevel.toLowerCase()} risk profile.`;
    } else {
      return `ROI (${metrics.roi}%): Retour sur investissement - Pour chaque euro investi, vous récupérerez votre investissement plus ${metrics.roi}% de plus. Un pourcentage plus élevé est préférable, tout ce qui dépasse 15 % étant généralement considéré comme bon.\n\nPoint d'équilibre (${metrics.breakEven} mois): Le temps qu'il faudra pour récupérer votre investissement initial. Des périodes plus courtes sont préférables, généralement moins de 12 mois est considéré comme favorable.\n\nMarge bénéficiaire (${metrics.profitMargin}%): Le pourcentage du revenu qui devient un bénéfice. Les moyennes de l'industrie varient, mais généralement 10-20% est sain pour la plupart des entreprises.\n\nNiveau de risque (${metrics.riskLevel === "Low" ? "Faible" : metrics.riskLevel === "Medium" ? "Moyen" : "Élevé"}): Selon vos projections et les références de l'industrie, ce projet a un profil de risque ${metrics.riskLevel === "Low" ? "faible" : metrics.riskLevel === "Medium" ? "moyen" : "élevé"}.`;
    }
  }
}

/**
 * Generate a comprehensive analysis report
 */
export async function generateAnalysisReport(
  project: ProjectWithScenarios,
  scenarioCalculations: ScenarioCalculations[],
  language: "en" | "fr" = "en",
  scenarioType?: "Optimistic" | "Realistic" | "Pessimistic",
): Promise<string> {
  try {
    const realisticScenario = scenarioCalculations.find(
      (s) => s.scenario.name === "Realistic",
    );

    type AnalysisContext = {
      project: {
        name: string;
        goal: string;
        industry: string;
        timeHorizon: number;
        initialInvestment: number;
        monthlyFixedCosts: number;
        variableCosts: number;
        expectedMonthlyRevenue: number;
      };
      scenarios: {
        name: string;
        metrics: FinancialCalculation;
      }[];
      focusScenario?: {
        name: string;
        metrics: FinancialCalculation;
        monthlyProjections: MonthlyProjection[];
      };
    };

    const analysisContext: AnalysisContext = {
      project: {
        name: project.name,
        goal: project.goal,
        industry: project.industry,
        timeHorizon: project.timeHorizon,
        initialInvestment: Number(project.initialInvestment),
        monthlyFixedCosts: Number(project.monthlyFixedCosts),
        variableCosts: Number(project.variableCosts),
        expectedMonthlyRevenue: Number(project.expectedMonthlyRevenue),
      },
      scenarios: scenarioCalculations.map((sc) => ({
        name: sc.scenario.name,
        metrics: sc.financialMetrics,
      })),
    };

    const targetScenario = scenarioType
      ? scenarioCalculations.find((sc) => sc.scenario.name === scenarioType)
      : realisticScenario;

    if (scenarioType && targetScenario) {
      analysisContext.focusScenario = {
        name: targetScenario.scenario.name,
        metrics: targetScenario.financialMetrics,
        monthlyProjections: targetScenario.monthlyProjections,
      };
    }

    const langInstruction = scenarioType
      ? language === "en"
        ? `You are a financial analyst preparing a scenario-specific action plan for a business project under the ${scenarioType.toLowerCase()} scenario. Generate a well-structured report with the following sections:
1. Executive Summary for the ${scenarioType} Scenario
2. Key Financial Projections 
3. Action Plan with 5-7 prioritized steps
4. Risk Management Strategy
5. Budget Allocation Recommendations
6. Key Performance Indicators to Monitor`
        : `Vous êtes un analyste financier préparant un plan d'action spécifique à un scénario pour un projet d'entreprise dans le cadre du scénario ${scenarioType === "Optimistic" ? "optimiste" : scenarioType === "Realistic" ? "réaliste" : "pessimiste"}. Générez un rapport bien structuré avec les sections suivantes :
1. Résumé Exécutif pour le Scénario ${scenarioType === "Optimistic" ? "Optimiste" : scenarioType === "Realistic" ? "Réaliste" : "Pessimiste"}
2. Projections Financières Clés
3. Plan d'Action avec 5-7 étapes prioritaires
4. Stratégie de Gestion des Risques
5. Recommandations d'Allocation Budgétaire
6. Indicateurs de Performance Clés à Surveiller`
      : language === "en"
        ? `You are a financial analyst preparing a comprehensive profitability report for a business project. Generate a well-structured report with the following sections:
1. Executive Summary
2. Project Overview
3. Financial Analysis
4. Risk Assessment
5. Recommendations`
        : `Vous êtes un analyste financier préparant un rapport de rentabilité complet pour un projet d'entreprise. Générez un rapport bien structuré avec les sections suivantes:
1. Résumé Exécutif
2. Aperçu du Projet
3. Analyse Financière
4. Évaluation des Risques
5. Recommandations`;

    const userPrompt = `${langInstruction}

Format your response as a JSON object with a single key "report" containing the formatted report with Markdown formatting.

${JSON.stringify(analysisContext, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });
    // Extract report from response
    const content =
      response.choices[0].message.content ||
      '{"report":"Report generation failed"}';
    const parsedResponse = JSON.parse(content);

    return parsedResponse.report || "Report generation failed";
  } catch (error) {
    console.error("Error generating analysis report:", error);

    // Return a basic report in case of error
    if (language === "en") {
      return `# Profitability Analysis Report: ${project.name}

## Executive Summary
The project shows a projected ROI of ${scenarioCalculations.find((s) => s.scenario.name === "Realistic")?.financialMetrics.roi}% with a break-even point of ${scenarioCalculations.find((s) => s.scenario.name === "Realistic")?.financialMetrics.breakEven} months under the realistic scenario.

## Project Overview
- Industry: ${project.industry}
- Time Horizon: ${project.timeHorizon} months
- Initial Investment: $${Number(project.initialInvestment).toLocaleString()}

## Financial Analysis
- Monthly Revenue: $${Number(project.expectedMonthlyRevenue).toLocaleString()}
- Monthly Fixed Costs: $${Number(project.monthlyFixedCosts).toLocaleString()}
- Variable Costs: ${project.variableCosts}% of revenue

## Risk Assessment
This project has a ${scenarioCalculations.find((s) => s.scenario.name === "Realistic")?.financialMetrics.riskLevel.toLowerCase()} risk profile, with considerations needed for market fluctuations and competition.

## Recommendations
1. Consider phasing the initial investment to reduce upfront risk
2. Monitor closely the variable costs to maintain profitability
3. Develop contingency plans for scenarios where revenue falls below projections`;
    } else {
      return `# Rapport d'Analyse de Rentabilité: ${project.name}

## Résumé Exécutif
Le projet montre un ROI projeté de ${scenarioCalculations.find((s) => s.scenario.name === "Realistic")?.financialMetrics.roi}% avec un point d'équilibre de ${scenarioCalculations.find((s) => s.scenario.name === "Realistic")?.financialMetrics.breakEven} mois selon le scénario réaliste.

## Aperçu du Projet
- Industrie: ${project.industry}
- Horizon temporel: ${project.timeHorizon} mois
- Investissement initial: ${Number(project.initialInvestment).toLocaleString()}€

## Analyse Financière
- Revenu mensuel: ${Number(project.expectedMonthlyRevenue).toLocaleString()}€
- Coûts fixes mensuels: ${Number(project.monthlyFixedCosts).toLocaleString()}€
- Coûts variables: ${project.variableCosts}% du revenu

## Évaluation des Risques
Ce projet présente un profil de risque ${scenarioCalculations.find((s) => s.scenario.name === "Realistic")?.financialMetrics.riskLevel === "Low" ? "faible" : scenarioCalculations.find((s) => s.scenario.name === "Realistic")?.financialMetrics.riskLevel === "Medium" ? "moyen" : "élevé"}, avec des considérations nécessaires pour les fluctuations du marché et la concurrence.

## Recommandations
1. Envisagez d'échelonner l'investissement initial pour réduire le risque initial
2. Surveillez de près les coûts variables pour maintenir la rentabilité
3. Élaborez des plans d'urgence pour les scénarios où les revenus sont inférieurs aux projections`;
    }
  }
}

/**
 * Generate questions for missing data
 */
export async function generateQuestionsForMissingData(
  partialProject: Partial<ProjectWithScenarios>,
  language: "en" | "fr" = "en",
): Promise<string[]> {
  try {
    // Determine which fields are missing
    const missingFields = {
      name: !partialProject.name,
      goal: !partialProject.goal,
      industry: !partialProject.industry,
      timeHorizon: !partialProject.timeHorizon,
      initialInvestment: !partialProject.initialInvestment,
      monthlyFixedCosts: !partialProject.monthlyFixedCosts,
      variableCosts: !partialProject.variableCosts,
      expectedMonthlyRevenue: !partialProject.expectedMonthlyRevenue,
    };

    // Set up the instruction in the appropriate language
    const langInstruction =
      language === "en"
        ? "You are a financial consultant helping a client complete their project data for profitability analysis. Based on the missing fields, generate questions to ask the client to gather the missing information. Respond in English."
        : "Vous êtes un consultant financier aidant un client à compléter les données de son projet pour une analyse de rentabilité. En fonction des champs manquants, générez des questions à poser au client pour rassembler les informations manquantes. Répondez en français.";

    const userPrompt = `${langInstruction}\nFormat your response as a JSON array of strings, with each string being a specific question.\n\n${JSON.stringify(
      {
        partialData: partialProject,
        missingFields,
      },
      null,
      2,
    )}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Extract questions from response
    const content = response.choices[0].message.content || '{"questions":[]}';
    const parsedResponse = JSON.parse(content);

    return Array.isArray(parsedResponse.questions)
      ? parsedResponse.questions
      : [];
  } catch (error) {
    console.error("Error generating questions for missing data:", error);

    // Return default questions based on missing fields
    const questions: string[] = [];

    if (language === "en") {
      if (!partialProject.name)
        questions.push("What is the name of your project or business?");
      if (!partialProject.goal)
        questions.push("What are the main objectives of this project?");
      if (!partialProject.industry)
        questions.push(
          "In which industry or sector does this project operate?",
        );
      if (!partialProject.timeHorizon)
        questions.push(
          "What is your expected timeframe for this project in months?",
        );
      if (!partialProject.initialInvestment)
        questions.push(
          "What is the total initial investment required for this project?",
        );
      if (!partialProject.monthlyFixedCosts)
        questions.push("What are your estimated monthly fixed costs?");
      if (!partialProject.variableCosts)
        questions.push(
          "What percentage of your revenue goes to variable costs?",
        );
      if (!partialProject.expectedMonthlyRevenue)
        questions.push("What is your expected monthly revenue?");
    } else {
      if (!partialProject.name)
        questions.push("Quel est le nom de votre projet ou entreprise?");
      if (!partialProject.goal)
        questions.push("Quels sont les principaux objectifs de ce projet?");
      if (!partialProject.industry)
        questions.push(
          "Dans quelle industrie ou secteur ce projet opère-t-il?",
        );
      if (!partialProject.timeHorizon)
        questions.push("Quel est le délai prévu pour ce projet en mois?");
      if (!partialProject.initialInvestment)
        questions.push(
          "Quel est l'investissement initial total requis pour ce projet?",
        );
      if (!partialProject.monthlyFixedCosts)
        questions.push("Quels sont vos coûts fixes mensuels estimés?");
      if (!partialProject.variableCosts)
        questions.push(
          "Quel pourcentage de vos revenus est consacré aux coûts variables?",
        );
      if (!partialProject.expectedMonthlyRevenue)
        questions.push("Quel est votre revenu mensuel prévu?");
    }

    return questions;
  }
}
