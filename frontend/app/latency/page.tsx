"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import { Shell } from "@/components/Shell";
import { DayRangePicker } from "@/components/DayRangePicker";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { fetchLatencyByBot, fetchLatencyByVertical, fetchLatencyDistribution } from "@/lib/api";

const TT = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: 12,
  color: "var(--color-text)",
};

function msToS(ms: number) { return (ms / 1000).toFixed(1) + "s"; }

export default function LatencyPage() {
  const [days, setDays] = useState(7);
  const { data: byBot }   = useQuery({ queryKey: ["latByBot", days],   queryFn: () => fetchLatencyByBot(days) });
  const { data: byVert }  = useQuery({ queryKey: ["latByVert", days],  queryFn: () => fetchLatencyByVertical(days) });
  const { data: distrib } = useQuery({ queryKey: ["latDistrib", days], queryFn: () => fetchLatencyDistribution(days) });

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Latency</h1>
          <p className="page-subtitle">Interview duration distribution across bots and verticals</p>
        </div>
        <DayRangePicker value={days} onChange={setDays} />
      </div>

      <div className="charts-grid">
        {/* Distribution */}
        <div className="card">
          <p className="card-title">Duration Distribution</p>
          {!distrib ? <div style={{height:220}} className="skeleton"/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distrib} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="bucket" tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By vertical */}
        <div className="card">
          <p className="card-title">Avg Latency by Vertical</p>
          {!byVert ? <div style={{height:220}} className="skeleton"/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byVert} margin={{ top:4, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="vertical" tick={{ fontSize:10, fill:"var(--color-text-faint)" }} tickLine={false} />
                <YAxis tickFormatter={msToS} tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} axisLine={false} width={44} />
                <Tooltip contentStyle={TT} formatter={(v:number) => [msToS(v), ""]} />
                <Bar dataKey="avg_ms" name="Avg" fill="var(--chart-2)" radius={[4,4,0,0]} />
                <Bar dataKey="p95_ms" name="p95" fill="var(--chart-3)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Per-bot table */}
        <div className="card span-2">
          <p className="card-title">Latency per Bot</p>
          {!byBot ? <CardSkeleton height={200} /> : (
            <div style={{ overflowX:"auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bot</th><th>Vertical</th>
                    <th>Avg</th><th>p50</th><th>p95</th><th>p99</th>
                  </tr>
                </thead>
                <tbody>
                  {byBot.map((b) => (
                    <tr key={b.bot_name}>
                      <td style={{ color:"var(--color-text)", fontWeight:500 }}>{b.bot_name}</td>
                      <td><span className="badge badge-primary">{b.vertical}</span></td>
                      <td>{msToS(b.avg_ms)}</td>
                      <td>{msToS(b.p50_ms)}</td>
                      <td style={{ color: b.p95_ms > 120000 ? "var(--color-error)" : "inherit" }}>{msToS(b.p95_ms)}</td>
                      <td style={{ color: b.p99_ms > 240000 ? "var(--color-error)" : "inherit" }}>{msToS(b.p99_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
