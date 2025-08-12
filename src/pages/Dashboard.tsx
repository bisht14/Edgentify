// import { useEffect, useState } from "react";
// import { Header } from "@/components/Header";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { HealthChart } from "@/components/HealthChart";
// import { supabase } from "@/integrations/supabase/client";
// import { 
//   RefreshCw, 
//   Server, 
//   AlertTriangle, 
//   CheckCircle,
//   TrendingUp,
//   Activity,
//   Database
// } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";

// interface MachineLog {
//   id: string;
//   device_id: string;
//   device_name: string;
//   log_level: string;
//   message: string;
//   component: string | null;
//   temperature: number | null;
//   pressure: number | null;
//   vibration: number | null;
//   status: string;
//   created_at: string;
// }

// const Dashboard = () => {
//   const [logs, setLogs] = useState<MachineLog[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [stats, setStats] = useState({
//     totalDevices: 0,
//     onlineDevices: 0,
//     warningLogs: 0,
//     errorLogs: 0
//   });

//   // Real-time health data
//   const [healthData, setHealthData] = useState([
//     { time: new Date().toLocaleTimeString(), value: 98.5 },
//     { time: new Date(Date.now() - 3600000).toLocaleTimeString(), value: 99.1 },
//     { time: new Date(Date.now() - 7200000).toLocaleTimeString(), value: 99.8 },
//     { time: new Date(Date.now() - 10800000).toLocaleTimeString(), value: 99.2 }
//   ]);

//   const fetchLogs = async () => {
//     setLoading(true);
//     const { data, error } = await supabase
//       .from('machine_logs')
//       .select('*')
//       .order('created_at', { ascending: false })
//       .limit(50);

//     if (error) {
//       console.error('Error fetching logs:', error);
//     } else {
//       setLogs(data || []);
//     }
//     setLoading(false);
//   };

//   const fetchStats = async () => {
//     // Get device count
//     const { count: deviceCount } = await supabase
//       .from('edge_devices')
//       .select('*', { count: 'exact', head: true });

//     // Get online devices count
//     const { count: onlineCount } = await supabase
//       .from('edge_devices')
//       .select('*', { count: 'exact', head: true })
//       .eq('status', 'online');

//     // Get warning logs count (last 24 hours)
//     const { count: warningCount } = await supabase
//       .from('machine_logs')
//       .select('*', { count: 'exact', head: true })
//       .eq('log_level', 'warning')
//       .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

//     // Get error logs count (last 24 hours)
//     const { count: errorCount } = await supabase
//       .from('machine_logs')
//       .select('*', { count: 'exact', head: true })
//       .in('log_level', ['error', 'critical'])
//       .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

//     setStats({
//       totalDevices: deviceCount || 0,
//       onlineDevices: onlineCount || 0,
//       warningLogs: warningCount || 0,
//       errorLogs: errorCount || 0
//     });
//   };

//   useEffect(() => {
//     fetchLogs();
//     fetchStats();
//     fetch("https://abc123.execute-api.us-east-1.amazonaws.com/prod/logs?device_id=device_001")
//       .then((res) => res.json())
//       .then((data) => setLogs(data))
//       .catch((err) => console.error("Error fetching logs:", err));

//     // Set up real-time subscription for logs
//     const channel = supabase
//       .channel('machine_logs_changes')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'machine_logs'
//         },
//         () => {
//           fetchLogs();
//           fetchStats();
//         }
//       )
//       .subscribe();

//     // Simulate real-time health data updates
//     const healthInterval = setInterval(() => {
//       setHealthData(prev => {
//         const newData = [...prev];
//         newData.shift();
//         newData.push({
//           time: new Date().toLocaleTimeString(),
//           value: 95 + Math.random() * 4 // Random between 95-99%
//         });
//         return newData;
//       });
//     }, 5000);

//     return () => {
//       supabase.removeChannel(channel);
//       clearInterval(healthInterval);
//     };
//   }, []);

//   const getLogLevelColor = (level: string) => {
//     switch (level) {
//       case 'info': return 'bg-success text-success-foreground';
//       case 'warning': return 'bg-warning text-warning-foreground';
//       case 'error': return 'bg-destructive text-destructive-foreground';
//       case 'critical': return 'bg-destructive text-destructive-foreground';
//       default: return 'bg-muted text-muted-foreground';
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case 'healthy': return <CheckCircle className="h-4 w-4 text-success" />;
//       case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
//       case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
//       case 'offline': return <Server className="h-4 w-4 text-muted-foreground" />;
//       default: return <Activity className="h-4 w-4 text-muted-foreground" />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <Header />
      
//       <main className="p-6 space-y-6">
//         {/* Real-time Stats */}
//         <section>
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-2xl font-bold text-foreground">Live Dashboard</h2>
//               <p className="text-muted-foreground">Real-time machine logs and component health monitoring</p>
//             </div>
//             <Button variant="outline" size="sm" onClick={fetchLogs}>
//               <RefreshCw className="h-4 w-4 mr-2" />
//               Refresh
//             </Button>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
//                 <Server className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{stats.totalDevices}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
//                 <CheckCircle className="h-4 w-4 text-success" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold text-success">{stats.onlineDevices}</div>
//                 <p className="text-xs text-muted-foreground">
//                   {stats.totalDevices > 0 ? Math.round((stats.onlineDevices / stats.totalDevices) * 100) : 0}% uptime
//                 </p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Warnings (24h)</CardTitle>
//                 <AlertTriangle className="h-4 w-4 text-warning" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold text-warning">{stats.warningLogs}</div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
//                 <AlertTriangle className="h-4 w-4 text-destructive" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold text-destructive">{stats.errorLogs}</div>
//               </CardContent>
//             </Card>
//           </div>
//         </section>

//         <Tabs defaultValue="logs" className="space-y-6">
//           <TabsList className="grid w-full grid-cols-2">
//             <TabsTrigger value="logs" className="flex items-center space-x-2">
//               <Database className="h-4 w-4" />
//               <span>Machine Logs</span>
//             </TabsTrigger>
//             <TabsTrigger value="health" className="flex items-center space-x-2">
//               <TrendingUp className="h-4 w-4" />
//               <span>Health Monitoring</span>
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="logs" className="space-y-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle>Real-time Machine Logs</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {loading ? (
//                   <div className="text-center py-8">Loading logs...</div>
//                 ) : (
//                   <div className="space-y-4 max-h-96 overflow-y-auto">
//                     {logs.map((log) => (
//                       <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
//                         <div className="flex items-center space-x-2">
//                           {getStatusIcon(log.status)}
//                           <Badge className={getLogLevelColor(log.log_level)}>
//                             {log.log_level.toUpperCase()}
//                           </Badge>
//                         </div>
//                         <div className="flex-1 space-y-1">
//                           <div className="flex items-center justify-between">
//                             <h4 className="font-medium">{log.device_name}</h4>
//                             <span className="text-xs text-muted-foreground">
//                               {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
//                             </span>
//                           </div>
//                           <p className="text-sm text-muted-foreground">{log.message}</p>
//                           {log.component && (
//                             <p className="text-xs text-muted-foreground">Component: {log.component}</p>
//                           )}
//                           {(log.temperature || log.pressure || log.vibration) && (
//                             <div className="flex space-x-4 text-xs">
//                               {log.temperature && <span>Temp: {log.temperature}°C</span>}
//                               {log.pressure && <span>Pressure: {log.pressure} Pa</span>}
//                               {log.vibration && <span>Vibration: {log.vibration} Hz</span>}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                     {logs.length === 0 && (
//                       <div className="text-center py-8 text-muted-foreground">
//                         No logs available
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           <TabsContent value="health" className="space-y-6">
//             <HealthChart
//               title="Real-time System Health (%)"
//               data={healthData}
//               type="area"
//               color="hsl(var(--chart-1))"
//               unit="%"
//             />
//           </TabsContent>
//         </Tabs>
        
//       </main>
//     </div>
//   );
// };

// export default Dashboard;









// // import { useEffect, useState } from "react";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import mqtt from "mqtt";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [tempData, setTempData] = useState([]);
  const [pressureData, setPressureData] = useState([]);
  const [vibrationData, setVibrationData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Initial fetch for historical logs
    fetch("https://68c3yg3vj5.execute-api.us-east-1.amazonaws.com/prod/logs?device_id=device_001")
      .then((res) => res.json())
      .then((data) => {
        const parsed = typeof data.body === "string" ? JSON.parse(data.body) : data;
        setLogs(parsed);

        const tempInit = [];
        const pressureInit = [];
        const vibrationInit = [];
        const alertInit = [];

        parsed.forEach((log) => {
          const timeLabel = new Date(log.timestamp * 1000).toLocaleTimeString();
          tempInit.push({ time: timeLabel, value: parseFloat(log.temperature) });
          pressureInit.push({ time: timeLabel, value: parseFloat(log.pressure) });
          vibrationInit.push({ time: timeLabel, value: parseFloat(log.vibration) });

          if (parseFloat(log.temperature) > 50) {
            alertInit.push({ time: timeLabel, message: `High Temperature: ${log.temperature}°C` });
          }
          if (log.status && log.status.toLowerCase() === "error") {
            alertInit.push({ time: timeLabel, message: `Error Status Reported` });
          }
        });

        setTempData(tempInit.slice(-20));
        setPressureData(pressureInit.slice(-20));
        setVibrationData(vibrationInit.slice(-20));
        setAlerts(alertInit.slice(-5)); // only keep last 5 alerts
      })
      .catch((err) => console.error("Error fetching logs:", err));
  }, []);

  useEffect(() => {
    // Connect to AWS IoT over WebSocket
    const client = mqtt.connect("wss://aky0hohdi2yni-ats.iot.us-east-1.amazonaws.com/mqtt", {
      protocolVersion: 4,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 4000,
    });

    client.on("connect", () => {
      console.log("Connected to MQTT WebSocket");
      client.subscribe("iot/device/data");
    });

    client.on("message", (topic, message) => {
      const msg = JSON.parse(message.toString());
      console.log("MQTT Message:", msg);

      setLogs((prev) => [msg, ...prev].slice(0, 20));

      const timeLabel = new Date(msg.timestamp * 1000).toLocaleTimeString();

      setTempData((prev) => [...prev.slice(-19), { time: timeLabel, value: parseFloat(msg.temperature) }]);
      setPressureData((prev) => [...prev.slice(-19), { time: timeLabel, value: parseFloat(msg.pressure) }]);
      setVibrationData((prev) => [...prev.slice(-19), { time: timeLabel, value: parseFloat(msg.vibration) }]);

      // Handle alerts
      if (parseFloat(msg.temperature) > 50) {
        setAlerts((prev) => [...prev.slice(-4), { time: timeLabel, message: `High Temperature: ${msg.temperature}°C` }]);
      }
      if (msg.status && msg.status.toLowerCase() === "error") {
        setAlerts((prev) => [...prev.slice(-4), { time: timeLabel, message: `Error Status Reported` }]);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const ChartBlock = ({ title, data, color }) => (
    <div className="w-full md:w-1/3 p-2">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const getRowStyle = (log) => {
    if (parseFloat(log.temperature) > 50) {
      return "bg-red-500 text-white";
    }
    if (log.status && log.status.toLowerCase() === "error") {
      return "bg-yellow-300 text-black";
    }
    return "";
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">IoT Device Dashboard</h2>

      {/* Alerts Section */}
      <div className="mb-4 p-4 border border-red-400 bg-red-50 rounded">
        <h3 className="text-lg font-bold text-red-600 mb-2">Active Alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-gray-500">No active alerts.</p>
        ) : (
          <ul>
            {alerts.map((alert, index) => (
              <li key={index} className="mb-1">
                <strong>{alert.time}:</strong> {alert.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Logs Table */}
      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Timestamp</th>
            <th className="p-2 border">Temperature</th>
            <th className="p-2 border">Pressure</th>
            <th className="p-2 border">Vibration</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index} className={getRowStyle(log)}>
              <td className="p-2 border">{new Date(log.timestamp * 1000).toLocaleString()}</td>
              <td className="p-2 border">{log.temperature}</td>
              <td className="p-2 border">{log.pressure}</td>
              <td className="p-2 border">{log.vibration}</td>
              <td className="p-2 border">{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Charts Section */}
      <div className="flex flex-wrap mt-8">
        <ChartBlock title="Temperature (°C)" data={tempData} color="#ff7300" />
        <ChartBlock title="Pressure (hPa)" data={pressureData} color="#387908" />
        <ChartBlock title="Vibration (g)" data={vibrationData} color="#003f5c" />
      </div>
    </div>
  );
};

export default Dashboard;


// Note: This code assumes you have the necessary dependencies installed and configured for React, MQTT, and any CSS framework you are using.


