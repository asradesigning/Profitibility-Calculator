import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Menu, 
  User, 
  LogOut,
  LayoutDashboard, 
  FileInput, 
  FileBarChart, 
  // Settings removed as requested
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className="w-full md:w-64 bg-[#1A1A1A] text-white md:min-h-screen md:sticky md:top-0 z-10">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center">
          <span className="material-icons mr-2">insights</span>
          Profit Analysis
        </h1>
        <button 
          className="md:hidden text-white" 
          onClick={toggleMobileMenu}
        >
          <Menu size={24} />
        </button>
      </div>
      
      <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block p-4`}>
        {/* User profile */}
        <div className="mb-6 pb-4 border-b border-gray-700">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 bg-orange-600 text-white">
              <AvatarFallback>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-gray-400">Logged in</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="mt-3 text-gray-400 hover:text-white w-full justify-start text-sm"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </div>
        
        <ul>
          <li className="mb-2">
            <Link href="/">
              <div className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors ${isActive('/') ? 'bg-gray-700' : ''}`}>
                <LayoutDashboard className="h-4 w-4 mr-3" />
                Dashboard
              </div>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/input-data">
              <div className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors ${isActive('/input-data') ? 'bg-gray-700' : ''}`}>
                <FileInput className="h-4 w-4 mr-3" />
                Input Data
              </div>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/reports">
              <div className={`flex items-center p-2 rounded hover:bg-gray-700 transition-colors ${isActive('/reports') ? 'bg-gray-700' : ''}`}>
                <FileBarChart className="h-4 w-4 mr-3" />
                Reports
              </div>
            </Link>
          </li>
          {/* Settings option removed as requested */}
        </ul>
        
        {/* Footer section with empty space for future additions */}
        <div className="mt-8 border-t border-gray-700 pt-4">
          <div className="text-center text-xs text-gray-500">
            <p>© 2025 Profit Analysis</p>
            <p className="mt-1">Version 1.0</p>
          </div>
        </div>
      </nav>
    </aside>
  );
}
