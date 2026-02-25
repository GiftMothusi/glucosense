from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.user_service import UserService
from app.schemas.schemas import (
    UserDetailResponse, UserProfileUpdate,
    DiabetesProfileCreate, DiabetesProfileResponse,
     ChangePasswordRequest, ChangePasswordResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserDetailResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me/profile", response_model=UserDetailResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await UserService.update_profile(db, current_user.id, data)
    updated = await UserService.get_by_id(db, current_user.id)
    return updated


@router.post("/me/diabetes-profile", response_model=DiabetesProfileResponse)
async def set_diabetes_profile(
    data: DiabetesProfileCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dp = await UserService.set_diabetes_profile(db, current_user.id, data)
    return dp
    

@router.post("/me/change-password", response_model=ChangePasswordResponse)
async def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await UserService.change_password(
        db, current_user.id, data.current_password, data.new_password
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    return ChangePasswordResponse(message="Password changed successfully")
