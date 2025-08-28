import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const device = "laptop-core-01";
const API_URL = `https://68c3yg3vj5.execute-api.us-east-1.amazonaws.com/prod/logs?device_id=${device}`;

const Dashboard = () => {
  const [dynamoLogs, setDynamoLogs] = useState<any[]>([]);
  const [cpuData, setCpuData] = useState<any[]>([]);
  const [memData, setMemData] = useState<any[]>([]);
  const [diskData, setDiskData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const updateCharts = (logsArray: any[]) => {
    if (!Array.isArray(logsArray)) return;

    const cpu: any[] = [];
    const mem: any[] = [];
    const disk: any[] = [];
    const alertArr: any[] = [];

    logsArray.forEach((log) => {
      const payload = log.payload ?? log;
      const timeLabel = payload.timestamp
        ? new Date(payload.timestamp).toLocaleTimeString()
        : new Date().toLocaleTimeString();

      if (payload.cpu_percent != null) cpu.push({ time: timeLabel, value: payload.cpu_percent });
      if (payload.mem_percent != null) mem.push({ time: timeLabel, value: payload.mem_percent });
      if (payload.disk_percent_root != null) disk.push({ time: timeLabel, value: payload.disk_percent_root });

      if (payload.cpu_percent > 80) alertArr.push({ time: timeLabel, message: `High CPU: ${payload.cpu_percent}%` });
      if (payload.mem_percent > 80) alertArr.push({ time: timeLabel, message: `High Memory: ${payload.mem_percent}%` });
      if (payload.disk_percent_root > 90) alertArr.push({ time: timeLabel, message: `High Disk Usage: ${payload.disk_percent_root}%` });
    });

    setCpuData(cpu.slice(-20));
    setMemData(mem.slice(-20));
    setDiskData(disk.slice(-20));
    setAlerts(alertArr.slice(-5));
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const parsed = typeof data.body === "string" ? JSON.parse(data.body) : data;

        const logsArray = parsed.dynamodb_logs ?? [];
        setDynamoLogs(logsArray);
        updateCharts(logsArray);
      } catch (err) {
        console.error("❌ Error fetching DynamoDB logs:", err);
      }
    };

    fetchLogs();
  }, []);

  const ChartBlock = ({ title, data, color }: any) => (
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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">IoT Device Dashboard</h2>

      <div className="mb-4 p-4 border border-red-400 bg-red-50 rounded">
        <h3 className="text-lg font-bold text-red-600 mb-2">Active Alerts</h3>
        {alerts.length === 0 ? <p className="text-gray-500">No active alerts.</p> :
          <ul>{alerts.map((alert, index) => <li key={index}><strong>{alert.time}:</strong> {alert.message}</li>)}</ul>
        }
      </div>

      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Timestamp</th>
            <th className="p-2 border">CPU %</th>
            <th className="p-2 border">Memory %</th>
            <th className="p-2 border">Disk %</th>
          </tr>
        </thead>
        <tbody>
          {dynamoLogs.length > 0 ? (
            dynamoLogs.map((log, index) => {
              const payload = log.payload ?? log;
              return (
                <tr key={index}>
                  <td className="p-2 border">{payload.timestamp ? new Date(payload.timestamp).toLocaleString() : "-"}</td>
                  <td className="p-2 border">{payload.cpu_percent ?? "-"}</td>
                  <td className="p-2 border">{payload.mem_percent ?? "-"}</td>
                  <td className="p-2 border">{payload.disk_percent_root ?? "-"}</td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={4} className="text-center p-4">No logs available.</td></tr>
          )}
        </tbody>
      </table>

      <div className="flex flex-wrap mt-8">
        <ChartBlock title="CPU Usage (%)" data={cpuData} color="#ff7300" />
        <ChartBlock title="Memory Usage (%)" data={memData} color="#387908" />
        <ChartBlock title="Disk Usage (%)" data={diskData} color="#003f5c" />
      </div>
    </div>
  );
};

export default Dashboard;

