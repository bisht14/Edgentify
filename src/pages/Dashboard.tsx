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



