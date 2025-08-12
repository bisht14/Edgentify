import { Header } from "@/components/Header";
import { KpiCard } from "@/components/KpiCard";
import { DeviceCard } from "@/components/DeviceCard";
import { HealthChart } from "@/components/HealthChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Download, 
  RefreshCw,
  Server,
  Smartphone,
  Thermometer,
  Gauge
} from "lucide-react";

// Mock data for demonstration
const kpiData = [
  {
    title: "Device Uptime",
    value: "99.2",
    unit: "%",
    change: 2.1,
    description: "Average uptime across all devices"
  },
  {
    title: "Data Throughput",
    value: "2.4",
    unit: "GB/h",
    change: 12.5,
    description: "Real-time data processing rate"
  },
  {
    title: "Network Health",
    value: "93.5",
    unit: "%",
    change: +1.2,
    description: "Overall network connectivity score"
  }
];

const devicesData = [
  {
    id: "IOT-001",
    name: "Temperature Sensor A1",
    type: "Environmental Sensor",
    status: "online" as const,
    battery: 87,
    signalStrength: 92,
    lastSeen: "2 minutes ago",
    location: "Building A - Floor 3"
  },
  {
    id: "IOT-002",
    name: "Smart Gateway B2",
    type: "Edge Gateway",
    status: "offline" as const,
    signalStrength: 0,
    lastSeen: "30 seconds ago",
    location: "Building B - Server Room"
  },
  // {
  //   id: "IOT-003",
  //   name: "Vibration Monitor C1",
  //   type: "Industrial Sensor",
  //   status: "offline" as const,
  //   battery: 0,
  //   signalStrength: 0,
  //   lastSeen: "5 minutes ago",
  //   location: "Factory Floor - Machine #7"
  // },
  // {
  //   id: "IOT-004",
  //   name: "Air Quality Sensor D1",
  //   type: "Environmental Sensor",
  //   status: "offline" as const,
  //   battery: 0,
  //   signalStrength: 0,
  //   lastSeen: "2 hours ago",
  //   location: "Building D - HVAC Room"
  // }
];

const uptimeData = [
  { time: "00:00", value: 88.5 },
  { time: "04:00", value: 99.1 },
  { time: "08:00", value: 80.8 },
  { time: "12:00", value: 90.2 },
  { time: "16:00", value: 95.9 },
  { time: "20:00", value: 99.5 },
  { time: "24:00", value: 99.2 }
];

const throughputData = [
  { time: "00:00", value: 1.8 },
  { time: "04:00", value: 1.2 },
  { time: "08:00", value: 2.8 },
  { time: "12:00", value: 3.2 },
  { time: "16:00", value: 5.9 },
  { time: "20:00", value: 2.1 },
  { time: "24:00", value: 8.4 }
];

const temperatureData = [
  { time: "00:00", value: 22.1, threshold: 25 },
  { time: "04:00", value: 22.8, threshold: 25 },
  { time: "08:00", value: 26.2, threshold: 25 },
  { time: "12:00", value: 14.8, threshold: 25 },
  { time: "16:00", value: 15.1, threshold: 25 },
  { time: "20:00", value: 21.2, threshold: 25 },
  { time: "24:00", value: 22.9, threshold: 25 }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6 space-y-6">
        {/* KPI Dashboard */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Performance Overview</h2>
              <p className="text-muted-foreground">Real-time monitoring of your IoT infrastructure</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <KpiCard key={index} {...kpi} />
            ))}
          </div>
        </section>

        {/* Tabs for different views */}
        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health" className="flex items-center space-x-2">
              <Gauge className="h-4 w-4" />
              <span>Health Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Device Management</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4" />
              <span>Environmental Data</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HealthChart
                title="Device Uptime (%)"
                data={uptimeData}
                type="area"
                color="hsl(var(--chart-1))"
                unit="%"
              />
              <HealthChart
                title="Data Throughput (GB/h)"
                data={throughputData}
                type="line"
                color="hsl(var(--chart-2))"
                unit="GB/h"
              />
            </div>
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Connected Devices</h3>
                <p className="text-muted-foreground">
                  {devicesData.filter(d => d.status === 'online').length} of {devicesData.length} devices online
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {devicesData.map((device) => (
                <DeviceCard key={device.id} {...device} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HealthChart
                title="Temperature Monitoring (°C)"
                data={temperatureData}
                type="line"
                color="hsl(var(--chart-3))"
                unit="°C"
              />
              <Card>
                <CardHeader>
                  <CardTitle>Environmental Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border-l-4 border-warning bg-warning/10 rounded">
                    <p className="font-medium text-warning-foreground">Temperature Threshold Exceeded</p>
                    <p className="text-sm text-muted-foreground">Sensor IOT-001 recorded 26.1°C at 8:00</p>
                  </div>
                  <div className="p-3 border-l-4 border-success bg-success/10 rounded">
                    <p className="font-medium text-success-foreground">Normal Operations</p>
                    <p className="text-sm text-muted-foreground">All other sensors within acceptable ranges</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;