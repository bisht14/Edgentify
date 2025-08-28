// import { useEffect, useState } from "react";
// import mqtt from "mqtt";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// const MQTT_BROKER_URL = "wss://test.mosquitto.org:8081"; // Replace with your broker
// const MQTT_TOPIC = "opcua/metrics";

// interface LogEntry {
//   timestamp: string;
//   cpu_percent: number;
//   mem_percent: number;
//   disk_percent_root: number;
// }

// const MqttDashboard = () => {
//   const [logs, setLogs] = useState<LogEntry[]>([]);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     // Connect to MQTT broker via WebSocket
//     const client = mqtt.connect(MQTT_BROKER_URL);

//     client.on("connect", () => {
//       console.log("✅ Connected to MQTT broker");
//       setConnected(true);
//       client.subscribe(MQTT_TOPIC, (err) => {
//         if (err) console.error("❌ Subscribe error:", err);
//       });
//     });

//     client.on("message", (topic, message) => {
//       try {
//         const data = JSON.parse(message.toString());
//         setLogs((prev) => {
//           const updated = [...prev, { ...data, timestamp: new Date().toISOString() }];
//           return updated.slice(-50); // Keep last 50 logs
//         });
//       } catch (err) {
//         console.error("❌ Error parsing MQTT message:", err);
//       }
//     });

//     client.on("error", (err) => console.error("❌ MQTT error:", err));
//     client.on("close", () => setConnected(false));

//     return () => {
//       client.end();
//     };
//   }, []);

//   // Compute averages
//   const avgCpu = logs.length ? (logs.reduce((sum, l) => sum + l.cpu_percent, 0) / logs.length).toFixed(1) : "-";
//   const avgMem = logs.length ? (logs.reduce((sum, l) => sum + l.mem_percent, 0) / logs.length).toFixed(1) : "-";
//   const avgDisk = logs.length ? (logs.reduce((sum, l) => sum + l.disk_percent_root, 0) / logs.length).toFixed(1) : "-";

//   return (
//     <div className="p-6 space-y-6">
//       <h2 className="text-3xl font-bold mb-4">
//         MQTT Device Dashboard - laptop-core-01
//       </h2>

//       <p className={`font-semibold ${connected ? "text-green-600" : "text-red-600"}`}>
//         {connected ? "Connected to MQTT broker" : "Disconnected"}
//       </p>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-3 gap-4 mb-6">
//         <div className="p-4 bg-white shadow rounded">
//           <h3 className="font-semibold text-gray-700">Avg CPU %</h3>
//           <p className="text-2xl font-bold">{avgCpu}</p>
//         </div>
//         <div className="p-4 bg-white shadow rounded">
//           <h3 className="font-semibold text-gray-700">Avg Memory %</h3>
//           <p className="text-2xl font-bold">{avgMem}</p>
//         </div>
//         <div className="p-4 bg-white shadow rounded">
//           <h3 className="font-semibold text-gray-700">Avg Disk %</h3>
//           <p className="text-2xl font-bold">{avgDisk}</p>
//         </div>
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         {["cpu_percent", "mem_percent", "disk_percent_root"].map((key) => (
//           <div key={key} className="p-4 bg-white shadow rounded">
//             <h3 className="font-semibold text-gray-700 mb-2">
//               {key === "cpu_percent"
//                 ? "CPU %"
//                 : key === "mem_percent"
//                 ? "Memory %"
//                 : "Disk %"}
//             </h3>
//             <ResponsiveContainer width="100%" height={200}>
//               <LineChart data={[...logs].reverse()}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis
//                   dataKey="timestamp"
//                   tickFormatter={(val) => new Date(val).toLocaleTimeString()}
//                 />
//                 <YAxis domain={[0, 100]} />
//                 <Tooltip labelFormatter={(val) => new Date(val).toLocaleString()} />
//                 <Legend />
//                 <Line
//                   type="monotone"
//                   dataKey={key}
//                   stroke="#4F46E5"
//                   strokeWidth={2}
//                   dot={{ r: 3 }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         ))}
//       </div>

//       {/* Logs Table */}
//       <div className="overflow-x-auto">
//         <table className="table-auto w-full border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="p-2 border">Timestamp</th>
//               <th className="p-2 border">CPU %</th>
//               <th className="p-2 border">Memory %</th>
//               <th className="p-2 border">Disk %</th>
//             </tr>
//           </thead>
//           <tbody>
//             {logs.map((log, idx) => (
//               <tr key={idx}>
//                 <td className="p-2 border">{new Date(log.timestamp).toLocaleString()}</td>
//                 <td className="p-2 border">{log.cpu_percent}</td>
//                 <td className="p-2 border">{log.mem_percent}</td>
//                 <td className="p-2 border">{log.disk_percent_root}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default MqttDashboard;






// import { useEffect, useState } from "react";
// import mqtt from "mqtt";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// const MQTT_BROKER_URL = "wss://test.mosquitto.org:8081"; // Replace with your broker
// const MQTT_TOPIC = "opcua/metrics";

// interface LogEntry {
//   timestamp: string;
//   cpu_percent: number;
//   mem_percent: number;
//   disk_percent_root: number;
// }

// const MqttDashboardDemo = () => {
//   const [logs, setLogs] = useState<LogEntry[]>([]);
//   const [connected, setConnected] = useState(false);
//   const [publishData, setPublishData] = useState<Partial<LogEntry>>({});

//   useEffect(() => {
//     const client = mqtt.connect(MQTT_BROKER_URL);

//     client.on("connect", () => {
//       console.log("✅ Connected to MQTT broker");
//       setConnected(true);
//       client.subscribe(MQTT_TOPIC, (err) => {
//         if (err) console.error("❌ Subscribe error:", err);
//       });
//     });

//     client.on("message", (topic, message) => {
//       try {
//         const data = JSON.parse(message.toString());
//         setLogs((prev) => {
//           const updated = [...prev, { ...data, timestamp: new Date().toISOString() }];
//           return updated.slice(-50); // keep last 50 logs
//         });
//       } catch (err) {
//         console.error("❌ Error parsing MQTT message:", err);
//       }
//     });

//     client.on("error", (err) => console.error("❌ MQTT error:", err));
//     client.on("close", () => setConnected(false));

//     return () => { client.end(); };
//   }, []);

//   const avgCpu = logs.length
//     ? (logs.reduce((sum, l) => sum + l.cpu_percent, 0) / logs.length).toFixed(1)
//     : "-";
//   const avgMem = logs.length
//     ? (logs.reduce((sum, l) => sum + l.mem_percent, 0) / logs.length).toFixed(1)
//     : "-";
//   const avgDisk = logs.length
//     ? (logs.reduce((sum, l) => sum + l.disk_percent_root, 0) / logs.length).toFixed(1)
//     : "-";

//   const handlePublish = () => {
//     const client = mqtt.connect(MQTT_BROKER_URL);
//     const msg = {
//       cpu_percent: publishData.cpu_percent ?? Math.floor(Math.random() * 100),
//       mem_percent: publishData.mem_percent ?? Math.floor(Math.random() * 100),
//       disk_percent_root: publishData.disk_percent_root ?? Math.floor(Math.random() * 100),
//       timestamp: new Date().toISOString(),
//     };
//     client.publish(MQTT_TOPIC, JSON.stringify(msg), {}, (err) => {
//       if (err) console.error("❌ Publish error:", err);
//       client.end();
//     });
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <h2 className="text-3xl font-bold mb-4">MQTT Demo Dashboard</h2>
//       <p className={`font-semibold ${connected ? "text-green-600" : "text-red-600"}`}>
//         {connected ? "Connected to MQTT broker" : "Disconnected"}
//       </p>

//       {/* Publish Controls */}
//       <div className="grid grid-cols-4 gap-4 mb-6">
//         {["cpu_percent", "mem_percent", "disk_percent_root"].map((key) => (
//           <input
//             key={key}
//             type="number"
//             placeholder={key}
//             value={(publishData as any)[key] || ""}
//             onChange={(e) =>
//               setPublishData((prev) => ({ ...prev, [key]: Number(e.target.value) }))
//             }
//             className="border p-2 rounded"
//           />
//         ))}
//         <button
//           onClick={handlePublish}
//           className="bg-primary text-white rounded p-2 hover:bg-primary/80"
//         >
//           Publish
//         </button>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-3 gap-4 mb-6">
//         <div className="p-4 bg-white shadow rounded">
//           <h3 className="font-semibold text-gray-700">Avg CPU %</h3>
//           <p className="text-2xl font-bold">{avgCpu}</p>
//         </div>
//         <div className="p-4 bg-white shadow rounded">
//           <h3 className="font-semibold text-gray-700">Avg Memory %</h3>
//           <p className="text-2xl font-bold">{avgMem}</p>
//         </div>
//         <div className="p-4 bg-white shadow rounded">
//           <h3 className="font-semibold text-gray-700">Avg Disk %</h3>
//           <p className="text-2xl font-bold">{avgDisk}</p>
//         </div>
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//         {["cpu_percent", "mem_percent", "disk_percent_root"].map((key) => (
//           <div key={key} className="p-4 bg-white shadow rounded">
//             <h3 className="font-semibold text-gray-700 mb-2">
//               {key === "cpu_percent"
//                 ? "CPU %"
//                 : key === "mem_percent"
//                 ? "Memory %"
//                 : "Disk %"}
//             </h3>
//             <ResponsiveContainer width="100%" height={200}>
//               <LineChart data={[...logs].reverse()}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis
//                   dataKey="timestamp"
//                   tickFormatter={(val) => new Date(val).toLocaleTimeString()}
//                 />
//                 <YAxis domain={[0, 100]} />
//                 <Tooltip labelFormatter={(val) => new Date(val).toLocaleString()} />
//                 <Legend />
//                 <Line
//                   type="monotone"
//                   dataKey={key}
//                   stroke="#4F46E5"
//                   strokeWidth={2}
//                   dot={{ r: 3 }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         ))}
//       </div>

//       {/* Logs Table */}
//       <div className="overflow-x-auto">
//         <table className="table-auto w-full border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="p-2 border">Timestamp</th>
//               <th className="p-2 border">CPU %</th>
//               <th className="p-2 border">Memory %</th>
//               <th className="p-2 border">Disk %</th>
//             </tr>
//           </thead>
//           <tbody>
//             {logs.map((log, idx) => (
//               <tr key={idx}>
//                 <td className="p-2 border">{new Date(log.timestamp).toLocaleString()}</td>
//                 <td className="p-2 border">{log.cpu_percent}</td>
//                 <td className="p-2 border">{log.mem_percent}</td>
//                 <td className="p-2 border">{log.disk_percent_root}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default MqttDashboardDemo;


















// import { useEffect, useState } from "react";
// import mqtt from "mqtt";

// const MQTT_BROKER_URL = "wss://test.mosquitto.org:8081"; // Your broker
// const MQTT_TOPIC = "opcua/metrics";

// interface LogEntry {
//   timestamp: string;
//   cpu_percent: number;
//   mem_percent: number;
//   disk_percent_root: number;
//   [key: string]: any;
// }

// const SimpleMqttDashboard = () => {
//   const [latest, setLatest] = useState<LogEntry | null>(null);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     const client = mqtt.connect(MQTT_BROKER_URL);

//     client.on("connect", () => {
//       console.log("✅ Connected to MQTT broker");
//       setConnected(true);
//       client.subscribe(MQTT_TOPIC, (err) => {
//         if (err) console.error("❌ Subscribe error:", err);
//         else console.log("📌 Subscribed to topic:", MQTT_TOPIC);
//       });
//     });

//     client.on("message", (topic, message) => {
//       try {
//         const data = JSON.parse(message.toString());
//         const timestamp =
//           typeof data.timestamp === "number"
//             ? new Date(data.timestamp).toISOString()
//             : data.timestamp || new Date().toISOString();

//         setLatest({ ...data, timestamp });
//       } catch (err) {
//         console.error("❌ Error parsing MQTT message:", err);
//       }
//     });

//     client.on("error", (err) => console.error("❌ MQTT error:", err));
//     client.on("close", () => setConnected(false));

//     return () => {
//       client.end();
//     };
//   }, []);

//   if (!latest) {
//     return (
//       <div className="p-6">
//         <h2 className="text-2xl font-bold mb-4">MQTT Dashboard</h2>
//         <p className={connected ? "text-green-600" : "text-red-600"}>
//           {connected ? "Connected to MQTT broker" : "Disconnected"}
//         </p>
//         <p>Waiting for data...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-4">
//       <h2 className="text-2xl font-bold">MQTT Dashboard</h2>
//       <p className={connected ? "text-green-600" : "text-red-600"}>
//         {connected ? "Connected to MQTT broker" : "Disconnected"}
//       </p>

//       <div className="bg-white p-4 shadow rounded">
//         <p>
//           <strong>Timestamp:</strong> {new Date(latest.timestamp).toLocaleString()}
//         </p>
//         <p>
//           <strong>CPU %:</strong> {latest.cpu_percent}
//         </p>
//         <p>
//           <strong>Memory %:</strong> {latest.mem_percent}
//         </p>
//         <p>
//           <strong>Disk %:</strong> {latest.disk_percent_root}
//         </p>

//         {/* Optional: show extra fields if present */}
//         {Object.keys(latest).map((key) => {
//           if (!["timestamp", "cpu_percent", "mem_percent", "disk_percent_root"].includes(key)) {
//             return (
//               <p key={key}>
//                 <strong>{key}:</strong> {latest[key]}
//               </p>
//             );
//           }
//           return null;
//         })}
//       </div>
//     </div>
//   );
// };

// export default SimpleMqttDashboard;


















// import { useEffect, useState } from "react";
// import mqtt from "mqtt";

// const MQTT_BROKER_URL = "wss://test.mosquitto.org:8081"; // Your broker
// const MQTT_TOPIC = "opcua/metrics";

// const JsonMqttDashboard = () => {
//   const [messages, setMessages] = useState<string[]>([]);
//   const [connected, setConnected] = useState(false);

//   useEffect(() => {
//     const client = mqtt.connect(MQTT_BROKER_URL);

//     client.on("connect", () => {
//       console.log("✅ Connected to MQTT broker");
//       setConnected(true);
//       client.subscribe(MQTT_TOPIC, (err) => {
//         if (err) console.error("❌ Subscribe error:", err);
//         else console.log("📌 Subscribed to topic:", MQTT_TOPIC);
//       });
//     });

//     client.on("message", (topic, message) => {
//       const msgStr = message.toString();
//       console.log("📩 MQTT message received:", msgStr);
//       setMessages((prev) => [msgStr, ...prev].slice(0, 50)); // keep last 50
//     });

//     client.on("error", (err) => console.error("❌ MQTT error:", err));
//     client.on("close", () => setConnected(false));

//     return () => {
//       client.end();
//     };
//   }, []);

//   return (
//     <div className="p-6 space-y-4">
//       <h2 className="text-2xl font-bold">MQTT JSON Dashboard</h2>
//       <p className={connected ? "text-green-600" : "text-red-600"}>
//         {connected ? "Connected to MQTT broker" : "Disconnected"}
//       </p>

//       <div className="bg-gray-100 p-4 rounded h-96 overflow-auto font-mono text-sm">
//         {messages.map((msg, idx) => (
//           <div key={idx} className="mb-2">
//             {msg}
//           </div>
//         ))}
//         {messages.length === 0 && <p>Waiting for MQTT messages...</p>}
//       </div>
//     </div>
//   );
// };

// export default JsonMqttDashboard;










import { useEffect, useState } from "react";
import mqtt from "mqtt";

const MQTT_BROKER_URL = "wss://test.mosquitto.org:8081"; // WebSocket broker
const MQTT_TOPIC = "opcua/metrics";

interface LogEntry {
  timestamp: string;
  cpu_percent: number;
  mem_percent: number;
  disk_percent_root: number;
  [key: string]: any;
}

const MergedMqttDashboard = () => {
  const [latest, setLatest] = useState<LogEntry | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER_URL);

    client.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      setConnected(true);
      client.subscribe(MQTT_TOPIC, (err) => {
        if (err) console.error("❌ Subscribe error:", err);
        else console.log("📌 Subscribed to topic:", MQTT_TOPIC);
      });
    });

    client.on("message", (topic, message) => {
      const msgStr = message.toString();
      setMessages((prev) => [msgStr, ...prev].slice(0, 50)); // last 50 messages

      try {
        const data = JSON.parse(msgStr);
        const timestamp =
          typeof data.timestamp === "number"
            ? new Date(data.timestamp).toISOString()
            : data.timestamp || new Date().toISOString();

        setLatest({ ...data, timestamp });
      } catch (err) {
        console.error("❌ Error parsing MQTT message:", err);
      }
    });

    client.on("error", (err) => console.error("❌ MQTT error:", err));
    client.on("close", () => setConnected(false));

    return () => {
      client.end();
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">MQTT Dashboard</h2>
      <p className={connected ? "text-green-600" : "text-red-600"}>
        {connected ? "Connected to MQTT broker" : "Disconnected"}
      </p>

      {/* Latest Values */}
      {latest && (
        <div className="bg-white p-4 shadow rounded space-y-2">
          <p>
            <strong>Timestamp:</strong>{" "}
            {new Date(latest.timestamp).toLocaleString()}
          </p>
          <p>
            <strong>CPU %:</strong> {latest.cpu_percent}
          </p>
          <p>
            <strong>Memory %:</strong> {latest.mem_percent}
          </p>
          <p>
            <strong>Disk %:</strong> {latest.disk_percent_root}
          </p>
          {/* Optional extra fields */}
          {Object.keys(latest).map((key) => {
            if (
              !["timestamp", "cpu_percent", "mem_percent", "disk_percent_root"].includes(
                key
              )
            ) {
              return (
                <p key={key}>
                  <strong>{key}:</strong> {latest[key]}
                </p>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Raw JSON Messages */}
      <div className="bg-gray-100 p-4 rounded h-96 overflow-auto font-mono text-sm">
        {messages.length > 0 ? (
          messages.map((msg, idx) => <div key={idx}>{msg}</div>)
        ) : (
          <p>Waiting for MQTT messages...</p>
        )}
      </div>
    </div>
  );
};

export default MergedMqttDashboard;
