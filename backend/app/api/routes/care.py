"""
Care routes: /api/v1/care
"""
import secrets
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.security import get_current_user, get_current_premium_user
from app.models import EmergencyContact, CarePortalLink, Medication, SupplyItem
from app.schemas.schemas import (
    EmergencyContactCreate, EmergencyContactResponse,
    CarePortalLinkCreate, CarePortalLinkResponse,
    MedicationCreate, MedicationResponse,
    SupplyItemCreate, SupplyItemResponse,
)

router = APIRouter(prefix="/care", tags=["Care"])

BASE_URL = "https://app.glucosense.health"  # update per environment


# ─── Emergency Contacts ───────────────────────────────────────────────────────

@router.get("/emergency-contacts", response_model=List[EmergencyContactResponse])
async def list_emergency_contacts(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmergencyContact).where(EmergencyContact.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/emergency-contacts", response_model=EmergencyContactResponse, status_code=201)
async def add_emergency_contact(
    data: EmergencyContactCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    contact = EmergencyContact(user_id=current_user.id, **data.model_dump())
    db.add(contact)
    await db.commit()
    await db.refresh(contact)
    return contact


@router.delete("/emergency-contacts/{contact_id}", status_code=204)
async def delete_emergency_contact(
    contact_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(EmergencyContact).where(
            and_(EmergencyContact.id == contact_id, EmergencyContact.user_id == current_user.id)
        )
    )
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.delete(contact)
    await db.commit()


# ─── Care Portal ─────────────────────────────────────────────────────────────

@router.get("/portal-links", response_model=List[CarePortalLinkResponse])
async def list_portal_links(
    current_user=Depends(get_current_premium_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CarePortalLink).where(CarePortalLink.user_id == current_user.id)
    )
    links = result.scalars().all()
    for link in links:
        link.share_url = f"{BASE_URL}/care/{link.token}"
    return links


@router.post("/portal-links", response_model=CarePortalLinkResponse, status_code=201)
async def create_portal_link(
    data: CarePortalLinkCreate,
    current_user=Depends(get_current_premium_user),
    db: AsyncSession = Depends(get_db),
):
    token = secrets.token_urlsafe(32)
    expires_at = None
    if data.expires_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=data.expires_days)

    link = CarePortalLink(
        user_id=current_user.id,
        token=token,
        label=data.label,
        permissions=data.permissions,
        expires_at=expires_at,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    link.share_url = f"{BASE_URL}/care/{link.token}"
    return link


@router.delete("/portal-links/{link_id}", status_code=204)
async def revoke_portal_link(
    link_id: int,
    current_user=Depends(get_current_premium_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CarePortalLink).where(
            and_(CarePortalLink.id == link_id, CarePortalLink.user_id == current_user.id)
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    await db.delete(link)
    await db.commit()


# ─── Medications ─────────────────────────────────────────────────────────────

@router.get("/medications", response_model=List[MedicationResponse])
async def list_medications(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Medication).where(
            and_(Medication.user_id == current_user.id, Medication.is_active == True)
        )
    )
    return result.scalars().all()


@router.post("/medications", response_model=MedicationResponse, status_code=201)
async def add_medication(
    data: MedicationCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    med = Medication(user_id=current_user.id, **data.model_dump())
    db.add(med)
    await db.commit()
    await db.refresh(med)
    return med


@router.delete("/medications/{med_id}", status_code=204)
async def delete_medication(
    med_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Medication).where(
            and_(Medication.id == med_id, Medication.user_id == current_user.id)
        )
    )
    med = result.scalar_one_or_none()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
    med.is_active = False  # soft delete
    await db.commit()


# ─── Supply Inventory ─────────────────────────────────────────────────────────

@router.get("/supplies", response_model=List[SupplyItemResponse])
async def list_supplies(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupplyItem).where(SupplyItem.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/supplies", response_model=SupplyItemResponse, status_code=201)
async def add_supply(
    data: SupplyItemCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    item = SupplyItem(user_id=current_user.id, **data.model_dump())
    if data.usage_per_day and data.usage_per_day > 0:
        days_left = data.quantity / data.usage_per_day
        item.estimated_depletion_date = datetime.now(timezone.utc) + timedelta(days=days_left)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
