export function Topbar() {
  return (
    <header className="topbar">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginRight: "var(--space-4)" }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Asendia Monitor">
          <rect width="28" height="28" rx="7" fill="var(--color-primary)" fillOpacity="0.15"/>
          <circle cx="14" cy="14" r="5" stroke="var(--color-primary)" strokeWidth="2" fill="none"/>
          <circle cx="14" cy="14" r="2" fill="var(--color-primary)"/>
          <line x1="14" y1="4" x2="14" y2="8"  stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="14" y1="20" x2="14" y2="24" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="4"  y1="14" x2="8"  y2="14" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="20" y1="14" x2="24" y2="14" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", letterSpacing: "-0.01em" }}>
          Asendia <span style={{ color: "var(--color-primary)" }}>Monitor</span>
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--color-success)",
          boxShadow: "0 0 6px var(--color-success)",
          display: "inline-block"
        }} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Live</span>
      </div>

      <div style={{
        marginLeft: "var(--space-4)",
        padding: "var(--space-1) var(--space-3)",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        fontSize: "var(--text-xs)",
        color: "var(--color-text-muted)"
      }}>
        Sarah AI · 8 bots active
      </div>
    </header>
  );
}
