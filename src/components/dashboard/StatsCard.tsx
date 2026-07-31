import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "green" | "red" | "orange" | "purple";
}

const colorMap = {
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-500" },
  green:  { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  red:    { bg: "bg-red-500/10",    text: "text-red-500" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
};

export function StatsCard({
  title, value, sub, icon: Icon, trend, trendValue, color = "blue",
}: StatsCardProps) {
  const c = colorMap[color];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("rounded-lg p-2", c.bg)}>
          <Icon className={cn("h-4 w-4", c.text)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        {trendValue && (
          <p className={cn(
            "text-xs mt-1 font-medium",
            trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "–"} {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
