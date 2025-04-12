import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });
  };
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your application settings have been updated",
    });
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Settings</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" defaultValue="Demo User" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="demo@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" defaultValue="Example Inc." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" defaultValue="Financial Analyst" />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                    rows={4}
                    defaultValue="Financial analyst with expertise in business profitability analysis and strategic planning."
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" className="bg-[#FF6B00] hover:bg-[#FF9D4D]">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-gray-500">Switch between light and dark mode</p>
                  </div>
                  <Switch 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode} 
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h3 className="font-medium">Color Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-full h-12 bg-[#FF6B00] rounded-md border-2 border-black cursor-pointer" />
                      <span className="text-sm">Orange (Default)</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-full h-12 bg-blue-500 rounded-md cursor-pointer" />
                      <span className="text-sm">Blue</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-full h-12 bg-green-500 rounded-md cursor-pointer" />
                      <span className="text-sm">Green</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="bg-[#FF6B00] hover:bg-[#FF9D4D]">
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Set your application preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="XOF">XOF (CFA Franc)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-Save</h3>
                    <p className="text-sm text-gray-500">Automatically save changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show Tooltips</h3>
                    <p className="text-sm text-gray-500">Display helpful tooltips throughout the app</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="bg-[#FF6B00] hover:bg-[#FF9D4D]">
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications</p>
                  </div>
                  <Switch 
                    checked={notifications} 
                    onCheckedChange={setNotifications} 
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Project Updates</h4>
                      <p className="text-sm text-gray-500">When projects are created or updated</p>
                    </div>
                    <Switch defaultChecked disabled={!notifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Analysis Results</h4>
                      <p className="text-sm text-gray-500">When analysis calculations are complete</p>
                    </div>
                    <Switch defaultChecked disabled={!notifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Scenario Changes</h4>
                      <p className="text-sm text-gray-500">When scenario parameters are modified</p>
                    </div>
                    <Switch defaultChecked disabled={!notifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">System Notifications</h4>
                      <p className="text-sm text-gray-500">Important system messages</p>
                    </div>
                    <Switch defaultChecked disabled={!notifications} />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} className="bg-[#FF6B00] hover:bg-[#FF9D4D]">
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
