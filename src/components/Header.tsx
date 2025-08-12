import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Settings, 
  User, 
  Search, 
  Wifi,
  Shield,
  Activity,
  Database,
  BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Wifi className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">IoT Command Center</h1>
              <p className="text-xs text-muted-foreground">Edge Device Management Platform</p>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-1">
            <Link to="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </Button>
            </Link>
            
            <Link to="/dashboard">
              <Button 
                variant={isActive("/dashboard") ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Database className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            
            {/* <Link to="/devices">
              <Button 
                variant={isActive("/devices") ? "default" : "ghost"} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Activity className="h-4 w-4" />
                <span>Devices</span>
              </Button>
            </Link> */}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search devices..." 
              className="pl-10 w-64"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-success text-success-foreground border-0">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </Badge>
            <Badge variant="outline" className="bg-primary text-primary-foreground border-0">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>

          {/* <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 bg-destructive text-destructive-foreground border-0 text-xs flex items-center justify-center">
              
            </Badge>
          </Button> */}

          {/* <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button> */}

          <Button variant="outline" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};