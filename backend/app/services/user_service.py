from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import User, UserProfile, DiabetesProfile, Subscription, SubscriptionPlan, SubscriptionStatus
from app.schemas.schemas import RegisterRequest, UserProfileUpdate, DiabetesProfileCreate
from app.core.security import hash_password, verify_password


class UserService:

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.profile),
                selectinload(User.diabetes_profile),
                selectinload(User.subscription),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, data: RegisterRequest) -> User:
        existing = await UserService.get_by_email(db, data.email)
        if existing:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        user = User(
            email=data.email.lower(),
            hashed_password=hash_password(data.password),
            full_name=data.full_name.strip(),
        )
        db.add(user)
        await db.flush()  # Get the user ID

        # Create default profile
        profile = UserProfile(user_id=user.id)
        db.add(profile)

        # Create free subscription
        subscription = Subscription(
            user_id=user.id,
            plan=SubscriptionPlan.FREE,
            status=SubscriptionStatus.ACTIVE,
        )
        db.add(subscription)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]:
        user = await UserService.get_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def update_profile(
        db: AsyncSession, user_id: int, data: UserProfileUpdate
    ) -> UserProfile:
        result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = result.scalar_one_or_none()

        if not profile:
            profile = UserProfile(user_id=user_id)
            db.add(profile)

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(profile, field, value)

        await db.commit()
        await db.refresh(profile)
        return profile

    @staticmethod
    async def set_diabetes_profile(
        db: AsyncSession, user_id: int, data: DiabetesProfileCreate
    ) -> DiabetesProfile:
        result = await db.execute(
            select(DiabetesProfile).where(DiabetesProfile.user_id == user_id)
        )
        dp = result.scalar_one_or_none()

        if not dp:
            dp = DiabetesProfile(user_id=user_id)
            db.add(dp)

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(dp, field, value)

        # Mark onboarding complete if diabetes profile is set
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalar_one_or_none()
        if profile:
            profile.onboarding_completed = True

        await db.commit()
        await db.refresh(dp)
        return dp

    @staticmethod
    async def change_password(
        db: AsyncSession, user_id: int, current_password: str, new_password: str
    ) -> bool:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return False
        if not verify_password(current_password, user.hashed_password):
            return False
        user.hashed_password = hash_password(new_password)
        await db.commit()
        return True
        
    @staticmethod
    async def update_last_login(db: AsyncSession, user_id: int):
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.last_login_at = datetime.now(timezone.utc)
            await db.commit()
