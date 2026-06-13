"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Shell } from "@/components/Shell";
import { DayRangePicker } from "@/components/DayRangePicker";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { fetchFlagsSummary, fetchFlagsTrend, FlagTrend } from "@/lib/api";

const TT = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: 12, color: "var(--color-text)",
};

const FLAG_COLORS: Record<string,string> = {
  salary_mismatch:       "var(--chart-5)",
  no_response:           "var(--chart-3)",
  ats_sync_failed:       "var(--chart-2)",
  low_confidence_answer: "var(--chart-1)",
  off_topic:             "var(--chart-4)",
  long_pause:            "var(--chart-6)",
  repeated_question:     "#94a3b8",
};

function pivotTrend(rows: FlagTrend[]) {
  const byDate: Record<string, Record<string,number>> = {};
  const flagSet = new Set<string>();
  for (const r of rows) {
    byDate[r.date] ??= { date: r.date };
    byDate[r.date][r.flag] = r.count;
    flagSet.add(r.flag);
  }
  return { data: Object.values(byDate).sort((a,b)=>a.date.localeCompare(b.date)), flags: [...flagSet] };
}

export default function FlagsPage() {
  const [days, setDays] = useState(14);
  const { data: summary } = useQuery({ queryKey: ["flagSum", days],   queryFn: () => fetchFlagsSummary(days) });
  const { data: trend }   = useQuery({ queryKey: ["flagTrend", days], queryFn: () => fetchFlagsTrend(days) });

  const pivoted = trend ? pivotTrend(trend) : null;

  const severityBadge = (s: string) =>
    s === "high" ? "badge-error" : s === "medium" ? "badge-warning" : "badge-neutral";

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Flags & Errors</h1>
          <p className="page-subtitle">Quality signal degradation over time</p>
        </div>
        <DayRangePicker value={days} onChange={setDays} />
      </div>

      <div className="charts-grid">
        <div className="card span-2">
          <p className="card-title">Flag Trend Over Time</p>
          {!pivoted ? <div style={{height:260}} className="skeleton"/> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={pivoted.data} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize:11, color:"var(--color-text-muted)" }} />
                {pivoted.flags.map((flag) => (
                  <Area key={flag} type="monotone" dataKey={flag} stackId="1"
                    stroke={FLAG_COLORS[flag] ?? "#888"} fill={FLAG_COLORS[flag] ?? "#888"}
                    fillOpacity={0.6} strokeWidth={1.5} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card span-2">
          <p className="card-title">Flag Summary</p>
          {!summary ? <CardSkeleton height={200} /> : (
            <table className="data-table">
              <thead>
                <tr><th>Flag</th><th>Severity</th><th>Count</th><th>Rate</th></tr>
              </thead>
              <tbody>
                {summary.map((f) => (
                  <tr key={f.flag}>
                    <td style={{ color:"var(--color-text)", fontWeight:500 }}>{f.flag.replace(/_/g," ")}</td>
                    <td><span className={`badge ${severityBadge(f.severity)}`}>{f.severity}</span></td>
                    <td>{f.count.toLocaleString()}</td>
                    <td>{(f.rate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Shell>
  );
}
