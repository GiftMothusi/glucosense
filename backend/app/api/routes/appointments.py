"""
Appointments routes: /api/v1/care/appointments
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Appointment
from app.schemas.schemas import AppointmentCreate, AppointmentResponse

router = APIRouter(prefix="/care/appointments", tags=["Appointments"])


@router.get("/", response_model=List[AppointmentResponse])
async def list_appointments(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .where(Appointment.user_id == current_user.id)
        .order_by(desc(Appointment.scheduled_at))
    )
    return result.scalars().all()


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def add_appointment(
    data: AppointmentCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appointment = Appointment(user_id=current_user.id, **data.model_dump())
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}/complete", response_model=AppointmentResponse)
async def mark_appointment_complete(
    appointment_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment).where(
            and_(Appointment.id == appointment_id,
                 Appointment.user_id == current_user.id)
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    # MARK as completed
    appointment.is_completed = True
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment).where(
            and_(Appointment.id == appointment_id,
                 Appointment.user_id == current_user.id)
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    await db.delete(appointment)
    await db.commit()