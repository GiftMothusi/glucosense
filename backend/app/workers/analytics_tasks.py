"""
GlucoSense Analytics Background Tasks
Run via Celery workers. Computes patterns, correlations, and insights for users.
"""
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.workers.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)

# Sync session for Celery tasks
engine = create_engine(settings.DATABASE_URL_SYNC)
SessionLocal = sessionmaker(bind=engine)


@celery_app.task(name="app.workers.analytics_tasks.run_daily_analytics")
def run_daily_analytics():
    """
    Triggered daily. Runs analytics for all active users with sufficient data.
    Computes: patterns, correlations, meal impact scores, glucose variability.
    """
    from app.models.models import User, GlucoseReading
    from sqlalchemy import select, func
    from datetime import datetime, timezone, timedelta

    db = SessionLocal()
    try:
        # Find users active in last 30 days with readings
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        result = db.execute(
            select(User.id)
            .join(GlucoseReading, GlucoseReading.user_id == User.id)
            .where(GlucoseReading.recorded_at >= cutoff)
            .group_by(User.id)
            .having(func.count(GlucoseReading.id) >= 20)
        )
        user_ids = [row[0] for row in result]
        logger.info(f"Running analytics for {len(user_ids)} users")

        for user_id in user_ids:
            compute_user_analytics.delay(user_id)

    except Exception as e:
        logger.error(f"Daily analytics failed: {e}")
    finally:
        db.close()


@celery_app.task(name="app.workers.analytics_tasks.compute_user_analytics", max_retries=3)
def compute_user_analytics(user_id: int):
    """
    Compute full analytics suite for a single user.
    Saves results to DB for fast API reads.
    """
    from app.models.models import (
        GlucoseReading, DiabetesProfile, GlucosePattern,
        Insight, InsightCategory
    )
    from app.analytics.glucose.engine import detect_patterns, compute_stats
    from datetime import datetime, timezone, timedelta
    from sqlalchemy import and_

    db = SessionLocal()
    try:
        # Fetch readings
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        readings_result = db.execute(
            select(GlucoseReading.recorded_at, GlucoseReading.value_mmol)
            .where(and_(GlucoseReading.user_id == user_id, GlucoseReading.recorded_at >= cutoff))
            .order_by(GlucoseReading.recorded_at)
        )
        readings = [(row[0], row[1]) for row in readings_result]

        if len(readings) < 20:
            return

        # Fetch targets
        dp = db.execute(
            select(DiabetesProfile).where(DiabetesProfile.user_id == user_id)
        ).scalar_one_or_none()
        target_low = dp.target_glucose_low if dp else 3.9
        target_high = dp.target_glucose_high if dp else 10.0

        # Detect patterns
        patterns = detect_patterns(readings, target_low=target_low, target_high=target_high)

        # Upsert pattern records
        from sqlalchemy import select as sel
        for pattern in patterns:
            existing = db.execute(
                sel(GlucosePattern).where(
                    and_(
                        GlucosePattern.user_id == user_id,
                        GlucosePattern.pattern_type == pattern.pattern_type
                    )
                )
            ).scalar_one_or_none()

            if existing:
                existing.description = pattern.description
                existing.confidence = pattern.confidence
                existing.data = pattern.data
                existing.computed_at = datetime.now(timezone.utc)
            else:
                new_pattern = GlucosePattern(
                    user_id=user_id,
                    pattern_type=pattern.pattern_type,
                    description=pattern.description,
                    confidence=pattern.confidence,
                    data=pattern.data,
                )
                db.add(new_pattern)

            # Create insight record
            insight = Insight(
                user_id=user_id,
                category=InsightCategory.PATTERN,
                title=pattern.pattern_type.replace("_", " ").title(),
                body=pattern.description,
                data=pattern.data,
                severity="warning" if pattern.confidence > 0.7 else "info",
            )
            db.add(insight)

        db.commit()
        logger.info(f"Analytics complete for user {user_id}: {len(patterns)} patterns")

    except Exception as e:
        db.rollback()
        logger.error(f"Analytics failed for user {user_id}: {e}")
        raise
    finally:
        db.close()
