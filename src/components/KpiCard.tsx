import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: number;
  unit?: string;
  description: string;
}

export const KpiCard = ({ title, value, change, unit, description }: KpiCardProps) => {
  const getTrendIcon = () => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (change > 0) return "bg-success text-success-foreground";
    if (change < 0) return "bg-destructive text-destructive-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Badge variant="outline" className={`${getTrendColor()} border-0`}>
          {getTrendIcon()}
          {Math.abs(change)}%
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};