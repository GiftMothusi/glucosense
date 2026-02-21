"""
Insulin routes: /api/v1/insulin
"""
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import InsulinDose
from app.schemas.schemas import (
    InsulinDoseCreate, InsulinDoseResponse,
    BolusCalculationRequest, BolusCalculationResponse,
)

router = APIRouter(prefix="/insulin", tags=["Insulin"])


@router.post("/", response_model=InsulinDoseResponse, status_code=status.HTTP_201_CREATED)
async def log_insulin(
    data: InsulinDoseCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    administered_at = data.administered_at or datetime.now(timezone.utc)
    dose = InsulinDose(
        user_id=current_user.id,
        administered_at=administered_at,
        **data.model_dump(exclude={"administered_at"}),
    )
    db.add(dose)
    await db.commit()
    await db.refresh(dose)
    return dose


@router.get("/", response_model=List[InsulinDoseResponse])
async def list_insulin(
    days: int = Query(default=7, ge=1, le=90),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(InsulinDose)
        .where(and_(InsulinDose.user_id == current_user.id, InsulinDose.administered_at >= since))
        .order_by(desc(InsulinDose.administered_at))
    )
    return result.scalars().all()


@router.post("/bolus-calculator", response_model=BolusCalculationResponse)
async def calculate_bolus(
    data: BolusCalculationRequest,
    current_user=Depends(get_current_user),
):
    """
    Smart bolus calculator.
    meal_bolus = carbs / carb_ratio
    correction_bolus = (current_glucose - target_glucose) / correction_factor
    recommended = meal_bolus + correction_bolus - IOB
    """
    meal_bolus = data.carbs_g / data.carb_ratio
    correction_bolus = (data.current_glucose_mmol - data.target_glucose_mmol) / data.correction_factor
    raw_total = meal_bolus + correction_bolus
    recommended = max(raw_total - data.insulin_on_board, 0.0)

    notes_parts = []
    if data.insulin_on_board > 0:
        notes_parts.append(f"{data.insulin_on_board:.1f}u IOB deducted")
    if correction_bolus < 0:
        notes_parts.append("Glucose below target — no correction added")
    notes = ". ".join(notes_parts) if notes_parts else "Standard bolus calculated."

    return BolusCalculationResponse(
        meal_bolus=round(meal_bolus, 2),
        correction_bolus=round(correction_bolus, 2),
        total_bolus=round(raw_total, 2),
        iob_deducted=round(data.insulin_on_board, 2),
        recommended_bolus=round(recommended, 2),
        notes=notes,
    )


@router.delete("/{dose_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_insulin(
    dose_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InsulinDose).where(
            and_(InsulinDose.id == dose_id, InsulinDose.user_id == current_user.id)
        )
    )
    dose = result.scalar_one_or_none()
    if not dose:
        raise HTTPException(status_code=404, detail="Dose not found")
    await db.delete(dose)
    await db.commit()
