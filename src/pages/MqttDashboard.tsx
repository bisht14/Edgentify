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

