import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function Shell({ children }: { children: React.ReactNode }) {
const [warming, setWarming] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWarming(true), 3000);
    api.get("/health").finally(() => {
      clearTimeout(timer);
      setWarming(false);
    });
  }, []);
  return (
    <div className="app-shell">
      <Topbar />
      <Sidebar />
      {warming && (
        <div style={{
          background: "var(--color-warning-dim)",
          color: "var(--color-warning)",
          textAlign: "center",
          padding: "var(--space-2)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
        }}>
          ⏳ Backend spinning up on free tier — ready in ~60s
        </div>
      )}
      <main className="main-content">{children}</main>
    </div>
  );
}
