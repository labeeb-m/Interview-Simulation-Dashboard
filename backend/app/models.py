from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ── Response Models ──────────────────────────────────────────────────────────

class KPIResponse(BaseModel):
    total_interviews: int
    total_interviews_delta: float       # % change vs previous period
    avg_latency_ms: float
    avg_latency_delta: float
    avg_cost_usd: float
    avg_cost_delta: float
    avg_match_score: float
    avg_match_score_delta: float
    flag_rate: float                    # 0.0–1.0
    flag_rate_delta: float
    shortlist_rate: float

class LatencyBucket(BaseModel):
    bucket: str                         # e.g. "0-2s", "2-4s"
    count: int

class LatencyByBot(BaseModel):
    bot_name: str
    vertical: str
    avg_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float

class LatencyByVertical(BaseModel):
    vertical: str
    avg_ms: float
    p95_ms: float

class CostOverTime(BaseModel):
    date: str
    avg_cost_usd: float
    total_cost_usd: float
    interview_count: int

class CostByVertical(BaseModel):
    vertical: str
    avg_cost_usd: float
    total_cost_usd: float

class FlagTrend(BaseModel):
    date: str
    flag: str
    count: int

class FlagSummary(BaseModel):
    flag: str
    count: int
    severity: str
    rate: float                         # as fraction of total interviews

class MatchQualityByVertical(BaseModel):
    vertical: str
    avg_match_score: float
    shortlist_rate: float
    rejection_rate: float
    interview_count: int

class BadConversation(BaseModel):
    id: str
    candidate_id: str
    job_title: str
    vertical: str
    bot_name: str
    started_at: datetime
    duration_ms: Optional[int]
    tokens_used: Optional[int]
    cost_usd: Optional[float]
    match_score: Optional[float]
    outcome: Optional[str]
    transcript_snippet: Optional[str]
    flags: List[str]

class BadConversationsResponse(BaseModel):
    items: List[BadConversation]
    total: int
    page: int
    page_size: int

class IntervalMetric(BaseModel):
    timestamp: str
    interview_count: int
    avg_latency_ms: float
    avg_match_score: float
    flag_count: int
