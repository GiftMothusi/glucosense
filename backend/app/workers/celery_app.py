from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "glucosense",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.analytics_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        # Run analytics for active users daily
        "run-daily-analytics": {
            "task": "app.workers.analytics_tasks.run_daily_analytics",
            "schedule": 86400.0,  # every 24 hours
        },
    },
)
