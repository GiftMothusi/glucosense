from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

from app.core.security import get_current_user
from app.services.glucose_service import GlucoseService
from app.schemas.schemas import (
    GlucoseReadingCreate, GlucoseReadingResponse,
    GlucoseListResponse, GlucoseStatsResponse, TIRResponse,
)

router = APIRouter(prefix="/glucose", tags=["Glucose"])


@router.post("/", response_model=GlucoseReadingResponse, status_code=status.HTTP_201_CREATED)
async def log_glucose(
    data: GlucoseReadingCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reading = await GlucoseService.create_reading(db, current_user.id, data)
    return reading


@router.get("/", response_model=GlucoseListResponse)
async def list_glucose(
    days: int = Query(default=14, ge=1, le=365),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    tag: Optional[str] = Query(default=None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Free tier: max 30 days history
    if not current_user.is_premium and days > 30:
        days = 30
    readings, total = await GlucoseService.get_readings(
        db, current_user.id, days=days, page=page, page_size=page_size, tag=tag
    )
    return GlucoseListResponse(
        readings=readings,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/latest", response_model=Optional[GlucoseReadingResponse])
async def latest_glucose(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await GlucoseService.get_latest(db, current_user.id)


@router.get("/stats", response_model=GlucoseStatsResponse)
async def glucose_stats(
    days: int = Query(default=14, ge=1, le=90),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await GlucoseService.get_stats(db, current_user.id, days=days)
    if not stats:
        raise HTTPException(status_code=404, detail="Not enough glucose data")
    return GlucoseStatsResponse(
        average_mmol=stats.average_mmol,
        std_dev=stats.std_dev,
        coefficient_of_variation=stats.coefficient_of_variation,
        estimated_hba1c=stats.estimated_hba1c,
        min_mmol=stats.min_mmol,
        max_mmol=stats.max_mmol,
        period_days=stats.period_days,
        tir=TIRResponse(
            in_range_pct=stats.in_range_pct,
            below_pct=stats.below_pct,
            above_pct=stats.above_pct,
            very_low_pct=stats.very_low_pct,
            very_high_pct=stats.very_high_pct,
            target_low=3.9,
            target_high=10.0,
            period_days=stats.period_days,
            reading_count=stats.reading_count,
        ),
    )


@router.get("/patterns")
async def glucose_patterns(
    days: int = Query(default=30, ge=7, le=90),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detect glucose patterns."""
    patterns = await GlucoseService.get_patterns(db, current_user.id, days=days)
    return {"patterns": [vars(p) for p in patterns]}


@router.get("/hourly-profile")
async def hourly_profile(
    days: int = Query(default=30, ge=7, le=90),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """24-hour average glucose profile."""
    profile = await GlucoseService.get_hourly_profile(db, current_user.id, days=days)
    return {"profile": profile}


@router.get("/daily-averages")
async def daily_averages(
    days: int = Query(default=30, ge=7, le=365),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    averages = await GlucoseService.get_daily_averages(db, current_user.id, days=days)
    return {"averages": averages}


@router.delete("/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_glucose(
    reading_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await GlucoseService.delete_reading(db, current_user.id, reading_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Reading not found")