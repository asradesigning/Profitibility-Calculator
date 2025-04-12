import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { type ScenarioCalculations } from "@shared/schema";

interface ProfitProjectionChartProps {
  scenariosData?: ScenarioCalculations[];
  height?: number;
}

export default function ProfitProjectionChart({ scenariosData, height = 270 }: ProfitProjectionChartProps) {
  const [selectedMonths, setSelectedMonths] = useState<number[]>([3, 6, 9, 12]);
  
  if (!scenariosData || scenariosData.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">12-Month Profit Projection</h2>
          </div>
          <div style={{ height: `${height}px` }} className="flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Define scenario colors
  const scenarioColors = {
    'Optimistic': '#4CAF50',  // Success/green
    'Realistic': '#FFC107',   // Warning/yellow
    'Pessimistic': '#F44336'  // Danger/red
  };
  
  // Prepare chart data for selected months
  const chartData = selectedMonths.map(month => {
    const dataPoint: any = { month: `Month ${month}` };
    
    scenariosData.forEach(scenarioData => {
      // Find monthly projection for this month, or use the last month if not available
      const monthData = scenarioData.monthlyProjections.find(m => m.month === month) || 
                       scenarioData.monthlyProjections[scenarioData.monthlyProjections.length - 1];
      
      if (monthData) {
        dataPoint[scenarioData.scenario.name] = monthData.profit;
      }
    });
    
    return dataPoint;
  });
  
  // Toggle month selection
  const toggleMonth = (month: number) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month].sort((a, b) => a - b));
    }
  };
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close the filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    
    // Add the event listener when dropdown is open
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">12-Month Profit Projection</h2>
          
          <div className="relative" ref={filterRef}>
            <Button 
              variant="ghost" 
              className="text-sm flex items-center text-[#FF6B00] hover:text-[#FF9D4D]"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium">Show Months</h3>
                </div>
                <div className="p-3 space-y-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <div key={month} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`month-${month}`}
                        checked={selectedMonths.includes(month)}
                        onChange={() => toggleMonth(month)}
                        className="h-4 w-4 text-[#FF6B00] focus:ring-[#FF6B00]"
                      />
                      <label htmlFor={`month-${month}`} className="ml-2 text-sm">
                        Month {month}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
              />
              <Legend />
              {scenariosData.map(scenarioData => (
                <Bar 
                  key={scenarioData.scenario.name}
                  dataKey={scenarioData.scenario.name} 
                  fill={scenarioColors[scenarioData.scenario.name as keyof typeof scenarioColors] || '#999999'} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-6 mt-4 text-sm">
          {scenariosData.map(scenarioData => (
            <div key={scenarioData.scenario.name} className="flex items-center">
              <span 
                className="w-3 h-3 inline-block mr-2 rounded-full"
                style={{ backgroundColor: scenarioColors[scenarioData.scenario.name as keyof typeof scenarioColors] || '#999999' }}
              ></span>
              {scenarioData.scenario.name}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
