import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercentage, formatMonths } from "@/lib/calculations";
import { type ScenarioCalculations } from "@shared/schema";

interface ScenarioComparisonProps {
  scenarios: ScenarioCalculations[];
}

export default function ScenarioComparison({ scenarios }: ScenarioComparisonProps) {
  if (!scenarios || scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Scenario Comparison</h2>
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">No scenario data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get the realistic scenario as baseline
  const realisticScenario = scenarios.find(s => s.scenario.name === 'Realistic');
  
  // Display metrics for comparison
  const comparisonMetrics = [
    {
      name: 'ROI',
      accessor: 'roi',
      format: formatPercentage
    },
    {
      name: 'Break-even (months)',
      accessor: 'breakEven',
      format: (value: number | null | undefined) => value !== null && value !== undefined ? value.toFixed(1) : 'N/A'
    },
    {
      name: 'Profit (12 mo)',
      accessor: 'netProfit',
      format: formatCurrency
    },
    {
      name: 'Profit Margin',
      accessor: 'profitMargin',
      format: formatPercentage
    },
    {
      name: 'Risk Level',
      accessor: 'riskLevel',
      format: (value: string) => value
    }
  ];
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Scenario Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-500">Metric</th>
                {scenarios.map(scenario => (
                  <th key={scenario.scenario.name} className="text-right py-2 font-medium text-gray-500">
                    {scenario.scenario.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonMetrics.map((metric, index) => (
                <tr key={metric.name} className={index < comparisonMetrics.length - 1 ? 'border-b border-gray-100' : ''}>
                  <td className="py-3">{metric.name}</td>
                  {scenarios.map(scenario => {
                    const isPositive = scenario.scenario.name === 'Optimistic';
                    const isNegative = scenario.scenario.name === 'Pessimistic';
                    const isBaseline = scenario.scenario.name === 'Realistic';
                    
                    // Get the appropriate CSS class based on scenario type
                    let valueClass = 'text-right font-medium';
                    if (isPositive && !isBaseline) valueClass += ' text-green-500';
                    if (isNegative && !isBaseline) valueClass += ' text-red-500';
                    
                    const value = scenario.financialMetrics[metric.accessor as keyof typeof scenario.financialMetrics];
                    
                    return (
                      <td key={scenario.scenario.name} className={valueClass}>
                        {metric.format(value as any)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
