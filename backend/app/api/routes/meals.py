from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Meal, MealItem
from app.schemas.schemas import MealCreate, MealResponse

router = APIRouter(prefix="/meals", tags=["Meals"])


@router.post("", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
async def log_meal(
    data: MealCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    eaten_at = data.eaten_at or datetime.now(timezone.utc)

    total_carbs = sum(i.carbs_g for i in data.items)
    total_protein = sum(i.protein_g for i in data.items)
    total_fat = sum(i.fat_g for i in data.items)
    total_cal = sum(i.calories for i in data.items)
    total_fiber = sum(i.fiber_g for i in data.items)

    gi_items = [(i.glycemic_index, i.carbs_g) for i in data.items if i.glycemic_index]
    if gi_items and total_carbs > 0:
        avg_gi = sum(gi * carbs for gi, carbs in gi_items) / total_carbs
        glycemic_load = (avg_gi * total_carbs) / 100
    else:
        avg_gi = None
        glycemic_load = None

    meal = Meal(
        user_id=current_user.id,
        name=data.name,
        meal_type=data.meal_type,
        total_carbs_g=round(total_carbs, 1),
        total_protein_g=round(total_protein, 1),
        total_fat_g=round(total_fat, 1),
        total_calories=round(total_cal, 1),
        total_fiber_g=round(total_fiber, 1),
        glycemic_index=round(avg_gi, 1) if avg_gi else None,
        glycemic_load=round(glycemic_load, 1) if glycemic_load else None,
        notes=data.notes,
        photo_url=data.photo_url,
        is_favourite=data.is_favourite,
        eaten_at=eaten_at,
    )
    db.add(meal)
    await db.flush()

    for item_data in data.items:
        item = MealItem(meal_id=meal.id, **item_data.model_dump())
        db.add(item)

    await db.commit()

    result = await db.execute(
        select(Meal)
        .options(selectinload(Meal.items))
        .where(Meal.id == meal.id)
    )
    return result.scalar_one()


@router.get("", response_model=List[MealResponse])
async def list_meals(
    days: int = Query(default=7, ge=1, le=365),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(Meal)
        .options(selectinload(Meal.items))
        .where(and_(Meal.user_id == current_user.id, Meal.eaten_at >= since))
        .order_by(desc(Meal.eaten_at))
    )
    return result.scalars().all()


@router.get("/favourites", response_model=List[MealResponse])
async def favourite_meals(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Meal)
        .options(selectinload(Meal.items))
        .where(and_(Meal.user_id == current_user.id, Meal.is_favourite == True))
        .order_by(desc(Meal.eaten_at))
        .limit(50)
    )
    return result.scalars().all()


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal(
    meal_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Meal).where(and_(Meal.id == meal_id, Meal.user_id == current_user.id))
    )
    meal = result.scalar_one_or_none()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    await db.delete(meal)
    await db.commit()