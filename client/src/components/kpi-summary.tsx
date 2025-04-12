import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatCurrency, formatPercentage, formatMonths } from "@/lib/calculations";
import { type FinancialCalculation } from "@shared/schema";

interface KpiSummaryProps {
  financialMetrics?: FinancialCalculation;
}

export default function KpiSummary({ financialMetrics }: KpiSummaryProps) {
  if (!financialMetrics) {
    return <div className="mb-6 text-center">Loading metrics...</div>;
  }

  const { roi, breakEven, netProfit, profitMargin } = financialMetrics;

  // KPI cards data
  const kpiCards = [
    {
      title: "ROI",
      value: formatPercentage(roi),
      icon: "currency_exchange",
      comparison: {
        value: "12%",
        label: "vs Target",
        trend: "up"
      }
    },
    {
      title: "Break-Even",
      value: formatMonths(breakEven),
      icon: "balance",
      comparison: {
        value: "1.8 mo",
        label: "earlier than expected",
        trend: "down"
      }
    },
    {
      title: "Net Profit (12 mo)",
      value: formatCurrency(netProfit),
      icon: "savings",
      comparison: {
        value: "8.3%",
        label: "vs Projected",
        trend: "up"
      }
    },
    {
      title: "Profit Margin",
      value: formatPercentage(profitMargin),
      icon: "trending_up",
      comparison: {
        value: "0.5%",
        label: "vs Industry Avg",
        trend: "neutral"
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#666666] text-sm">{card.title}</p>
                <h3 className="text-3xl font-bold text-[#1A1A1A] font-mono">{card.value}</h3>
              </div>
              <div className="bg-[#FF6B00] bg-opacity-10 text-[#FF6B00] p-2 rounded-full">
                <span className="material-icons">{card.icon}</span>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              {card.comparison.trend === "up" && (
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              )}
              {card.comparison.trend === "down" && (
                <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              {card.comparison.trend === "neutral" && (
                <Minus className="h-4 w-4 text-yellow-500 mr-1" />
              )}
              <span className={`font-medium ${
                card.comparison.trend === "up" || card.comparison.trend === "down" 
                  ? "text-green-500" 
                  : "text-yellow-500"
              }`}>
                {card.comparison.value}
              </span>
              <span className="text-[#666666] ml-1">{card.comparison.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
