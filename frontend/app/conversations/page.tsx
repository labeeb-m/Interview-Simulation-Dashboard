"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { DayRangePicker } from "@/components/DayRangePicker";
import { CardSkeleton } from "@/components/LoadingSkeleton";
import { fetchBadConversations, BadConversation } from "@/lib/api";

const VERTICALS = ["", "IT", "healthcare", "sales", "engineering", "light_industrial", "early_careers"];

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  const cls =
    outcome === "shortlisted" ? "badge-success" :
    outcome === "rejected"    ? "badge-error"   :
    outcome === "no_show"     ? "badge-warning"  : "badge-neutral";
  return <span className={`badge ${cls}`}>{outcome ?? "pending"}</span>;
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: "var(--color-text-faint)" }}>—</span>;
  const color = score >= 0.65 ? "var(--color-success)" : score < 0.35 ? "var(--color-error)" : "var(--color-warning)";
  return <span style={{ color, fontWeight: 600 }}>{(score * 100).toFixed(0)}%</span>;
}

function ExpandedRow({ convo }: { convo: BadConversation }) {
  return (
    <tr>
      <td colSpan={8} className="transcript-panel">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--space-6)" }}>
          <div>
            <p style={{ fontWeight:600, color:"var(--color-text-muted)", marginBottom:"var(--space-2)" }}>Transcript Snippet</p>
            <p>{convo.transcript_snippet ?? "No transcript available."}</p>
          </div>
          <div>
            <p style={{ fontWeight:600, color:"var(--color-text-muted)", marginBottom:"var(--space-2)" }}>Flags</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"var(--space-2)" }}>
              {convo.flags.length > 0
                ? convo.flags.map((f) => <span key={f} className="badge badge-error">{f.replace(/_/g," ")}</span>)
                : <span style={{ color:"var(--color-text-faint)" }}>No flags</span>}
            </div>
            <p style={{ marginTop:"var(--space-3)" }}>
              <span style={{ color:"var(--color-text-faint)" }}>Tokens: </span>
              {convo.tokens_used?.toLocaleString() ?? "—"} &nbsp;·&nbsp;
              <span style={{ color:"var(--color-text-faint)" }}>Cost: </span>
              {convo.cost_usd != null ? `$${convo.cost_usd.toFixed(4)}` : "—"}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function ConversationsPage() {
  const [days, setDays]       = useState(7);
  const [page, setPage]       = useState(1);
  const [vertical, setVert]   = useState("");
  const [maxScore, setMax]    = useState(0.5);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["badConvos", days, page, vertical, maxScore],
    queryFn: () => fetchBadConversations(days, page, vertical || undefined, maxScore),
  });

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bad Conversations</h1>
          <p className="page-subtitle">Low-scoring or flagged interviews needing review</p>
        </div>
        <DayRangePicker value={days} onChange={(v) => { setDays(v); setPage(1); }} />
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"var(--space-3)", marginBottom:"var(--space-5)", flexWrap:"wrap", alignItems:"center" }}>
        <select
          value={vertical}
          onChange={(e) => { setVert(e.target.value); setPage(1); }}
          style={{
            background:"var(--color-surface-2)", border:"1px solid var(--color-border)",
            color:"var(--color-text)", borderRadius:"var(--radius-md)",
            padding:"var(--space-2) var(--space-3)", fontSize:"var(--text-xs)", cursor:"pointer",
          }}
        >
          {VERTICALS.map((v) => <option key={v} value={v}>{v || "All Verticals"}</option>)}
        </select>

        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
          <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-muted)" }}>Max match score:</span>
          {[0.3, 0.4, 0.5, 0.6].map((s) => (
            <button
              key={s}
              onClick={() => { setMax(s); setPage(1); }}
              style={{
                padding:"2px 8px", borderRadius:"var(--radius-md)", fontSize:11, fontWeight:600,
                background: maxScore === s ? "var(--color-surface-offset)" : "transparent",
                color: maxScore === s ? "var(--color-primary)" : "var(--color-text-muted)",
                border:"1px solid var(--color-border)",
              }}
            >{(s*100).toFixed(0)}%</button>
          ))}
        </div>

        {data && (
          <span style={{ marginLeft:"auto", fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
            {data.total.toLocaleString()} results
          </span>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        {isLoading ? <CardSkeleton height={400}/> : (
          <div style={{ overflowX:"auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Candidate</th><th>Job</th><th>Vertical</th>
                  <th>Bot</th><th>Score</th><th>Outcome</th><th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((c, key) => (
                  <>
                    <tr
                      key={c.id}
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                      style={{ cursor:"pointer" }}
                    >
                      <td style={{ width:24, color:"var(--color-text-faint)", fontSize:10 }}>
                        {expanded === c.id ? "▼" : "▶"}
                      </td>
                      <td style={{ color:"var(--color-text)", fontWeight:500 }}>{c.candidate_id}</td>
                      <td>{c.job_title}</td>
                      <td><span className="badge badge-primary">{c.vertical}</span></td>
                      <td style={{ color:"var(--color-text-muted)" }}>{c.bot_name}</td>
                      <td><ScoreCell score={c.match_score}/></td>
                      <td><OutcomeBadge outcome={c.outcome}/></td>
                      <td>
                        {c.flags.length > 0
                          ? <span className="badge badge-error">{c.flags.length} flag{c.flags.length>1?"s":""}</span>
                          : <span style={{ color:"var(--color-text-faint)" }}>—</span>}
                      </td>
                    </tr>
                    {expanded === c.id && <ExpandedRow key={`exp-${c.id}`} convo={c}/>}
                  </>
                ))}
                {data?.items.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign:"center", padding:"var(--space-12)", color:"var(--color-text-faint)" }}>
                    No flagged conversations found for the selected filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"center", gap:"var(--space-2)", marginTop:"var(--space-4)" }}>
          <button
            onClick={() => setPage((p)=>Math.max(1,p-1))}
            disabled={page === 1}
            style={{
              padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-md)",
              background:"var(--color-surface-2)", border:"1px solid var(--color-border)",
              color: page===1 ? "var(--color-text-faint)" : "var(--color-text)",
              fontSize:"var(--text-xs)", fontWeight:600,
            }}
          >← Prev</button>
          <span style={{ display:"flex", alignItems:"center", fontSize:"var(--text-xs)", color:"var(--color-text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p)=>Math.min(totalPages,p+1))}
            disabled={page === totalPages}
            style={{
              padding:"var(--space-2) var(--space-4)", borderRadius:"var(--radius-md)",
              background:"var(--color-surface-2)", border:"1px solid var(--color-border)",
              color: page===totalPages ? "var(--color-text-faint)" : "var(--color-text)",
              fontSize:"var(--text-xs)", fontWeight:600,
            }}
          >Next →</button>
        </div>
      )}
    </Shell>
  );
}
