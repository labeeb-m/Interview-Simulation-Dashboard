"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Shell } from "@/components/Shell";
import { KPICard } from "@/components/KPICard";
import { DayRangePicker } from "@/components/DayRangePicker";
import { KPISkeletons } from "@/components/LoadingSkeleton";
import {
  fetchKPIs, fetchCostOverTime, fetchMatchQualityByVertical,
  fetchFlagsSummary,
} from "@/lib/api";

const TOOLTIP_STYLE = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: 12,
  color: "var(--color-text)",
};

export default function OverviewPage() {
  const [days, setDays] = useState(7);

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["kpis", days],
    queryFn: () => fetchKPIs(days),
  });

  const { data: costData } = useQuery({
    queryKey: ["costOverTime", days],
    queryFn: () => fetchCostOverTime(days),
  });

  const { data: qualityData } = useQuery({
    queryKey: ["matchQuality", days],
    queryFn: () => fetchMatchQualityByVertical(days),
  });

  const { data: flagsData } = useQuery({
    queryKey: ["flagsSummary", days],
    queryFn: () => fetchFlagsSummary(days),
  });
  
  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Sarah AI recruiter health at a glance</p>
        </div>
        <DayRangePicker value={days} onChange={setDays} />
      </div>

      {/* KPIs */}
      {kpisLoading || !kpis ? (
        <KPISkeletons />
      ) : (
        <div className="kpi-grid" style={{ marginBottom: "var(--space-6)" }}>
          <KPICard
            label="Total Interviews"
            value={kpis.total_interviews.toLocaleString()}
            delta={kpis.total_interviews_delta}
          />
          <KPICard
            label="Avg Latency"
            value={`${(kpis.avg_latency_ms / 1000).toFixed(1)}s`}
            delta={kpis.avg_latency_delta}
            deltaLabel="vs prev (lower is better)"
          />
          <KPICard
            label="Avg Cost / Interview"
            value={`$${kpis.avg_cost_usd.toFixed(4)}`}
            delta={kpis.avg_cost_delta}
            deltaLabel="vs prev (lower is better)"
          />
          <KPICard
            label="Avg Match Score"
            value={`${(kpis.avg_match_score * 100).toFixed(1)}%`}
            delta={kpis.avg_match_score_delta}
          />
          <KPICard
            label="Flag Rate"
            value={`${(kpis.flag_rate * 100).toFixed(1)}%`}
            delta={kpis.flag_rate_delta}
            deltaLabel="vs prev (lower is better)"
          />
          <KPICard
            label="Shortlist Rate"
            value={`${(kpis.shortlist_rate * 100).toFixed(1)}%`}
            subtext="Candidates advancing to human review"
          />
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        {/* Cost over time */}
        <div className="card span-2">
          <p className="card-title">Cost per Interview — Over Time</p>
          {!costData ? (
            <div style={{ height: 220 }} className="skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={costData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-faint)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-text-faint)" }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${v.toFixed(4)}`} width={70} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(4)}`, "Avg Cost"]} />
                <Line type="monotone" dataKey="avg_cost_usd" stroke="var(--chart-1)"
                  strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Match quality by vertical */}
        <div className="card">
          <p className="card-title">Match Score by Vertical</p>
          {!qualityData ? (
            <div style={{ height: 220 }} className="skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={qualityData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="vertical" tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} tickLine={false} />
                <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontSize: 11, fill: "var(--color-text-faint)" }} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, "Avg Match Score"]} />
                <Bar dataKey="avg_match_score" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top flags */}
        <div className="card">
          <p className="card-title">Top Flag Types</p>
          {!flagsData ? (
            <div style={{ height: 220 }} className="skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={flagsData.slice(0, 6).map((f) => ({ ...f, rate_pct: +(f.rate * 100).toFixed(1) }))}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-faint)" }} tickLine={false}
                  tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="flag" type="category" tick={{ fontSize: 10, fill: "var(--color-text-faint)" }}
                  tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Rate"]} />
                <Bar dataKey="rate_pct" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Shell>
  );
}
