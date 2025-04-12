import { Card, CardContent } from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";

interface CostBreakdownProps {
  costBreakdown: {
    initialInvestment: number;
    fixedCosts: number;
    variableCosts: number;
  };
  height?: number;
}

export default function CostBreakdownChart({ costBreakdown, height = 210 }: CostBreakdownProps) {
  if (!costBreakdown) {
    return (
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Cost Breakdown</h2>
          <div style={{ height: `${height}px` }} className="flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Process the data
  const { initialInvestment, fixedCosts, variableCosts } = costBreakdown;
  const totalCosts = initialInvestment + fixedCosts + variableCosts;
  
  const data = [
    { name: 'Initial Investment', value: initialInvestment },
    { name: 'Fixed Monthly', value: fixedCosts },
    { name: 'Variable Costs', value: variableCosts }
  ];
  
  // Color configuration
  const COLORS = ['#FF6B00', '#FF9D4D', '#1A1A1A'];
  
  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / totalCosts) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{payload[0].name}</p>
          <p>${payload[0].value.toLocaleString()}</p>
          <p>{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Cost Breakdown</h2>
        
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
                label={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 inline-block mr-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span>{item.name}</span>
              </div>
              <span className="font-medium">${item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
