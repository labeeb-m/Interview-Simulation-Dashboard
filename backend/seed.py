"""
seed.py — Generates and inserts 2,000+ synthetic interview logs
shaped like Asendia AI's actual data flow.

Usage:
    pip install asyncpg python-dotenv
    python seed.py
"""

import asyncio
import asyncpg
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/asendia_monitor")

# ── Seed Data ──────────────────────────────────────────────────────────────

VERTICALS = ["IT", "healthcare", "sales", "engineering", "light_industrial", "early_careers"]

BOTS = [
    ("sarah-v1",    "Sarah v1",         "IT"),
    ("sarah-v2",    "Sarah v2",         "IT"),
    ("sarah-v3",    "Sarah v3",         "IT"),
    ("sarah-hc",    "Sarah Healthcare", "healthcare"),
    ("sarah-sales", "Sarah Sales",      "sales"),
    ("sarah-eng",   "Sarah Engineering","engineering"),
    ("sarah-li",    "Sarah Industrial", "light_industrial"),
    ("sarah-ec",    "Sarah EarlyCareers","early_careers"),
]

JOBS = [
    ("job-001", "Senior Software Engineer",      "IT",               "TechCorp Inc"),
    ("job-002", "DevOps Engineer",               "IT",               "CloudStack"),
    ("job-003", "Frontend Developer",            "IT",               "Pixel Labs"),
    ("job-004", "Registered Nurse",              "healthcare",       "MedCenter"),
    ("job-005", "Clinical Data Analyst",         "healthcare",       "HealthBridge"),
    ("job-006", "Account Executive",             "sales",            "GrowthCo"),
    ("job-007", "SDR",                           "sales",            "PipeLine Inc"),
    ("job-008", "Mechanical Engineer",           "engineering",      "BuildTech"),
    ("job-009", "Warehouse Associate",           "light_industrial", "LogiCo"),
    ("job-010", "Junior Developer",              "early_careers",    "StartRight"),
    ("job-011", "ML Engineer",                   "IT",               "AI Labs"),
    ("job-012", "ICU Nurse",                     "healthcare",       "City Hospital"),
    ("job-013", "Enterprise Sales Manager",      "sales",            "EnterpriseCo"),
    ("job-014", "Electrical Engineer",           "engineering",      "PowerGrid"),
    ("job-015", "Fulfillment Center Lead",       "light_industrial", "MegaShip"),
]

FLAGS = [
    ("low_confidence_answer", "medium"),
    ("salary_mismatch",       "high"),
    ("off_topic",             "medium"),
    ("no_response",           "high"),
    ("ats_sync_failed",       "high"),
    ("long_pause",            "low"),
    ("repeated_question",     "low"),
]

OUTCOMES = ["shortlisted", "rejected", "no_show", "pending"]
OUTCOME_WEIGHTS = [0.25, 0.45, 0.10, 0.20]

TRANSCRIPT_SNIPPETS = [
    "Candidate described strong Python experience but hesitated on system design questions.",
    "Salary expectations ($180k) significantly above posted range ($120k). Flagged for review.",
    "Candidate went off-topic multiple times, discussing unrelated project management experience.",
    "Interview ended abruptly — no response detected after minute 4. Session auto-closed.",
    "ATS sync timed out after 3 retries. Interview data queued for manual upload.",
    "Strong cultural fit signals. Candidate demonstrated deep knowledge of distributed systems.",
    "Candidate asked the same clarifying question three times. Possible comprehension issue.",
    "Excellent communication. Passed all screening criteria for nursing licensure verification.",
    "Candidate ghosted after 2-minute mark. Phone number flagged as unresponsive.",
    "Good match on technical skills but availability conflicts with shift requirements.",
    "Candidate seemed well-prepared. Strong answers on React and TypeScript fundamentals.",
    "Salary negotiation was contentious. Bot escalation triggered for human review.",
    "Warehouse experience confirmed. Physical requirements discussed and accepted.",
    "Recent grad — limited experience but strong learning signals. Recommended for junior track.",
    "Candidate disconnected mid-screening. Reconnection attempt failed after 30s timeout.",
]

# ── Helpers ────────────────────────────────────────────────────────────────

def random_interview(bot_id: str, vertical: str) -> dict:
    """Generate a single realistic interview record."""
    started_at = datetime.now(timezone.utc) - timedelta(
        days=random.uniform(0, 60),
        hours=random.uniform(0, 23),
        minutes=random.uniform(0, 59),
    )

    # Vertical-specific latency profiles (ms) — IT tends faster, healthcare longer
    latency_profiles = {
        "IT":               (45_000,  25_000),
        "healthcare":       (90_000,  40_000),
        "sales":            (60_000,  30_000),
        "engineering":      (75_000,  35_000),
        "light_industrial": (40_000,  20_000),
        "early_careers":    (50_000,  22_000),
    }
    mean_ms, std_ms = latency_profiles.get(vertical, (60_000, 30_000))
    duration_ms = max(10_000, int(random.gauss(mean_ms, std_ms)))

    # Token usage correlates with duration (~4 tokens/sec speech)
    tokens_used = int(duration_ms / 1000 * random.uniform(3.5, 5.0))

    # Cost: ~$0.002 per 1k tokens input + output blended
    cost_usd = round(tokens_used * 0.000002 * random.uniform(0.9, 1.3), 4)

    # Match score: slightly higher for IT/engineering, lower for no_show
    outcome = random.choices(OUTCOMES, weights=OUTCOME_WEIGHTS)[0]
    if outcome == "no_show":
        match_score = round(random.uniform(0.0, 0.35), 2)
        duration_ms = random.randint(5_000, 20_000)
        tokens_used = random.randint(50, 300)
        cost_usd = round(tokens_used * 0.000002, 4)
    elif outcome == "shortlisted":
        match_score = round(random.uniform(0.65, 1.0), 2)
    elif outcome == "rejected":
        match_score = round(random.uniform(0.15, 0.55), 2)
    else:
        match_score = round(random.uniform(0.3, 0.75), 2)

    ended_at = started_at + timedelta(milliseconds=duration_ms)

    return {
        "id": str(uuid.uuid4()),
        "candidate_id": f"cand-{uuid.uuid4().hex[:8]}",
        "started_at": started_at,
        "ended_at": ended_at,
        "duration_ms": duration_ms,
        "tokens_used": tokens_used,
        "cost_usd": cost_usd,
        "match_score": match_score,
        "outcome": outcome,
        "transcript_snippet": random.choice(TRANSCRIPT_SNIPPETS),
        "bot_id": bot_id,
    }

def random_flags_for(interview_id: str, match_score: float, outcome: str) -> list:
    """Assign flags based on interview quality signals."""
    flags = []
    # Bad interviews get more flags
    flag_probability = 0.6 if match_score < 0.4 else (0.25 if match_score < 0.65 else 0.05)

    for flag, severity in FLAGS:
        if random.random() < flag_probability:
            # Certain flags only make sense in context
            if flag == "ats_sync_failed" and random.random() > 0.15:
                continue
            if flag == "no_response" and outcome != "no_show" and random.random() > 0.2:
                continue
            flags.append({
                "id": str(uuid.uuid4()),
                "interview_id": interview_id,
                "flag": flag,
                "severity": severity,
            })
    return flags

# ── Main ───────────────────────────────────────────────────────────────────

async def seed():
    print("🔌 Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)

    print("📋 Running schema...")
    with open("schema.sql") as f:
        await conn.execute(f.read())

    print("🤖 Seeding bots...")
    await conn.executemany(
        "INSERT INTO bots (id, name, vertical) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        BOTS,
    )

    print("💼 Seeding jobs...")
    await conn.executemany(
        "INSERT INTO jobs (id, title, vertical, client_name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
        [(j[0], j[1], j[2], j[3]) for j in JOBS],
    )

    print("🎙  Generating interviews...")
    interviews = []
    flags_all = []

    # Build a vertical → jobs mapping
    vertical_to_jobs = {}
    for j in JOBS:
        vertical_to_jobs.setdefault(j[2], []).append(j[0])

    # Build a bot_id → vertical mapping
    bot_vertical = {b[0]: b[2] for b in BOTS}

    for _ in range(2200):
        bot_id, _, vertical = random.choice(BOTS)
        interview = random_interview(bot_id, vertical)

        # Pick a job matching the vertical
        matching_jobs = vertical_to_jobs.get(vertical, [JOBS[0][0]])
        interview["job_id"] = random.choice(matching_jobs)

        flags = random_flags_for(interview["id"], interview["match_score"], interview["outcome"])
        interviews.append(interview)
        flags_all.extend(flags)

    print(f"   → {len(interviews)} interviews, {len(flags_all)} flags")

    print("💾 Inserting interviews...")
    await conn.executemany(
        """INSERT INTO interviews
           (id, candidate_id, job_id, bot_id, started_at, ended_at, duration_ms,
            tokens_used, cost_usd, match_score, outcome, transcript_snippet)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           ON CONFLICT DO NOTHING""",
        [
            (i["id"], i["candidate_id"], i["job_id"], i["bot_id"],
             i["started_at"], i["ended_at"], i["duration_ms"],
             i["tokens_used"], i["cost_usd"], i["match_score"],
             i["outcome"], i["transcript_snippet"])
            for i in interviews
        ],
    )

    print("🚩 Inserting flags...")
    await conn.executemany(
        "INSERT INTO interview_flags (interview_id, flag, severity) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
        [(f["interview_id"], f["flag"], f["severity"]) for f in flags_all],
    )

    await conn.close()
    print("✅ Seed complete!")

if __name__ == "__main__":
    asyncio.run(seed())
