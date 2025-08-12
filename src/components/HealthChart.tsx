import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";

interface HealthChartProps {
  title: string;
  data: Array<{
    time: string;
    value: number;
    threshold?: number;
  }>;
  type?: "line" | "area";
  color?: string;
  unit?: string;
}

export const HealthChart = ({ 
  title, 
  data, 
  type = "line", 
  color = "hsl(var(--chart-1))",
  unit = "" 
}: HealthChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {type === "area" ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickMargin={10}
                label={{ value: unit, angle: -90, position: 'insideLeft' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {data[0]?.threshold && (
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
              )}
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickMargin={10}
                label={{ value: unit, angle: -90, position: 'insideLeft' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
              {data[0]?.threshold && (
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                />
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};