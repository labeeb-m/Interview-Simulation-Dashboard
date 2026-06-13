"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { Shell } from "@/components/Shell";
import { DayRangePicker } from "@/components/DayRangePicker";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { fetchCostOverTime, fetchCostByVertical } from "@/lib/api";

const TT = {
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: 12, color: "var(--color-text)",
};

export default function CostPage() {
  const [days, setDays] = useState(30);
  const { data: overTime } = useQuery({ queryKey: ["costTime", days], queryFn: () => fetchCostOverTime(days) });
  const { data: byVert }   = useQuery({ queryKey: ["costVert", days], queryFn: () => fetchCostByVertical(days) });

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cost Analysis</h1>
          <p className="page-subtitle">Token spend and per-interview costs over time</p>
        </div>
        <DayRangePicker value={days} onChange={setDays} />
      </div>

      <div className="charts-grid">
        <div className="card span-2">
          <p className="card-title">Daily Cost + Interview Volume</p>
          {!overTime ? <div style={{height:260}} className="skeleton"/> : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={overTime} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={(v)=>`$${v.toFixed(3)}`}
                  tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} axisLine={false} width={60} />
                <YAxis yAxisId="right" orientation="right"
                  tick={{ fontSize:11, fill:"var(--color-text-faint)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TT}
                  formatter={(v:number, name:string) => name === "avg_cost_usd" ? [`$${v.toFixed(4)}`, "Avg Cost"] : [v, "Interviews"]} />
                <Legend wrapperStyle={{ fontSize:12, color:"var(--color-text-muted)" }} />
                <Bar yAxisId="right" dataKey="interview_count" name="Interviews"
                  fill="var(--color-surface-offset)" radius={[2,2,0,0]} />
                <Line yAxisId="left" type="monotone" dataKey="avg_cost_usd" name="avg_cost_usd"
                  stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{r:4}} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card span-2">
          <p className="card-title">Cost by Vertical</p>
          {!byVert ? <CardSkeleton height={200} /> : (
            <div style={{ overflowX:"auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Vertical</th><th>Avg Cost</th><th>Total Spend</th></tr>
                </thead>
                <tbody>
                  {byVert.map((v) => (
                    <tr key={v.vertical}>
                      <td><span className="badge badge-primary">{v.vertical}</span></td>
                      <td>${v.avg_cost_usd.toFixed(4)}</td>
                      <td>${v.total_cost_usd.toFixed(2)}</td>
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
