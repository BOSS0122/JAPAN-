"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { areaRows, categorySplit, weeklyTrend } from "@/data/analytics";

const AXIS = { fontSize: 12, fill: "#5b5170" };
const GRID = "#ece3f2";
const CATEGORY_COLORS = ["#7c4dff", "#0e9cb8", "#ff7a2f"];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #ece3f2",
  fontSize: 12,
} as const;

export function TrendChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={weeklyTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c4dff" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#7c4dff" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="referralsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff3d71" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ff3d71" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={68} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="views"
          name="Views 閲覧数"
          stroke="#7c4dff"
          strokeWidth={2.5}
          fill="url(#viewsFill)"
        />
        <Area
          type="monotone"
          dataKey="referrals"
          name="Referrals 送客数"
          stroke="#ff3d71"
          strokeWidth={2.5}
          fill="url(#referralsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AreaChartByRegion() {
  return (
    <ResponsiveContainer width="100%" height={480}>
      <BarChart
        data={areaRows}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
      >
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="areaLabel"
          tick={{ fontSize: 11, fill: "#5b5170" }}
          tickLine={false}
          axisLine={false}
          width={140}
          interval={0}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f7f2fb" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="views" name="Views 閲覧数" fill="#7c4dff" radius={[0, 6, 6, 0]} />
        <Bar dataKey="referrals" name="Referrals 送客数" fill="#0e9cb8" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPie() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={categorySplit}
          dataKey="views"
          nameKey="category"
          innerRadius={56}
          outerRadius={96}
          paddingAngle={3}
          stroke="none"
        >
          {categorySplit.map((entry, i) => (
            <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
