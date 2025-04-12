import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine 
} from "recharts";
import { type MonthlyProjection } from "@shared/schema";

interface RevenueExpensesChartProps {
  monthlyData?: MonthlyProjection[];
  height?: number;
}

export default function RevenueExpensesChart({ monthlyData, height = 270 }: RevenueExpensesChartProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('cumulative');
  
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Revenue vs Expenses</h2>
          </div>
          <div style={{ height: `${height}px` }} className="flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate break-even month (first month where cumulative profit >= 0)
  let breakEvenMonth = 0;
  let cumulativeProfit = 0;
  
  for (let i = 0; i < monthlyData.length; i++) {
    cumulativeProfit += monthlyData[i].profit;
    if (cumulativeProfit >= 0 && breakEvenMonth === 0) {
      breakEvenMonth = i + 1;
    }
  }
  
  // Prepare chart data
  const chartData = monthlyData.map((month, index) => {
    let cumulativeRevenue = 0;
    let cumulativeExpenses = 0;
    
    if (viewMode === 'cumulative') {
      // Calculate cumulative values
      for (let i = 0; i <= index; i++) {
        cumulativeRevenue += monthlyData[i].revenue;
        cumulativeExpenses += monthlyData[i].expenses;
      }
      
      return {
        name: `M${month.month}`,
        revenue: cumulativeRevenue,
        expenses: cumulativeExpenses
      };
    }
    
    // Monthly view
    return {
      name: `M${month.month}`,
      revenue: month.revenue,
      expenses: month.expenses
    };
  });
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Revenue vs Expenses</h2>
          <div className="flex text-sm">
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              className={`rounded-l-lg ${viewMode === 'monthly' ? 'bg-[#FF6B00] hover:bg-[#FF9D4D]' : ''}`}
              onClick={() => setViewMode('monthly')}
              size="sm"
            >
              Monthly
            </Button>
            <Button
              variant={viewMode === 'cumulative' ? 'default' : 'outline'}
              className={`rounded-r-lg ${viewMode === 'cumulative' ? 'bg-[#FF6B00] hover:bg-[#FF9D4D]' : ''}`}
              onClick={() => setViewMode('cumulative')}
              size="sm"
            >
              Cumulative
            </Button>
          </div>
        </div>
        
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`$${value.toLocaleString()}`, undefined]}
                labelFormatter={(label) => `Month ${label.substring(1)}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#FF6B00" 
                strokeWidth={2} 
                activeDot={{ r: 8 }} 
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#1A1A1A" 
                strokeWidth={2} 
                name="Expenses"
              />
              
              {viewMode === 'cumulative' && breakEvenMonth > 0 && (
                <ReferenceLine 
                  x={`M${breakEvenMonth}`} 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{ 
                    value: 'Break-even', 
                    fill: '#4CAF50',
                    position: 'top',
                    offset: 10
                  }} 
                  ifOverflow="extendDomain"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-[#FF6B00] inline-block mr-2 rounded-full"></span>
            Revenue
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-[#1A1A1A] inline-block mr-2 rounded-full"></span>
            Expenses
          </div>
          {viewMode === 'cumulative' && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-[#4CAF50] inline-block mr-2 rounded-full"></span>
              Break-even
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
