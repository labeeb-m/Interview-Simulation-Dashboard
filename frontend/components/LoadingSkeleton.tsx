export function CardSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="card skeleton"
      style={{ height, borderRadius: "var(--radius-xl)" }}
    />
  );
}

export function KPISkeletons() {
  return (
    <div className="kpi-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="kpi-card">
          <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 32, width: "80%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 10, width: "50%" }} />
        </div>
      ))}
    </div>
  );
}
