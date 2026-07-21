"use client";

interface KPICardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  subtext?: string;
  improvementDirection?: "up" | "down";
}

export function KPICard({
  label,
  value,
  delta,
  deltaLabel,
  subtext,
  improvementDirection = "up",
}: KPICardProps) {
  const trend = delta === undefined ? "neutral" : delta > 0 ? "up" : delta < 0 ? "down" : "neutral";
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  let tone = "neutral";
  if (trend !== "neutral") {
    if (improvementDirection === "up") {
      tone = trend === "up" ? "up" : "down";
    } else {
      tone = trend === "down" ? "up" : "down";
    }
  }

  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {delta !== undefined && (
        <p className={`kpi-delta ${tone}`}>
          <span>{arrow}</span>
          <span>{Math.abs(delta).toFixed(1)}% {deltaLabel ?? "vs prev period"}</span>
        </p>
      )}
      {subtext && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
          {subtext}
        </p>
      )}
    </div>
  );
}