
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const device = "laptop-core-01";
const S3_API_URL = `https://68c3yg3vj5.execute-api.us-east-1.amazonaws.com/prod/s3_logs?device_id=${device}`;

const S3Logs = () => {
  const [s3Logs, setS3Logs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchS3Logs = async () => {
      try {
        setError(null);
        const res = await fetch(S3_API_URL, { method: "GET", headers: { "Content-Type": "application/json" } });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const parsed = typeof data.body === "string" ? JSON.parse(data.body) : data;

        const logs =
          parsed.s3_logs?.map((log: any) => {
            try {
              const content = JSON.parse(log.content);
              return { ...content, last_modified: log.last_modified };
            } catch {
              return null;
            }
          }).filter((log: any) => log !== null) ?? [];

        logs.sort((a: any, b: any) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());
        setS3Logs(logs);
      } catch (err: any) {
        console.error("❌ Error fetching S3 logs:", err);
        setError("Failed to fetch S3 logs.");
      } finally {
        setLoading(false);
      }
    };
    fetchS3Logs();
  }, []);

  // Compute averages for summary
  const avgCpu = s3Logs.length ? (s3Logs.reduce((sum, log) => sum + log.cpu_percent, 0) / s3Logs.length).toFixed(1) : "-";
  const avgMem = s3Logs.length ? (s3Logs.reduce((sum, log) => sum + log.mem_percent, 0) / s3Logs.length).toFixed(1) : "-";
  const avgDisk = s3Logs.length ? (s3Logs.reduce((sum, log) => sum + log.disk_percent_root, 0) / s3Logs.length).toFixed(1) : "-";

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold mb-4">S3 Device Dashboard - {device}</h2>

      {loading && <p className="text-gray-600">Loading logs...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && s3Logs.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-white shadow rounded">
              <h3 className="font-semibold text-gray-700">Avg CPU %</h3>
              <p className="text-2xl font-bold">{avgCpu}</p>
            </div>
            <div className="p-4 bg-white shadow rounded">
              <h3 className="font-semibold text-gray-700">Avg Memory %</h3>
              <p className="text-2xl font-bold">{avgMem}</p>
            </div>
            <div className="p-4 bg-white shadow rounded">
              <h3 className="font-semibold text-gray-700">Avg Disk %</h3>
              <p className="text-2xl font-bold">{avgDisk}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {["cpu_percent", "mem_percent", "disk_percent_root"].map((key) => (
              <div key={key} className="p-4 bg-white shadow rounded">
                <h3 className="font-semibold text-gray-700 mb-2">
                  {key === "cpu_percent" ? "CPU %" : key === "mem_percent" ? "Memory %" : "Disk %"}
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[...s3Logs].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="last_modified" tickFormatter={(val) => new Date(val).toLocaleTimeString()} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip labelFormatter={(val) => new Date(val).toLocaleString()} />
                    <Legend />
                    <Line type="monotone" dataKey={key} stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="table-auto w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Uploaded At</th>
                  <th className="p-2 border">CPU %</th>
                  <th className="p-2 border">Memory %</th>
                  <th className="p-2 border">Disk %</th>
                </tr>
              </thead>
              <tbody>
                {s3Logs.map((log, index) => (
                  <tr key={index}>
                    <td className="p-2 border">{new Date(log.last_modified).toLocaleString()}</td>
                    <td className="p-2 border">{log.cpu_percent ?? "-"}</td>
                    <td className="p-2 border">{log.mem_percent ?? "-"}</td>
                    <td className="p-2 border">{log.disk_percent_root ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default S3Logs;
