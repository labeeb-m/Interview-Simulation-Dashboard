"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Shell } from "@/components/Shell";
import { DayRangePicker } from "@/components/DayRangePicker";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { fetchMatchQualityByVertical } from "@/lib/api";

const TT = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: 12, color: "var(--color-text)",
};

export default function QualityPage() {
  const [days, setDays] = useState(30);
  const { data } = useQuery({ queryKey: ["matchQuality", days], queryFn: () => fetchMatchQualityByVertical(days) });

  const chartData = data?.map((d) => ({
    ...d,
    match_pct:    +(d.avg_match_score   * 100).toFixed(1),
    shortlist_pct:+(d.shortlist_rate    * 100).toFixed(1),
    rejection_pct:+(d.rejection_rate    * 100).toFixed(1),
  }));

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Match Quality</h1>
          <p className="page-subtitle">Candidate–job fit scores across verticals</p>
        </div>
        <DayRangePicker value={days} onChange={setDays} />
      </div>

      <div className="charts-grid">
        <div className="card span-2">
          <p className="card-title">Match Score + Shortlist vs Rejection Rate by Vertical</p>
          {!chartData ? <div style={{height:280}} className="skeleton"/> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="vertical" tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} />
                <YAxis tickFormatter={(v)=>`${v}%`} tick={{ fontSize:11, fill:"var(--color-text-faint)" }}
                  tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={TT} formatter={(v) => [`${Number(v)}%`, ""]} />
                <Legend wrapperStyle={{ fontSize:12, color:"var(--color-text-muted)" }} />
                <Bar dataKey="match_pct"     name="Match Score"    fill="var(--chart-1)" radius={[4,4,0,0]} />
                <Bar dataKey="shortlist_pct" name="Shortlist Rate" fill="var(--chart-4)" radius={[4,4,0,0]} />
                <Bar dataKey="rejection_pct" name="Rejection Rate" fill="var(--chart-5)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card span-2">
          <p className="card-title">Vertical Breakdown</p>
          {!data ? <CardSkeleton height={200}/> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vertical</th><th>Interviews</th>
                  <th>Avg Match</th><th>Shortlist</th><th>Rejection</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.vertical}>
                    <td><span className="badge badge-primary">{d.vertical}</span></td>
                    <td>{d.interview_count.toLocaleString()}</td>
                    <td style={{ color: d.avg_match_score >= 0.65 ? "var(--color-success)" : d.avg_match_score < 0.4 ? "var(--color-error)" : "inherit" }}>
                      {(d.avg_match_score * 100).toFixed(1)}%
                    </td>
                    <td style={{ color:"var(--color-success)" }}>{(d.shortlist_rate * 100).toFixed(1)}%</td>
                    <td style={{ color:"var(--color-error)"   }}>{(d.rejection_rate * 100).toFixed(1)}%</td>
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
