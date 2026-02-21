"""
Activity routes: /api/v1/activities
"""
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Activity
from app.schemas.schemas import ActivityCreate, ActivityResponse

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def log_activity(
    data: ActivityCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    started_at = data.started_at or datetime.now(timezone.utc)
    activity = Activity(
        user_id=current_user.id,
        started_at=started_at,
        **data.model_dump(exclude={"started_at"}),
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


@router.get("/", response_model=List[ActivityResponse])
async def list_activities(
    days: int = Query(default=7, ge=1, le=90),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(Activity)
        .where(and_(Activity.user_id == current_user.id, Activity.started_at >= since))
        .order_by(desc(Activity.started_at))
    )
    return result.scalars().all()


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Activity).where(
            and_(Activity.id == activity_id, Activity.user_id == current_user.id)
        )
    )
    act = result.scalar_one_or_none()
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")
    await db.delete(act)
    await db.commit()
