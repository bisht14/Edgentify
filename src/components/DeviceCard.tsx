import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Cpu, 
  Wifi, 
  Battery, 
  Settings, 
  MoreVertical,
  AlertTriangle 
} from "lucide-react";

interface DeviceCardProps {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "warning";
  battery?: number;
  signalStrength: number;
  lastSeen: string;
  location: string;
}

export const DeviceCard = ({ 
  id, 
  name, 
  type, 
  status, 
  battery, 
  signalStrength, 
  lastSeen, 
  location 
}: DeviceCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "online": return "bg-success text-success-foreground";
      case "offline": return "bg-destructive text-destructive-foreground";
      case "warning": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSignalIcon = () => {
    if (signalStrength > 70) return "text-success";
    if (signalStrength > 30) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-sm font-medium">{name}</CardTitle>
            <p className="text-xs text-muted-foreground">{type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusColor()} border-0 text-xs`}>
            {status}
          </Badge>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Wifi className={`h-4 w-4 ${getSignalIcon()}`} />
            <span className="text-muted-foreground">Signal:</span>
            <span>{signalStrength}%</span>
          </div>
          {battery !== undefined && (
            <div className="flex items-center space-x-1">
              <Battery className="h-4 w-4 text-muted-foreground" />
              <span>{battery}%</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>Location: {location}</p>
          <p>Last seen: {lastSeen}</p>
          <p>ID: {id}</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          {status === "warning" && (
            <Button variant="outline" size="sm" className="flex-1 text-warning border-warning">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};