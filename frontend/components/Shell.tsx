"use client";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type BackendStatus = "checking" | "up" | "warming";

export function Shell({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let warmingTimer: ReturnType<typeof setTimeout>;
    let pollInterval: ReturnType<typeof setInterval>;

    const check = async () => {
      try {
        await api.get("/health", { timeout: 3000 });
        clearTimeout(warmingTimer);
        setStatus("up"); // banner disappears, poll keeps running silently
      } catch {
        setStatus("warming");
      }
    };

    // Only show "warming" if backend hasn't responded in 2 seconds
    warmingTimer = setTimeout(() => {
      setStatus("warming");
    }, 2000);

    check();

    pollInterval = setInterval(check, 5000);

    return () => {
      clearTimeout(warmingTimer);
      clearInterval(pollInterval);
    };
  }, []);

    return (
    <div>
      {status === "warming" && (
        <div
          style={{
            // position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            // zIndex: 9999,
            background: "#92400e",
            color: "#fef3c7",
            textAlign: "center",
            padding: "10px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          ⏳ Backend is starting up on free tier, this takes ~60 seconds. Hang tight, the page will load automatically.
        </div>
      )}
      {status === "checking" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#2e0404",
            color: "#fef3c7",
            textAlign: "center",
            padding: "10px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Connecting to backend...
        </div>
      )}
        <div className="app-shell">
          <Topbar />
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
    </div>
  );
}