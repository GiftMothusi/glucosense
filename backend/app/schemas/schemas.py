"""
GlucoSense Pydantic Schemas
All request and response models for the API.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.models import (
    DiabetesType, GlucoseUnit, GlucoseSource, GlucoseTag,
    InsulinType, InsulinDelivery, ActivityType, ActivityIntensity,
    MealType, InsightCategory, SubscriptionPlan,
)

MMOL_TO_MGDL = 18.0182


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── User ─────────────────────────────────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, gt=0, lt=300)
    weight_kg: Optional[float] = Field(None, gt=0, lt=500)
    country: Optional[str] = None
    timezone: Optional[str] = None
    glucose_unit: Optional[GlucoseUnit] = None
    push_token: Optional[str] = None
    notification_settings: Optional[dict] = None


class DiabetesProfileCreate(BaseModel):
    diabetes_type: DiabetesType
    diagnosis_year: Optional[int] = Field(None, ge=1900, le=2100)
    target_glucose_low: float = Field(default=3.9, ge=2.0, le=6.0)
    target_glucose_high: float = Field(default=10.0, ge=7.0, le=20.0)
    target_tir_percentage: float = Field(default=70.0, ge=0.0, le=100.0)
    target_hba1c: Optional[float] = Field(None, ge=3.0, le=20.0)
    uses_cgm: bool = False
    cgm_device: Optional[str] = None
    uses_insulin_pump: bool = False
    insulin_pump_model: Optional[str] = None
    carb_ratio: Optional[float] = Field(None, gt=0)
    correction_factor: Optional[float] = Field(None, gt=0)


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_premium: bool
    is_verified: bool
    avatar_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class UserDetailResponse(UserResponse):
    profile: Optional["UserProfileResponse"] = None
    diabetes_profile: Optional["DiabetesProfileResponse"] = None
    subscription: Optional["SubscriptionResponse"] = None


class UserProfileResponse(BaseModel):
    glucose_unit: GlucoseUnit
    height_cm: Optional[float]
    weight_kg: Optional[float]
    country: Optional[str]
    timezone: str
    onboarding_completed: bool

    model_config = {"from_attributes": True}


class DiabetesProfileResponse(BaseModel):
    diabetes_type: DiabetesType
    diagnosis_year: Optional[int]
    target_glucose_low: float
    target_glucose_high: float
    target_tir_percentage: float
    target_hba1c: Optional[float]
    uses_cgm: bool
    cgm_device: Optional[str]
    carb_ratio: Optional[float]
    correction_factor: Optional[float]

    model_config = {"from_attributes": True}


# ─── Glucose ─────────────────────────────────────────────────────────────────

class GlucoseReadingCreate(BaseModel):
    value: float = Field(gt=0, description="Glucose value in the user's preferred unit")
    unit: GlucoseUnit = GlucoseUnit.MMOL
    source: GlucoseSource = GlucoseSource.MANUAL
    tag: Optional[GlucoseTag] = None
    trend_arrow: Optional[str] = None
    trend_rate: Optional[float] = None
    notes: Optional[str] = None
    meal_id: Optional[int] = None
    recorded_at: Optional[datetime] = None  # defaults to now if not provided

    def to_mmol(self) -> float:
        if self.unit == GlucoseUnit.MGDL:
            return self.value / MMOL_TO_MGDL
        return self.value

    def to_mgdl(self) -> float:
        if self.unit == GlucoseUnit.MMOL:
            return self.value * MMOL_TO_MGDL
        return self.value


class GlucoseReadingResponse(BaseModel):
    id: int
    value_mmol: float
    value_mgdl: float
    source: GlucoseSource
    tag: Optional[GlucoseTag]
    trend_arrow: Optional[str]
    trend_rate: Optional[float]
    notes: Optional[str]
    meal_id: Optional[int]
    recorded_at: datetime

    model_config = {"from_attributes": True}


class GlucoseListResponse(BaseModel):
    readings: List[GlucoseReadingResponse]
    total: int
    page: int
    page_size: int


# ─── Insulin ─────────────────────────────────────────────────────────────────

class InsulinDoseCreate(BaseModel):
    insulin_name: str
    insulin_type: InsulinType
    delivery_method: InsulinDelivery = InsulinDelivery.PEN
    units: float = Field(gt=0, le=300)
    is_correction: bool = False
    is_basal: bool = False
    meal_id: Optional[int] = None
    glucose_at_dose: Optional[float] = None
    notes: Optional[str] = None
    administered_at: Optional[datetime] = None


class InsulinDoseResponse(BaseModel):
    id: int
    insulin_name: str
    insulin_type: InsulinType
    delivery_method: InsulinDelivery
    units: float
    is_correction: bool
    is_basal: bool
    meal_id: Optional[int]
    glucose_at_dose: Optional[float]
    notes: Optional[str]
    administered_at: datetime

    model_config = {"from_attributes": True}


class BolusCalculationRequest(BaseModel):
    current_glucose_mmol: float
    target_glucose_mmol: float
    carbs_g: float
    carb_ratio: float    # g carbs per unit
    correction_factor: float  # mmol/L per unit
    insulin_on_board: float = 0.0  # units already active


class BolusCalculationResponse(BaseModel):
    meal_bolus: float
    correction_bolus: float
    total_bolus: float
    iob_deducted: float
    recommended_bolus: float
    notes: str


# ─── Meals ───────────────────────────────────────────────────────────────────

class MealItemCreate(BaseModel):
    food_name: str
    barcode: Optional[str] = None
    quantity_g: float = Field(gt=0)
    carbs_g: float = Field(default=0.0, ge=0)
    protein_g: float = Field(default=0.0, ge=0)
    fat_g: float = Field(default=0.0, ge=0)
    calories: float = Field(default=0.0, ge=0)
    fiber_g: float = Field(default=0.0, ge=0)
    glycemic_index: Optional[float] = Field(None, ge=0, le=100)
    food_db_id: Optional[str] = None


class MealCreate(BaseModel):
    name: str
    meal_type: MealType
    items: List[MealItemCreate] = []
    notes: Optional[str] = None
    eaten_at: Optional[datetime] = None
    is_favourite: bool = False
    photo_url: Optional[str] = None


class MealItemResponse(BaseModel):
    id: int
    food_name: str
    quantity_g: float
    carbs_g: float
    protein_g: float
    fat_g: float
    calories: float
    fiber_g: float
    glycemic_index: Optional[float]

    model_config = {"from_attributes": True}


class MealResponse(BaseModel):
    id: int
    name: str
    meal_type: MealType
    total_carbs_g: float
    total_protein_g: float
    total_fat_g: float
    total_calories: float
    glycemic_index: Optional[float]
    glycemic_load: Optional[float]
    impact_score: Optional[float]
    photo_url: Optional[str]
    notes: Optional[str]
    is_favourite: bool
    eaten_at: datetime
    items: List[MealItemResponse] = []

    model_config = {"from_attributes": True}


class FoodSearchResponse(BaseModel):
    id: int
    name: str
    brand: Optional[str]
    carbs_per_100g: float
    protein_per_100g: float
    fat_per_100g: float
    calories_per_100g: float
    fiber_per_100g: float
    glycemic_index: Optional[float]
    source: Optional[str]

    model_config = {"from_attributes": True}


# ─── Activity ────────────────────────────────────────────────────────────────

class ActivityCreate(BaseModel):
    activity_type: ActivityType
    intensity: ActivityIntensity = ActivityIntensity.MODERATE
    duration_minutes: int = Field(gt=0, le=1440)
    steps: Optional[int] = None
    distance_km: Optional[float] = None
    calories_burned: Optional[float] = None
    heart_rate_avg: Optional[int] = None
    glucose_before: Optional[float] = None
    glucose_after: Optional[float] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None


class ActivityResponse(BaseModel):
    id: int
    activity_type: ActivityType
    intensity: ActivityIntensity
    duration_minutes: int
    steps: Optional[int]
    distance_km: Optional[float]
    calories_burned: Optional[float]
    glucose_before: Optional[float]
    glucose_after: Optional[float]
    notes: Optional[str]
    started_at: datetime

    model_config = {"from_attributes": True}


# ─── Analytics ───────────────────────────────────────────────────────────────

class TIRResponse(BaseModel):
    in_range_pct: float
    below_pct: float
    above_pct: float
    very_low_pct: float
    very_high_pct: float
    target_low: float
    target_high: float
    period_days: int
    reading_count: int


class GlucoseStatsResponse(BaseModel):
    average_mmol: float
    std_dev: float
    coefficient_of_variation: float
    estimated_hba1c: float
    min_mmol: float
    max_mmol: float
    tir: TIRResponse
    period_days: int


class InsightResponse(BaseModel):
    id: int
    category: InsightCategory
    title: str
    body: str
    data: Optional[dict]
    is_read: bool
    severity: str
    generated_at: datetime

    model_config = {"from_attributes": True}


class PredictionResponse(BaseModel):
    predicted_at: datetime
    horizon_minutes: int
    predicted_value_mmol: float
    confidence_low: Optional[float]
    confidence_high: Optional[float]
    hypo_risk_score: Optional[float]
    hyper_risk_score: Optional[float]

    model_config = {"from_attributes": True}


class WeeklyReportResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    stats: GlucoseStatsResponse
    insights: List[InsightResponse]
    best_day: Optional[str]
    worst_day: Optional[str]
    total_readings: int
    total_meals_logged: int
    total_insulin_units: float
    active_minutes: int


# ─── Medication ───────────────────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    med_type: Optional[str] = None
    times_of_day: List[str] = []
    start_date: Optional[datetime] = None
    notes: Optional[str] = None


class MedicationResponse(BaseModel):
    id: int
    name: str
    dose: Optional[str]
    frequency: Optional[str]
    med_type: Optional[str]
    times_of_day: List[str]
    is_active: bool
    start_date: Optional[datetime]

    model_config = {"from_attributes": True}


# ─── Care Portal ─────────────────────────────────────────────────────────────

class CarePortalLinkCreate(BaseModel):
    label: str
    permissions: dict = {
        "glucose": True,
        "meals": True,
        "insulin": False,
        "insights": True,
    }
    expires_days: Optional[int] = Field(None, ge=1, le=365)


class CarePortalLinkResponse(BaseModel):
    id: int
    token: str
    label: Optional[str]
    permissions: dict
    is_active: bool
    expires_at: Optional[datetime]
    last_accessed: Optional[datetime]
    share_url: str

    model_config = {"from_attributes": True}


# ─── Subscription ─────────────────────────────────────────────────────────────

class SubscriptionResponse(BaseModel):
    plan: SubscriptionPlan
    status: str
    current_period_end: Optional[datetime]

    model_config = {"from_attributes": True}


# ─── Emergency Contacts ───────────────────────────────────────────────────────

class EmergencyContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    relationship: Optional[str] = None
    notify_on_hypo: bool = True
    notify_on_hyper: bool = True
    hypo_threshold: float = 3.5
    hyper_threshold: float = 14.0


class EmergencyContactResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    relationship: Optional[str]
    notify_on_hypo: bool
    notify_on_hyper: bool

    model_config = {"from_attributes": True}


# ─── Supply Inventory ─────────────────────────────────────────────────────────

class SupplyItemCreate(BaseModel):
    name: str
    quantity: float = Field(gt=0)
    unit: str
    usage_per_day: Optional[float] = None
    low_stock_threshold: Optional[float] = None


class SupplyItemResponse(BaseModel):
    id: int
    name: str
    quantity: float
    unit: str
    usage_per_day: Optional[float]
    estimated_depletion_date: Optional[datetime]
    low_stock_threshold: Optional[float]

    model_config = {"from_attributes": True}


# Update forward references
UserDetailResponse.model_rebuild()
