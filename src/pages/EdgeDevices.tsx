import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DeviceCard } from "@/components/DeviceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Search, 
  RefreshCw,
  Wifi,
  WifiOff,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EdgeDevice {
  id: string;
  device_id: string;
  name: string;
  type: string;
  location: string;
  ip_address: unknown;
  firmware_version: string | null;
  status: string;
  last_ping: string | null;
  battery_level: number | null;
  signal_strength: number | null;
  created_at: string;
  updated_at: string;
}

const EdgeDevices = () => {
  const [devices, setDevices] = useState<EdgeDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<EdgeDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchDevices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('edge_devices')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching devices:', error);
    } else {
      setDevices(data || []);
      setFilteredDevices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();

    // Set up real-time subscription for device updates
    const channel = supabase
      .channel('edge_devices_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'edge_devices'
        },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter devices based on search and status
  useEffect(() => {
    let filtered = devices;

    if (searchQuery) {
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    setFilteredDevices(filtered);
  }, [devices, searchQuery, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4 text-success" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-muted-foreground" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-warning" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success text-success-foreground';
      case 'offline': return 'bg-muted text-muted-foreground';
      case 'maintenance': return 'bg-warning text-warning-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusCounts = {
    all: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length,
    error: devices.filter(d => d.status === 'error').length
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 space-y-6">
        {/* Header Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Edge Device Management</h2>
              <p className="text-muted-foreground">Monitor and manage your connected IoT devices</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={fetchDevices}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {/* <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button> */}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className={statusFilter === "all" ? "ring-2 ring-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.all}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={() => setStatusFilter("all")}
                >
                  View All
                </Button>
              </CardContent>
            </Card>

            <Card className={statusFilter === "online" ? "ring-2 ring-success" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online</CardTitle>
                <Wifi className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{statusCounts.online}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={() => setStatusFilter("online")}
                >
                  Filter Online
                </Button>
              </CardContent>
            </Card>

            <Card className={statusFilter === "offline" ? "ring-2 ring-muted" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offline</CardTitle>
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">{statusCounts.offline}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={() => setStatusFilter("offline")}
                >
                  Filter Offline
                </Button>
              </CardContent>
            </Card>

            <Card className={statusFilter === "maintenance" ? "ring-2 ring-warning" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <Wrench className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{statusCounts.maintenance}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={() => setStatusFilter("maintenance")}
                >
                  Filter Maintenance
                </Button>
              </CardContent>
            </Card>

            <Card className={statusFilter === "error" ? "ring-2 ring-destructive" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{statusCounts.error}</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={() => setStatusFilter("error")}
                >
                  Filter Errors
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices by name, ID, location, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'online', 'offline', 'maintenance', 'error'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Devices Grid */}
        <section>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg">Loading devices...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDevices.map((device) => (
                  <Card key={device.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium truncate">{device.name}</CardTitle>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(device.status)}
                          <Badge className={getStatusColor(device.status)} variant="outline">
                            {device.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{device.device_id}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">{device.type}</p>
                        <p className="text-xs text-muted-foreground">{device.location}</p>
                      </div>
                      
                      {device.ip_address && (
                        <p className="text-xs">IP: {String(device.ip_address)}</p>
                      )}
                      
                      {device.firmware_version && (
                        <p className="text-xs">Firmware: {device.firmware_version}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {device.battery_level !== null && (
                          <div>
                            <span className="text-muted-foreground">Battery:</span>
                            <span className={`ml-1 ${device.battery_level < 20 ? 'text-destructive' : 'text-foreground'}`}>
                              {device.battery_level}%
                            </span>
                          </div>
                        )}
                        {device.signal_strength !== null && (
                          <div>
                            <span className="text-muted-foreground">Signal:</span>
                            <span className={`ml-1 ${device.signal_strength < 30 ? 'text-destructive' : 'text-foreground'}`}>
                              {device.signal_strength}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {device.last_ping && (
                        <p className="text-xs text-muted-foreground">
                          Last seen: {formatDistanceToNow(new Date(device.last_ping), { addSuffix: true })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredDevices.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-lg font-medium">No devices found</div>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria" 
                      : "Add your first device to get started"
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default EdgeDevices;