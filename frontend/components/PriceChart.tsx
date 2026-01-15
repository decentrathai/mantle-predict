"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface PriceChartProps {
  yesPrice: number;
  noPrice: number;
}

export function PriceChart({ yesPrice, noPrice }: PriceChartProps) {
  // Generate mock historical data
  // In production, this would come from contract events
  const generateMockData = () => {
    const data = [];
    const now = Date.now();
    const hourInMs = 3600000;

    for (let i = 24; i >= 0; i--) {
      // Generate realistic price movements
      const randomYes = yesPrice + (Math.random() - 0.5) * 20;
      const boundedYes = Math.max(10, Math.min(90, randomYes));

      data.push({
        time: new Date(now - i * hourInMs).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        yes: Math.round(boundedYes),
        no: Math.round(100 - boundedYes),
      });
    }

    // Ensure last point matches current prices
    data[data.length - 1] = {
      time: "Now",
      yes: yesPrice,
      no: noPrice,
    };

    return data;
  };

  const data = generateMockData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <p className="text-sm text-yes">Yes: {payload[0].value}%</p>
          <p className="text-sm text-no">No: {payload[1].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="yes"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#22c55e" }}
          />
          <Line
            type="monotone"
            dataKey="no"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#ef4444" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
