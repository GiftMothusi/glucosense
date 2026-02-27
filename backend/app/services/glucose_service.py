from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from app.models import GlucoseReading, DiabetesProfile
from app.schemas.schemas import GlucoseReadingCreate, SyncReadingItem, SyncResponse
from app.analytics.glucose.engine import (
    compute_stats, detect_patterns, compute_hourly_profile,
    compute_daily_averages, GlucoseStats,
)

MMOL_TO_MGDL = 18.0182


class GlucoseService:

    @staticmethod
    async def create_reading(
        db: AsyncSession, user_id: int, data: GlucoseReadingCreate
    ) -> GlucoseReading:
        value_mmol = data.to_mmol()
        value_mgdl = data.to_mgdl()
        recorded_at = data.recorded_at or datetime.now(timezone.utc)

        reading = GlucoseReading(
            user_id=user_id,
            value_mmol=round(value_mmol, 2),
            value_mgdl=round(value_mgdl, 1),
            source=data.source,
            tag=data.tag,
            trend_arrow=data.trend_arrow,
            trend_rate=data.trend_rate,
            notes=data.notes,
            meal_id=data.meal_id,
            recorded_at=recorded_at,
            external_id=data.external_id,
        )
        db.add(reading)
        await db.commit()
        await db.refresh(reading)
        return reading

    @staticmethod
    async def get_readings(
        db: AsyncSession,
        user_id: int,
        days: int = 14,
        page: int = 1,
        page_size: int = 100,
        tag: Optional[str] = None,
    ) -> Tuple[List[GlucoseReading], int]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        base_query = select(GlucoseReading).where(
            and_(GlucoseReading.user_id == user_id, GlucoseReading.recorded_at >= since)
        )
        if tag:
            base_query = base_query.where(GlucoseReading.tag == tag)

        count_result = await db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar()

        query = (
            base_query.order_by(desc(GlucoseReading.recorded_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await db.execute(query)
        return result.scalars().all(), total

    @staticmethod
    async def get_readings_for_analytics(
        db: AsyncSession, user_id: int, days: int = 30
    ) -> List[Tuple[datetime, float]]:
        """Return raw (timestamp, mmol) tuples for the analytics engine."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await db.execute(
            select(GlucoseReading.recorded_at, GlucoseReading.value_mmol)
            .where(
                and_(
                    GlucoseReading.user_id == user_id,
                    GlucoseReading.recorded_at >= since,
                )
            )
            .order_by(GlucoseReading.recorded_at)
        )
        return [(row[0], row[1]) for row in result.fetchall()]

    @staticmethod
    async def get_latest(
        db: AsyncSession, user_id: int
    ) -> Optional[GlucoseReading]:
        result = await db.execute(
            select(GlucoseReading)
            .where(GlucoseReading.user_id == user_id)
            .order_by(desc(GlucoseReading.recorded_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_stats(
        db: AsyncSession, user_id: int, days: int = 14
    ) -> Optional[GlucoseStats]:
        readings = await GlucoseService.get_readings_for_analytics(db, user_id, days=days)
        if not readings:
            return None

        # Fetch user targets
        dp_result = await db.execute(
            select(DiabetesProfile).where(DiabetesProfile.user_id == user_id)
        )
        dp = dp_result.scalar_one_or_none()
        target_low = dp.target_glucose_low if dp else 3.9
        target_high = dp.target_glucose_high if dp else 10.0

        return compute_stats(readings, target_low=target_low, target_high=target_high, period_days=days)

    @staticmethod
    async def get_patterns(
        db: AsyncSession, user_id: int, days: int = 30
    ) -> list:
        readings = await GlucoseService.get_readings_for_analytics(db, user_id, days=days)
        if len(readings) < 20:
            return []

        dp_result = await db.execute(
            select(DiabetesProfile).where(DiabetesProfile.user_id == user_id)
        )
        dp = dp_result.scalar_one_or_none()
        target_low = dp.target_glucose_low if dp else 3.9
        target_high = dp.target_glucose_high if dp else 10.0

        return detect_patterns(readings, target_low=target_low, target_high=target_high)

    @staticmethod
    async def get_hourly_profile(
        db: AsyncSession, user_id: int, days: int = 30
    ) -> dict:
        readings = await GlucoseService.get_readings_for_analytics(db, user_id, days=days)
        return compute_hourly_profile(readings)

    @staticmethod
    async def get_daily_averages(
        db: AsyncSession, user_id: int, days: int = 30
    ) -> list:
        readings = await GlucoseService.get_readings_for_analytics(db, user_id, days=days)
        return compute_daily_averages(readings)

    @staticmethod
    async def bulk_sync(
        db: AsyncSession, user_id: int, readings: List[SyncReadingItem]
    ) -> SyncResponse:
        imported = 0
        skipped_duplicates = 0
        errors = 0

        for item in readings:
            try:
                existing = await db.execute(
                    select(GlucoseReading).where(
                        and_(
                            GlucoseReading.user_id == user_id,
                            GlucoseReading.external_id == item.external_id,
                        )
                    )
                )
                if existing.scalar_one_or_none() is not None:
                    skipped_duplicates += 1
                    continue

                if item.unit == "mgdl":
                    value_mmol = round(item.value / MMOL_TO_MGDL, 2)
                    value_mgdl = round(item.value, 1)
                else:
                    value_mmol = round(item.value, 2)
                    value_mgdl = round(item.value * MMOL_TO_MGDL, 1)

                reading = GlucoseReading(
                    user_id=user_id,
                    value_mmol=value_mmol,
                    value_mgdl=value_mgdl,
                    source=item.source,
                    tag=item.tag,
                    trend_arrow=item.trend_arrow,
                    trend_rate=item.trend_rate,
                    recorded_at=item.recorded_at,
                    external_id=item.external_id,
                )
                db.add(reading)
                imported += 1
            except Exception:
                errors += 1

        if imported > 0:
            await db.commit()

        return SyncResponse(
            imported=imported,
            skipped_duplicates=skipped_duplicates,
            errors=errors,
            message=f"Sync complete: {imported} imported, {skipped_duplicates} skipped, {errors} errors.",
        )

    @staticmethod
    async def delete_reading(
        db: AsyncSession, user_id: int, reading_id: int
    ) -> bool:
        result = await db.execute(
            select(GlucoseReading).where(
                and_(GlucoseReading.id == reading_id, GlucoseReading.user_id == user_id)
            )
        )
        reading = result.scalar_one_or_none()
        if not reading:
            return False
        await db.delete(reading)
        await db.commit()
        return True
