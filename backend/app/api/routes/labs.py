from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import LabResult
from app.schemas.schemas import LabResultCreate, LabResultResponse

router = APIRouter(prefix="/care/labs", tags=["Labs"])


@router.get("", response_model=List[LabResultResponse])
async def list_lab_results(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LabResult)
        .where(LabResult.user_id == current_user.id)
        .order_by(desc(LabResult.tested_at))
    )
    return result.scalars().all()


@router.post("/", response_model=LabResultResponse, status_code=status.HTTP_201_CREATED)
async def add_lab_result(
    data: LabResultCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lab = LabResult(user_id=current_user.id, **data.model_dump())
    db.add(lab)
    await db.commit()
    await db.refresh(lab)
    return lab


@router.delete("/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_result(
    lab_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LabResult).where(
            and_(LabResult.id == lab_id, LabResult.user_id == current_user.id)
        )
    )
    lab = result.scalar_one_or_none()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab result not found")
    await db.delete(lab)
    await db.commit()