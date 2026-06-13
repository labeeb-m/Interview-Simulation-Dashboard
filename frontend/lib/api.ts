import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({ baseURL: BASE });

// ── Types ──────────────────────────────────────────────────────────────────

export interface KPIResponse {
  total_interviews: number;
  total_interviews_delta: number;
  avg_latency_ms: number;
  avg_latency_delta: number;
  avg_cost_usd: number;
  avg_cost_delta: number;
  avg_match_score: number;
  avg_match_score_delta: number;
  flag_rate: number;
  flag_rate_delta: number;
  shortlist_rate: number;
}

export interface LatencyByBot {
  bot_name: string;
  vertical: string;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

export interface LatencyByVertical {
  vertical: string;
  avg_ms: number;
  p95_ms: number;
}

export interface LatencyBucket {
  bucket: string;
  count: number;
}

export interface CostOverTime {
  date: string;
  avg_cost_usd: number;
  total_cost_usd: number;
  interview_count: number;
}

export interface CostByVertical {
  vertical: string;
  avg_cost_usd: number;
  total_cost_usd: number;
}

export interface FlagSummary {
  flag: string;
  count: number;
  severity: string;
  rate: number;
}

export interface FlagTrend {
  date: string;
  flag: string;
  count: number;
}

export interface MatchQualityByVertical {
  vertical: string;
  avg_match_score: number;
  shortlist_rate: number;
  rejection_rate: number;
  interview_count: number;
}

export interface BadConversation {
  id: string;
  candidate_id: string;
  job_title: string;
  vertical: string;
  bot_name: string;
  started_at: string;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
  match_score: number | null;
  outcome: string | null;
  transcript_snippet: string | null;
  flags: string[];
}

export interface BadConversationsResponse {
  items: BadConversation[];
  total: number;
  page: number;
  page_size: number;
}

// ── Fetchers ───────────────────────────────────────────────────────────────

export const fetchKPIs = (days: number) =>
  api.get<KPIResponse>(`/api/kpis?days=${days}`).then((r) => r.data);

export const fetchLatencyByBot = (days: number) =>
  api.get<LatencyByBot[]>(`/api/latency/by-bot?days=${days}`).then((r) => r.data);

export const fetchLatencyByVertical = (days: number) =>
  api.get<LatencyByVertical[]>(`/api/latency/by-vertical?days=${days}`).then((r) => r.data);

export const fetchLatencyDistribution = (days: number) =>
  api.get<LatencyBucket[]>(`/api/latency/distribution?days=${days}`).then((r) => r.data);

export const fetchCostOverTime = (days: number) =>
  api.get<CostOverTime[]>(`/api/cost/over-time?days=${days}`).then((r) => r.data);

export const fetchCostByVertical = (days: number) =>
  api.get<CostByVertical[]>(`/api/cost/by-vertical?days=${days}`).then((r) => r.data);

export const fetchFlagsSummary = (days: number) =>
  api.get<FlagSummary[]>(`/api/flags/summary?days=${days}`).then((r) => r.data);

export const fetchFlagsTrend = (days: number) =>
  api.get<FlagTrend[]>(`/api/flags/trend?days=${days}`).then((r) => r.data);

export const fetchMatchQualityByVertical = (days: number) =>
  api.get<MatchQualityByVertical[]>(`/api/match-quality/by-vertical?days=${days}`).then((r) => r.data);

export const fetchBadConversations = (
  days: number,
  page: number,
  vertical?: string,
  maxMatchScore = 0.5
) =>
  api
    .get<BadConversationsResponse>(`/api/conversations/bad`, {
      params: { days, page, page_size: 20, vertical, max_match_score: maxMatchScore },
    })
    .then((r) => r.data);
