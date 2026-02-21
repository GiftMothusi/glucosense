"""
Analytics routes: /api/v1/analytics
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user, get_current_premium_user
from app.services.glucose_service import GlucoseService
from app.schemas.schemas import GlucoseStatsResponse, TIRResponse, InsightResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def dashboard_summary(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns a full dashboard payload: latest reading, 7-day stats, TIR, recent insights.
    Single endpoint to minimise mobile network calls.
    """
    latest = await GlucoseService.get_latest(db, current_user.id)
    stats_7 = await GlucoseService.get_stats(db, current_user.id, days=7)
    stats_30 = await GlucoseService.get_stats(db, current_user.id, days=30)

    return {
        "latest_reading": latest,
        "stats_7_days": vars(stats_7) if stats_7 else None,
        "stats_30_days": vars(stats_30) if stats_30 else None,
    }


@router.get("/weekly-report")
async def weekly_report(
    current_user=Depends(get_current_premium_user),
    db: AsyncSession = Depends(get_db),
):
    """Premium: comprehensive weekly report."""
    stats = await GlucoseService.get_stats(db, current_user.id, days=7)
    patterns = await GlucoseService.get_patterns(db, current_user.id, days=30)
    daily = await GlucoseService.get_daily_averages(db, current_user.id, days=7)

    return {
        "stats": vars(stats) if stats else None,
        "patterns": [vars(p) for p in patterns],
        "daily_averages": daily,
    }


@router.get("/insights")
async def get_insights(
    current_user=Depends(get_current_premium_user),
    db: AsyncSession = Depends(get_db),
):
    """Premium: AI-generated insights."""
    patterns = await GlucoseService.get_patterns(db, current_user.id, days=30)
    return {
        "insights": [
            {
                "category": "pattern",
                "title": p.pattern_type.replace("_", " ").title(),
                "body": p.description,
                "confidence": p.confidence,
                "data": p.data,
            }
            for p in patterns
        ]
    }
