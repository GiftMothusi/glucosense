"""
GlucoSense Database Models
All SQLAlchemy ORM models for the application.
"""
import enum
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ─── Enums ───────────────────────────────────────────────────────────────────

class DiabetesType(str, enum.Enum):
    TYPE_1 = "type_1"
    TYPE_2 = "type_2"
    GESTATIONAL = "gestational"
    PREDIABETES = "prediabetes"
    OTHER = "other"

class GlucoseUnit(str, enum.Enum):
    MMOL = "mmol"
    MGDL = "mgdl"

class GlucoseSource(str, enum.Enum):
    MANUAL = "manual"
    CGM = "cgm"
    METER_BLUETOOTH = "meter_bluetooth"

class GlucoseTag(str, enum.Enum):
    FASTING = "fasting"
    PRE_MEAL = "pre_meal"
    POST_MEAL = "post_meal"
    BEDTIME = "bedtime"
    NIGHT = "night"
    EXERCISE = "exercise"
    SICK = "sick"
    STRESS = "stress"
    OTHER = "other"

class InsulinType(str, enum.Enum):
    RAPID = "rapid"
    SHORT = "short"
    INTERMEDIATE = "intermediate"
    LONG = "long"
    ULTRA_LONG = "ultra_long"
    PREMIXED = "premixed"

class InsulinDelivery(str, enum.Enum):
    INJECTION = "injection"
    PUMP = "pump"
    PEN = "pen"

class ActivityType(str, enum.Enum):
    WALKING = "walking"
    RUNNING = "running"
    CYCLING = "cycling"
    SWIMMING = "swimming"
    GYM = "gym"
    YOGA = "yoga"
    SPORT = "sport"
    OTHER = "other"

class ActivityIntensity(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"

class MealType(str, enum.Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"
    OTHER = "other"

class InsightCategory(str, enum.Enum):
    PATTERN = "pattern"
    PREDICTION = "prediction"
    CORRELATION = "correlation"
    ACHIEVEMENT = "achievement"
    WARNING = "warning"
    TIP = "tip"

class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    PREMIUM_MONTHLY = "premium_monthly"
    PREMIUM_ANNUAL = "premium_annual"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"


# ─── User & Profile ───────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    avatar_url = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    diabetes_profile = relationship("DiabetesProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    glucose_readings = relationship("GlucoseReading", back_populates="user", cascade="all, delete-orphan")
    insulin_doses = relationship("InsulinDose", back_populates="user", cascade="all, delete-orphan")
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    lab_results = relationship("LabResult", back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="user", cascade="all, delete-orphan")
    emergency_contacts = relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    care_portal_links = relationship("CarePortalLink", back_populates="user", cascade="all, delete-orphan")
    supply_inventory = relationship("SupplyItem", back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("GlucosePrediction", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(50), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    country = Column(String(100), nullable=True)
    timezone = Column(String(100), default="UTC")
    glucose_unit = Column(Enum(GlucoseUnit), default=GlucoseUnit.MMOL)
    onboarding_completed = Column(Boolean, default=False)
    push_token = Column(String(512), nullable=True)
    notification_settings = Column(JSON, default=dict)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="profile")


class DiabetesProfile(Base):
    __tablename__ = "diabetes_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    diabetes_type = Column(Enum(DiabetesType), nullable=False)
    diagnosis_year = Column(Integer, nullable=True)
    target_glucose_low = Column(Float, default=3.9)   # mmol/L
    target_glucose_high = Column(Float, default=10.0)
    target_tir_percentage = Column(Float, default=70.0)
    target_hba1c = Column(Float, nullable=True)
    uses_cgm = Column(Boolean, default=False)
    cgm_device = Column(String(100), nullable=True)
    uses_insulin_pump = Column(Boolean, default=False)
    insulin_pump_model = Column(String(100), nullable=True)
    carb_ratio = Column(Float, nullable=True)         # grams of carbs per unit of insulin
    correction_factor = Column(Float, nullable=True)  # mmol/L drop per unit of insulin
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="diabetes_profile")


# ─── Glucose ─────────────────────────────────────────────────────────────────

class GlucoseReading(Base):
    __tablename__ = "glucose_readings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    value_mmol = Column(Float, nullable=False)        # always stored as mmol/L
    value_mgdl = Column(Float, nullable=False)        # also stored for display
    source = Column(Enum(GlucoseSource), default=GlucoseSource.MANUAL)
    tag = Column(Enum(GlucoseTag), nullable=True)
    trend_arrow = Column(String(20), nullable=True)   # "rising", "falling", "stable", etc.
    trend_rate = Column(Float, nullable=True)         # mmol/L per minute
    notes = Column(Text, nullable=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=True)
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="glucose_readings")
    meal = relationship("Meal", back_populates="glucose_readings")

    __table_args__ = (
        Index("ix_glucose_user_recorded", "user_id", "recorded_at"),
    )


class GlucosePrediction(Base):
    __tablename__ = "glucose_predictions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_at = Column(DateTime(timezone=True), nullable=False)  # when prediction is FOR
    generated_at = Column(DateTime(timezone=True), default=utcnow)
    horizon_minutes = Column(Integer, nullable=False)               # 15, 30, 60
    predicted_value_mmol = Column(Float, nullable=False)
    confidence_low = Column(Float, nullable=True)
    confidence_high = Column(Float, nullable=True)
    model_version = Column(String(50), nullable=True)
    hypo_risk_score = Column(Float, nullable=True)                  # 0–100
    hyper_risk_score = Column(Float, nullable=True)

    user = relationship("User", back_populates="predictions")


# ─── Insulin ─────────────────────────────────────────────────────────────────

class InsulinDose(Base):
    __tablename__ = "insulin_doses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    insulin_name = Column(String(100), nullable=False)
    insulin_type = Column(Enum(InsulinType), nullable=False)
    delivery_method = Column(Enum(InsulinDelivery), default=InsulinDelivery.PEN)
    units = Column(Float, nullable=False)
    is_correction = Column(Boolean, default=False)
    is_basal = Column(Boolean, default=False)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=True)
    glucose_at_dose = Column(Float, nullable=True)   # mmol/L at time of injection
    notes = Column(Text, nullable=True)
    administered_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="insulin_doses")
    meal = relationship("Meal", back_populates="insulin_doses")

    __table_args__ = (
        Index("ix_insulin_user_administered", "user_id", "administered_at"),
    )


# ─── Nutrition ───────────────────────────────────────────────────────────────

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    meal_type = Column(Enum(MealType), nullable=False)
    total_carbs_g = Column(Float, default=0.0)
    total_protein_g = Column(Float, default=0.0)
    total_fat_g = Column(Float, default=0.0)
    total_calories = Column(Float, default=0.0)
    total_fiber_g = Column(Float, default=0.0)
    glycemic_index = Column(Float, nullable=True)
    glycemic_load = Column(Float, nullable=True)
    photo_url = Column(String(512), nullable=True)
    notes = Column(Text, nullable=True)
    is_favourite = Column(Boolean, default=False)
    impact_score = Column(Float, nullable=True)      # computed by analytics engine
    eaten_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")
    glucose_readings = relationship("GlucoseReading", back_populates="meal")
    insulin_doses = relationship("InsulinDose", back_populates="meal")

    __table_args__ = (
        Index("ix_meal_user_eaten", "user_id", "eaten_at"),
    )


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True)
    meal_id = Column(Integer, ForeignKey("meals.id", ondelete="CASCADE"), nullable=False)
    food_name = Column(String(255), nullable=False)
    barcode = Column(String(100), nullable=True)
    quantity_g = Column(Float, nullable=False)
    carbs_g = Column(Float, default=0.0)
    protein_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    calories = Column(Float, default=0.0)
    fiber_g = Column(Float, default=0.0)
    glycemic_index = Column(Float, nullable=True)
    food_db_id = Column(String(100), nullable=True)  # OpenFoodFacts / USDA ID

    meal = relationship("Meal", back_populates="items")


class FoodDatabase(Base):
    """Local cache of frequently used foods to avoid external API calls."""
    __tablename__ = "food_database"

    id = Column(Integer, primary_key=True)
    external_id = Column(String(100), unique=True, nullable=True)
    barcode = Column(String(100), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    brand = Column(String(255), nullable=True)
    carbs_per_100g = Column(Float, default=0.0)
    protein_per_100g = Column(Float, default=0.0)
    fat_per_100g = Column(Float, default=0.0)
    calories_per_100g = Column(Float, default=0.0)
    fiber_per_100g = Column(Float, default=0.0)
    glycemic_index = Column(Float, nullable=True)
    source = Column(String(50), nullable=True)   # "openfoodfacts", "usda", "manual"
    created_at = Column(DateTime(timezone=True), default=utcnow)


# ─── Activity ────────────────────────────────────────────────────────────────

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(Enum(ActivityType), nullable=False)
    intensity = Column(Enum(ActivityIntensity), default=ActivityIntensity.MODERATE)
    duration_minutes = Column(Integer, nullable=False)
    steps = Column(Integer, nullable=True)
    distance_km = Column(Float, nullable=True)
    calories_burned = Column(Float, nullable=True)
    heart_rate_avg = Column(Integer, nullable=True)
    glucose_before = Column(Float, nullable=True)
    glucose_after = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="activities")


# ─── Medications ─────────────────────────────────────────────────────────────

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    dose = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)      # "once daily", "twice daily", etc.
    med_type = Column(String(100), nullable=True)       # "metformin", "sglt2", etc.
    times_of_day = Column(JSON, default=list)           # ["08:00", "20:00"]
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="medications")
    logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False)
    taken = Column(Boolean, default=True)
    skipped_reason = Column(String(255), nullable=True)
    taken_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    medication = relationship("Medication", back_populates="logs")


# ─── Clinical ────────────────────────────────────────────────────────────────

class LabResult(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    test_name = Column(String(255), nullable=False)   # "HbA1c", "eGFR", "LDL", etc.
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    reference_low = Column(Float, nullable=True)
    reference_high = Column(Float, nullable=True)
    lab_name = Column(String(255), nullable=True)
    tested_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="lab_results")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    provider_name = Column(String(255), nullable=True)
    location = Column(String(512), nullable=True)
    appointment_type = Column(String(100), nullable=True)  # "endocrinologist", "gp", "dietitian"
    notes = Column(Text, nullable=True)
    reminder_minutes = Column(Integer, default=60)
    is_completed = Column(Boolean, default=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="appointments")


# ─── Analytics & Insights ────────────────────────────────────────────────────

class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(Enum(InsightCategory), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)              # supporting chart data
    is_read = Column(Boolean, default=False)
    is_dismissed = Column(Boolean, default=False)
    severity = Column(String(20), default="info")  # "info", "warning", "critical"
    generated_at = Column(DateTime(timezone=True), default=utcnow)
    valid_until = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="insights")


class GlucosePattern(Base):
    """Pre-computed pattern records updated by the analytics worker."""
    __tablename__ = "glucose_patterns"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pattern_type = Column(String(100), nullable=False)  # "dawn_phenomenon", "post_meal_spike", etc.
    description = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=True)           # 0.0 – 1.0
    computed_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "pattern_type", name="uq_glucose_patterns_user_pattern"),
    )


class CorrelationCache(Base):
    __tablename__ = "correlation_cache"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variable_a = Column(String(100), nullable=False)
    variable_b = Column(String(100), nullable=False)
    pearson_r = Column(Float, nullable=True)
    spearman_r = Column(Float, nullable=True)
    p_value = Column(Float, nullable=True)
    is_significant = Column(Boolean, default=False)
    insight_text = Column(Text, nullable=True)
    computed_at = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "variable_a", "variable_b", name="uq_correlation_cache"),
    )


class MealImpactScore(Base):
    __tablename__ = "meal_impact_scores"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_name_hash = Column(String(64), nullable=False)   # hash of normalised meal name
    meal_display_name = Column(String(255), nullable=False)
    avg_peak_mmol = Column(Float, nullable=True)
    avg_auc = Column(Float, nullable=True)                # area under glucose curve
    avg_spike_magnitude = Column(Float, nullable=True)
    impact_score = Column(Float, nullable=True)           # 0–100
    sample_count = Column(Integer, default=0)
    last_computed = Column(DateTime(timezone=True), default=utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "meal_name_hash", name="uq_meal_impact"),
    )


# ─── Care & Social ───────────────────────────────────────────────────────────

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    relationship_type = Column(String(100), nullable=True)
    notify_on_hypo = Column(Boolean, default=True)
    notify_on_hyper = Column(Boolean, default=True)
    hypo_threshold = Column(Float, default=3.5)
    hyper_threshold = Column(Float, default=14.0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="emergency_contacts")


class CarePortalLink(Base):
    __tablename__ = "care_portal_links"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    label = Column(String(255), nullable=True)             # "Dr Smith", "My Mom"
    permissions = Column(JSON, default=dict)               # {"glucose": True, "meals": False, ...}
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_accessed = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="care_portal_links")


class SupplyItem(Base):
    __tablename__ = "supply_inventory"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)              # "strips", "units", "sensors"
    usage_per_day = Column(Float, nullable=True)
    estimated_depletion_date = Column(DateTime, nullable=True)
    low_stock_threshold = Column(Float, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="supply_inventory")


# ─── Subscription ─────────────────────────────────────────────────────────────

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    provider = Column(String(50), nullable=True)          # "stripe", "google_play", "apple"
    provider_subscription_id = Column(String(255), nullable=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="subscription")
