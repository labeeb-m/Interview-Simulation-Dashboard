"use client";

interface KPICardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  subtext?: string;
}

export function KPICard({ label, value, delta, deltaLabel, subtext }: KPICardProps) {
  const dir = delta === undefined ? "neutral" : delta > 0 ? "up" : delta < 0 ? "down" : "neutral";
  const arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "→";

  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {delta !== undefined && (
        <p className={`kpi-delta ${dir}`}>
          <span>{arrow}</span>
          <span>{Math.abs(delta).toFixed(1)}% {deltaLabel ?? "vs prev period"}</span>
        </p>
      )}
      {subtext && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>{subtext}</p>}
    </div>
  );
}
