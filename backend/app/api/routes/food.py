from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.food_service import FoodService
from app.schemas.schemas import FoodSearchResponse

router = APIRouter(prefix="/food", tags=["Food"])


@router.get("/search", response_model=List[FoodSearchResponse])
async def search_food(
    q: str = Query(min_length=2, max_length=100),
    limit: int = Query(default=10, ge=1, le=25),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    if not q.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")

    results = await FoodService.search(db, query=q.strip(), limit=limit)
    return results


@router.get("/barcode/{barcode}", response_model=FoodSearchResponse)
async def barcode_lookup(
    barcode: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
   
    food = await FoodService.barcode_lookup(db, barcode=barcode.strip())

    if not food:
        raise HTTPException(
            status_code=404,
            detail=f"No product found for barcode {barcode}"
        )

    return food