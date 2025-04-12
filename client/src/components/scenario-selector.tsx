import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Scenario } from "@shared/schema";

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: string;
  onSelectScenario: (scenarioName: string) => void;
}

export default function ScenarioSelector({ 
  scenarios, 
  selectedScenario,
  onSelectScenario 
}: ScenarioSelectorProps) {
  const { toast } = useToast();
  const [editableScenarios, setEditableScenarios] = useState(scenarios);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handle scenario selection
  const handleSelectScenario = (scenarioName: string) => {
    onSelectScenario(scenarioName);
  };

  // Update scenario values
  const handleScenarioChange = (id: number, field: string, value: any) => {
    setEditableScenarios(prev => 
      prev.map(scenario => 
        scenario.id === id 
          ? { ...scenario, [field]: value } 
          : scenario
      )
    );
  };

  // Save scenarios changes
  const handleSaveScenarios = async () => {
    try {
      // Update each scenario
      for (const scenario of editableScenarios) {
        await apiRequest('PUT', `/api/scenarios/${scenario.id}`, {
          growthRate: scenario.growthRate,
          costAdjustment: scenario.costAdjustment,
          enabled: scenario.enabled
        });
      }
      
      toast({
        title: "Scenarios Updated",
        description: "Your scenario settings have been saved.",
      });
      
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update scenarios.",
        variant: "destructive"
      });
    }
  };

  // Get scenario icon based on name
  const getScenarioIcon = (name: string) => {
    if (name === 'Optimistic') return <span className="material-icons text-green-500 mr-2">trending_up</span>;
    if (name === 'Pessimistic') return <span className="material-icons text-red-500 mr-2">trending_down</span>;
    return <span className="material-icons text-yellow-500 mr-2">trending_flat</span>;
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Scenario Analysis</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-[#FF6B00] hover:text-[#FF9D4D] font-medium flex items-center"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Scenarios
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Scenario Parameters</DialogTitle>
              </DialogHeader>
              
              {editableScenarios.map(scenario => (
                <div key={scenario.id} className="p-4 border border-gray-200 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      {getScenarioIcon(scenario.name)}
                      <h3 className="font-medium">{scenario.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`enable-${scenario.id}`}>Enable</Label>
                      <Switch 
                        id={`enable-${scenario.id}`}
                        checked={scenario.enabled}
                        onCheckedChange={(checked) => handleScenarioChange(scenario.id, 'enabled', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`growth-${scenario.id}`}>Growth Rate (%)</Label>
                      <Input
                        id={`growth-${scenario.id}`}
                        type="number"
                        value={scenario.growthRate}
                        onChange={(e) => handleScenarioChange(scenario.id, 'growthRate', Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`cost-${scenario.id}`}>Cost Adjustment (%)</Label>
                      <Input
                        id={`cost-${scenario.id}`}
                        type="number"
                        value={scenario.costAdjustment}
                        onChange={(e) => handleScenarioChange(scenario.id, 'costAdjustment', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end space-x-3 mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  className="bg-[#FF6B00] hover:bg-[#FF9D4D]"
                  onClick={handleSaveScenarios}
                >
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              className={`scenario-btn flex-1 bg-white border border-gray-200 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors ${
                selectedScenario === scenario.name ? 'border-2 border-[#FF6B00]' : ''
              }`}
              onClick={() => handleSelectScenario(scenario.name)}
              disabled={!scenario.enabled}
            >
              <div className="flex items-center justify-center">
                {getScenarioIcon(scenario.name)}
                <span className="font-medium">{scenario.name}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
          {scenarios.find(s => s.name === selectedScenario) && (
            <>
              <div>
                <span className="text-[#666666]">Growth rate:</span>
                <span className="ml-1 font-medium">
                  {scenarios.find(s => s.name === selectedScenario)?.growthRate}%
                </span>
              </div>
              <div>
                <span className="text-[#666666]">Cost variation:</span>
                <span className="ml-1 font-medium">
                  {scenarios.find(s => s.name === selectedScenario)?.costAdjustment >= 0 ? '+' : ''}
                  {scenarios.find(s => s.name === selectedScenario)?.costAdjustment}%
                </span>
              </div>
              <div>
                <span className="text-[#666666]">Revenue adjustment:</span>
                <span className="ml-1 font-medium">
                  {scenarios.find(s => s.name === selectedScenario)?.growthRate >= 0 ? '+' : ''}
                  {scenarios.find(s => s.name === selectedScenario)?.growthRate}%
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
