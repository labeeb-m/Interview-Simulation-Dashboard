from fastapi import APIRouter, Depends, Query
from app.db.connection import get_pool
from app.models import KPIResponse
import asyncpg

router = APIRouter(prefix="/api/kpis", tags=["kpis"])

# async def _fetch_period_stats(conn: asyncpg.Connection, days: int, offset_days: int = 0):
#     row = await conn.fetchrow("""
#         SELECT
#             COUNT(*)                        AS total_interviews,
#             AVG(duration_ms)                AS avg_latency_ms,
#             AVG(cost_usd)                   AS avg_cost_usd,
#             AVG(match_score)                AS avg_match_score,
#             COUNT(*) FILTER (WHERE outcome = 'shortlisted')::float / NULLIF(COUNT(*), 0) AS shortlist_rate
#         FROM interviews
#         WHERE started_at >= NOW() - INTERVAL '1 day' * ($1 + $2)
#           AND started_at <  NOW() - INTERVAL '1 day' * $2
#     """, days, offset_days)
#     return row

# async def _fetch_flag_rate(conn: asyncpg.Connection, days: int, offset_days: int = 0):
#     row = await conn.fetchrow("""
#         SELECT
#             COUNT(DISTINCT f.interview_id)::float / NULLIF(COUNT(DISTINCT i.id), 0) AS flag_rate
#         FROM interviews i
#         LEFT JOIN interview_flags f ON f.interview_id = i.id
#         WHERE i.started_at >= NOW() - INTERVAL '1 day' * ($1 + $2)
#           AND i.started_at <  NOW() - INTERVAL '1 day' * $2
#     """, days, offset_days)
#     return row

async def _fetch_period_stats(conn: asyncpg.Connection, days: int, offset_days: int = 0):
    row = await conn.fetchrow("""
        SELECT
            COUNT(*)                        AS total_interviews,
            AVG(duration_ms)                AS avg_latency_ms,
            AVG(cost_usd)                   AS avg_cost_usd,
            AVG(match_score)                AS avg_match_score,
            COUNT(*) FILTER (WHERE outcome = 'shortlisted')::float / NULLIF(COUNT(*), 0) AS shortlist_rate
        FROM interviews
        WHERE started_at >= NOW() - ($1::int * INTERVAL '1 day') - ($2::int * INTERVAL '1 day')
          AND started_at <  NOW() - ($2::int * INTERVAL '1 day')
    """, days, offset_days)
    return row

async def _fetch_flag_rate(conn: asyncpg.Connection, days: int, offset_days: int = 0):
    row = await conn.fetchrow("""
        SELECT
            COUNT(DISTINCT f.interview_id)::float / NULLIF(COUNT(DISTINCT i.id), 0) AS flag_rate
        FROM interviews i
        LEFT JOIN interview_flags f ON f.interview_id = i.id
        WHERE i.started_at >= NOW() - ($1::int * INTERVAL '1 day') - ($2::int * INTERVAL '1 day')
          AND i.started_at <  NOW() - ($2::int * INTERVAL '1 day')
    """, days, offset_days)
    return row

def _pct_delta(current, previous):
    if not previous or previous == 0:
        return 0.0
    return round((current - previous) / previous * 100, 1)

@router.get("", response_model=KPIResponse)
async def get_kpis(
    days: int = Query(7, ge=1, le=90),
    pool: asyncpg.Pool = Depends(get_pool)
):
    async with pool.acquire() as conn:
        cur = await _fetch_period_stats(conn, days, 0)
        prev = await _fetch_period_stats(conn, days, days)
        cur_flags = await _fetch_flag_rate(conn, days, 0)
        prev_flags = await _fetch_flag_rate(conn, days, days)

    return KPIResponse(
        total_interviews=cur["total_interviews"] or 0,
        total_interviews_delta=_pct_delta(cur["total_interviews"], prev["total_interviews"]),
        avg_latency_ms=round(float(cur["avg_latency_ms"] or 0), 1),
        avg_latency_delta=_pct_delta(cur["avg_latency_ms"], prev["avg_latency_ms"]),
        avg_cost_usd=round(float(cur["avg_cost_usd"] or 0), 4),
        avg_cost_delta=_pct_delta(cur["avg_cost_usd"], prev["avg_cost_usd"]),
        avg_match_score=round(float(cur["avg_match_score"] or 0), 3),
        avg_match_score_delta=_pct_delta(cur["avg_match_score"], prev["avg_match_score"]),
        flag_rate=round(float(cur_flags["flag_rate"] or 0), 3),
        flag_rate_delta=_pct_delta(cur_flags["flag_rate"], prev_flags["flag_rate"]),
        shortlist_rate=round(float(cur["shortlist_rate"] or 0), 3),
    )
