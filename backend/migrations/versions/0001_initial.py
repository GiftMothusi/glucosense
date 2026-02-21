"""initial

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2025-02-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = None
branch_labels = None
depends_on = None


# ---------------------------------------------------------------------------
# Helpers — create/drop each PostgreSQL native ENUM type explicitly so they
# are managed by the migration and not silently auto-created per column.
# ---------------------------------------------------------------------------

def _create_enums():
    op.execute("""
        CREATE TYPE diabetestype AS ENUM
            ('type_1', 'type_2', 'gestational', 'prediabetes', 'other')
    """)
    op.execute("""
        CREATE TYPE glucoseunit AS ENUM ('mmol', 'mgdl')
    """)
    op.execute("""
        CREATE TYPE glucosesource AS ENUM ('manual', 'cgm', 'meter_bluetooth')
    """)
    op.execute("""
        CREATE TYPE glucosetag AS ENUM
            ('fasting', 'pre_meal', 'post_meal', 'bedtime', 'night',
             'exercise', 'sick', 'stress', 'other')
    """)
    op.execute("""
        CREATE TYPE insulintype AS ENUM
            ('rapid', 'short', 'intermediate', 'long', 'ultra_long', 'premixed')
    """)
    op.execute("""
        CREATE TYPE insulindelivery AS ENUM ('injection', 'pump', 'pen')
    """)
    op.execute("""
        CREATE TYPE activitytype AS ENUM
            ('walking', 'running', 'cycling', 'swimming', 'gym', 'yoga', 'sport', 'other')
    """)
    op.execute("""
        CREATE TYPE activityintensity AS ENUM ('low', 'moderate', 'high')
    """)
    op.execute("""
        CREATE TYPE mealtype AS ENUM
            ('breakfast', 'lunch', 'dinner', 'snack', 'other')
    """)
    op.execute("""
        CREATE TYPE insightcategory AS ENUM
            ('pattern', 'prediction', 'correlation', 'achievement', 'warning', 'tip')
    """)
    op.execute("""
        CREATE TYPE subscriptionplan AS ENUM
            ('free', 'premium_monthly', 'premium_annual')
    """)
    op.execute("""
        CREATE TYPE subscriptionstatus AS ENUM
            ('active', 'cancelled', 'expired', 'trial')
    """)


def _drop_enums():
    op.execute("DROP TYPE IF EXISTS diabetestype")
    op.execute("DROP TYPE IF EXISTS glucoseunit")
    op.execute("DROP TYPE IF EXISTS glucosesource")
    op.execute("DROP TYPE IF EXISTS glucosetag")
    op.execute("DROP TYPE IF EXISTS insulintype")
    op.execute("DROP TYPE IF EXISTS insulindelivery")
    op.execute("DROP TYPE IF EXISTS activitytype")
    op.execute("DROP TYPE IF EXISTS activityintensity")
    op.execute("DROP TYPE IF EXISTS mealtype")
    op.execute("DROP TYPE IF EXISTS insightcategory")
    op.execute("DROP TYPE IF EXISTS subscriptionplan")
    op.execute("DROP TYPE IF EXISTS subscriptionstatus")


# ---------------------------------------------------------------------------
# upgrade
# ---------------------------------------------------------------------------

def upgrade() -> None:
    _create_enums()

    # ── 1. users ─────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id',              sa.Integer(),     primary_key=True),
        sa.Column('email',           sa.String(255),   nullable=False),
        sa.Column('hashed_password', sa.String(255),   nullable=False),
        sa.Column('full_name',       sa.String(255),   nullable=False),
        sa.Column('is_active',       sa.Boolean(),     nullable=False, server_default='true'),
        sa.Column('is_premium',      sa.Boolean(),     nullable=False, server_default='false'),
        sa.Column('is_verified',     sa.Boolean(),     nullable=False, server_default='false'),
        sa.Column('avatar_url',      sa.String(512),   nullable=True),
        sa.Column('created_at',      sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('updated_at',      sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login_at',   sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_users_id',    'users', ['id'],    unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # ── 2. food_database ─────────────────────────────────────────────────────
    # No user FK — shared lookup table cached from OpenFoodFacts / USDA
    op.create_table(
        'food_database',
        sa.Column('id',               sa.Integer(),  primary_key=True),
        sa.Column('external_id',      sa.String(100), nullable=True),
        sa.Column('barcode',          sa.String(100), nullable=True),
        sa.Column('name',             sa.String(255), nullable=False),
        sa.Column('brand',            sa.String(255), nullable=True),
        sa.Column('carbs_per_100g',   sa.Float(),     nullable=False, server_default='0'),
        sa.Column('protein_per_100g', sa.Float(),     nullable=False, server_default='0'),
        sa.Column('fat_per_100g',     sa.Float(),     nullable=False, server_default='0'),
        sa.Column('calories_per_100g',sa.Float(),     nullable=False, server_default='0'),
        sa.Column('fiber_per_100g',   sa.Float(),     nullable=False, server_default='0'),
        sa.Column('glycemic_index',   sa.Float(),     nullable=True),
        # source: "openfoodfacts" | "usda" | "manual"
        sa.Column('source',           sa.String(50),  nullable=True),
        sa.Column('created_at',       sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
        sa.UniqueConstraint('external_id', name='uq_food_database_external_id'),
    )
    op.create_index('ix_food_database_barcode', 'food_database', ['barcode'], unique=False)
    op.create_index('ix_food_database_name',    'food_database', ['name'],    unique=False)

    # ── 3. user_profiles ─────────────────────────────────────────────────────
    op.create_table(
        'user_profiles',
        sa.Column('id',                    sa.Integer(),  primary_key=True),
        sa.Column('user_id',               sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('date_of_birth',         sa.DateTime(),  nullable=True),
        sa.Column('gender',                sa.String(50),  nullable=True),
        sa.Column('height_cm',             sa.Float(),     nullable=True),
        sa.Column('weight_kg',             sa.Float(),     nullable=True),
        sa.Column('country',               sa.String(100), nullable=True),
        sa.Column('timezone',              sa.String(100), nullable=True, server_default='UTC'),
        sa.Column('glucose_unit',
                  sa.Enum('mmol', 'mgdl', name='glucoseunit', create_type=False),
                  nullable=True, server_default='mmol'),
        sa.Column('onboarding_completed',  sa.Boolean(),  nullable=True, server_default='false'),
        sa.Column('push_token',            sa.String(512), nullable=True),
        sa.Column('notification_settings', postgresql.JSON(), nullable=True,
                  server_default='{}'),
        sa.Column('updated_at',            sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('user_id', name='uq_user_profiles_user_id'),
    )

    # ── 4. diabetes_profiles ─────────────────────────────────────────────────
    op.create_table(
        'diabetes_profiles',
        sa.Column('id',                  sa.Integer(), primary_key=True),
        sa.Column('user_id',             sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('diabetes_type',
                  sa.Enum('type_1', 'type_2', 'gestational', 'prediabetes', 'other',
                           name='diabetestype', create_type=False),
                  nullable=False),
        sa.Column('diagnosis_year',      sa.Integer(), nullable=True),
        # Targets stored in mmol/L
        sa.Column('target_glucose_low',  sa.Float(),   nullable=True, server_default='3.9'),
        sa.Column('target_glucose_high', sa.Float(),   nullable=True, server_default='10.0'),
        sa.Column('target_tir_percentage', sa.Float(), nullable=True, server_default='70.0'),
        sa.Column('target_hba1c',        sa.Float(),   nullable=True),
        sa.Column('uses_cgm',            sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('cgm_device',          sa.String(100), nullable=True),
        sa.Column('uses_insulin_pump',   sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('insulin_pump_model',  sa.String(100), nullable=True),
        sa.Column('carb_ratio',          sa.Float(),   nullable=True),
        sa.Column('correction_factor',   sa.Float(),   nullable=True),
        sa.Column('updated_at',          sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('user_id', name='uq_diabetes_profiles_user_id'),
    )

    # ── 5. subscriptions ─────────────────────────────────────────────────────
    op.create_table(
        'subscriptions',
        sa.Column('id',                     sa.Integer(), primary_key=True),
        sa.Column('user_id',                sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('plan',
                  sa.Enum('free', 'premium_monthly', 'premium_annual',
                           name='subscriptionplan', create_type=False),
                  nullable=False, server_default='free'),
        sa.Column('status',
                  sa.Enum('active', 'cancelled', 'expired', 'trial',
                           name='subscriptionstatus', create_type=False),
                  nullable=False, server_default='active'),
        # provider: "google_play" | "apple" | "stripe" | "manual"
        sa.Column('provider',                    sa.String(50),  nullable=True),
        sa.Column('provider_subscription_id',    sa.String(255), nullable=True),
        sa.Column('current_period_start',        sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end',          sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at',                  sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
        sa.Column('updated_at',                  sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('user_id', name='uq_subscriptions_user_id'),
    )

    # ── 6. meals ─────────────────────────────────────────────────────────────
    # Created before glucose_readings / insulin_doses because they FK to meals
    op.create_table(
        'meals',
        sa.Column('id',              sa.Integer(),  primary_key=True),
        sa.Column('user_id',         sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('name',            sa.String(255), nullable=False),
        sa.Column('meal_type',
                  sa.Enum('breakfast', 'lunch', 'dinner', 'snack', 'other',
                           name='mealtype', create_type=False),
                  nullable=False),
        sa.Column('total_carbs_g',   sa.Float(), nullable=True, server_default='0'),
        sa.Column('total_protein_g', sa.Float(), nullable=True, server_default='0'),
        sa.Column('total_fat_g',     sa.Float(), nullable=True, server_default='0'),
        sa.Column('total_calories',  sa.Float(), nullable=True, server_default='0'),
        sa.Column('glycemic_index',  sa.Float(), nullable=True),
        sa.Column('glycemic_load',   sa.Float(), nullable=True),
        sa.Column('photo_url',       sa.String(512), nullable=True),
        sa.Column('notes',           sa.Text(),  nullable=True),
        sa.Column('is_favourite',    sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('impact_score',    sa.Float(),   nullable=True),
        sa.Column('eaten_at',        sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at',      sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_meal_user_eaten', 'meals', ['user_id', 'eaten_at'], unique=False)

    # ── 7. glucose_readings ───────────────────────────────────────────────────
    op.create_table(
        'glucose_readings',
        sa.Column('id',          sa.Integer(), primary_key=True),
        sa.Column('user_id',     sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('value_mmol',  sa.Float(), nullable=False),
        sa.Column('value_mgdl',  sa.Float(), nullable=False),
        sa.Column('source',
                  sa.Enum('manual', 'cgm', 'meter_bluetooth',
                           name='glucosesource', create_type=False),
                  nullable=True, server_default='manual'),
        sa.Column('tag',
                  sa.Enum('fasting', 'pre_meal', 'post_meal', 'bedtime', 'night',
                           'exercise', 'sick', 'stress', 'other',
                           name='glucosetag', create_type=False),
                  nullable=True),
        # trend_arrow: "rising_fast" | "rising" | "stable" | "falling" | "falling_fast"
        sa.Column('trend_arrow', sa.String(20),  nullable=True),
        sa.Column('notes',       sa.Text(),      nullable=True),
        # Nullable FK — reading may or may not be linked to a meal
        sa.Column('meal_id',     sa.Integer(),
                  sa.ForeignKey('meals.id', ondelete='SET NULL'),
                  nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at',  sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_glucose_readings_id',          'glucose_readings', ['id'],          unique=False)
    op.create_index('ix_glucose_readings_user_id',     'glucose_readings', ['user_id'],     unique=False)
    op.create_index('ix_glucose_readings_recorded_at', 'glucose_readings', ['recorded_at'], unique=False)
    op.create_index('ix_glucose_user_time',            'glucose_readings',
                    ['user_id', 'recorded_at'], unique=False)

    # ── 8. glucose_predictions ───────────────────────────────────────────────
    op.create_table(
        'glucose_predictions',
        sa.Column('id',                   sa.Integer(), primary_key=True),
        sa.Column('user_id',              sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('predicted_at',         sa.DateTime(timezone=True), nullable=False),
        sa.Column('horizon_minutes',      sa.Integer(), nullable=False),
        sa.Column('predicted_value_mmol', sa.Float(),   nullable=False),
        sa.Column('confidence_low',       sa.Float(),   nullable=True),
        sa.Column('confidence_high',      sa.Float(),   nullable=True),
        sa.Column('hypo_risk_score',      sa.Float(),   nullable=True),
        sa.Column('hyper_risk_score',     sa.Float(),   nullable=True),
        sa.Column('model_version',        sa.String(50), nullable=True),
        sa.Column('created_at',           sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )

    # ── 9. insulin_doses ─────────────────────────────────────────────────────
    op.create_table(
        'insulin_doses',
        sa.Column('id',              sa.Integer(), primary_key=True),
        sa.Column('user_id',         sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('insulin_name',    sa.String(255), nullable=False),
        sa.Column('insulin_type',
                  sa.Enum('rapid', 'short', 'intermediate', 'long', 'ultra_long', 'premixed',
                           name='insulintype', create_type=False),
                  nullable=False),
        sa.Column('delivery_method',
                  sa.Enum('injection', 'pump', 'pen',
                           name='insulindelivery', create_type=False),
                  nullable=True, server_default='pen'),
        sa.Column('units',           sa.Float(),   nullable=False),
        sa.Column('is_correction',   sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('is_basal',        sa.Boolean(), nullable=True, server_default='false'),
        # Nullable FK — dose may or may not be linked to a specific meal
        sa.Column('meal_id',         sa.Integer(),
                  sa.ForeignKey('meals.id', ondelete='SET NULL'),
                  nullable=True),
        sa.Column('glucose_at_dose', sa.Float(),   nullable=True),
        sa.Column('notes',           sa.Text(),    nullable=True),
        sa.Column('administered_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at',      sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_insulin_doses_user_id', 'insulin_doses', ['user_id'], unique=False)

    # ── 10. meal_items ────────────────────────────────────────────────────────
    op.create_table(
        'meal_items',
        sa.Column('id',            sa.Integer(), primary_key=True),
        sa.Column('meal_id',       sa.Integer(),
                  sa.ForeignKey('meals.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('food_name',     sa.String(255), nullable=False),
        sa.Column('barcode',       sa.String(100), nullable=True),
        sa.Column('quantity_g',    sa.Float(),     nullable=False),
        sa.Column('carbs_g',       sa.Float(),     nullable=True, server_default='0'),
        sa.Column('protein_g',     sa.Float(),     nullable=True, server_default='0'),
        sa.Column('fat_g',         sa.Float(),     nullable=True, server_default='0'),
        sa.Column('calories',      sa.Float(),     nullable=True, server_default='0'),
        sa.Column('fiber_g',       sa.Float(),     nullable=True, server_default='0'),
        sa.Column('glycemic_index',sa.Float(),     nullable=True),
        # external ID from OpenFoodFacts / USDA
        sa.Column('food_db_id',    sa.String(100), nullable=True),
    )

    # ── 11. activities ────────────────────────────────────────────────────────
    op.create_table(
        'activities',
        sa.Column('id',            sa.Integer(), primary_key=True),
        sa.Column('user_id',       sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('activity_type',
                  sa.Enum('walking', 'running', 'cycling', 'swimming',
                           'gym', 'yoga', 'sport', 'other',
                           name='activitytype', create_type=False),
                  nullable=False),
        sa.Column('intensity',
                  sa.Enum('low', 'moderate', 'high',
                           name='activityintensity', create_type=False),
                  nullable=True, server_default='moderate'),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('steps',            sa.Integer(), nullable=True),
        sa.Column('distance_km',      sa.Float(),   nullable=True),
        sa.Column('calories_burned',  sa.Float(),   nullable=True),
        sa.Column('heart_rate_avg',   sa.Integer(), nullable=True),
        sa.Column('glucose_before',   sa.Float(),   nullable=True),
        sa.Column('glucose_after',    sa.Float(),   nullable=True),
        sa.Column('notes',            sa.Text(),    nullable=True),
        sa.Column('started_at',       sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at',       sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_activities_id',         'activities', ['id'],         unique=False)
    op.create_index('ix_activities_user_id',    'activities', ['user_id'],    unique=False)
    op.create_index('ix_activities_started_at', 'activities', ['started_at'], unique=False)

    # ── 12. medications ───────────────────────────────────────────────────────
    op.create_table(
        'medications',
        sa.Column('id',          sa.Integer(), primary_key=True),
        sa.Column('user_id',     sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('name',        sa.String(255), nullable=False),
        sa.Column('dose',        sa.String(100), nullable=True),
        sa.Column('frequency',   sa.String(100), nullable=True),
        sa.Column('med_type',    sa.String(100), nullable=True),
        # JSON list e.g. ["08:00", "20:00"]
        sa.Column('times_of_day',postgresql.JSON(), nullable=True, server_default='[]'),
        sa.Column('start_date',  sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active',   sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('deleted_at',  sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes',       sa.Text(), nullable=True),
        sa.Column('created_at',  sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_medications_user_id', 'medications', ['user_id'], unique=False)

    # ── 13. medication_logs ───────────────────────────────────────────────────
    op.create_table(
        'medication_logs',
        sa.Column('id',            sa.Integer(), primary_key=True),
        sa.Column('medication_id', sa.Integer(),
                  sa.ForeignKey('medications.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('user_id',       sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        # status: "taken" | "skipped" | "missed"
        sa.Column('status',        sa.String(20),  nullable=False, server_default='taken'),
        sa.Column('notes',         sa.Text(),      nullable=True),
        sa.Column('taken_at',      sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at',    sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_medication_logs_user_id', 'medication_logs', ['user_id'], unique=False)

    # ── 14. lab_results ───────────────────────────────────────────────────────
    op.create_table(
        'lab_results',
        sa.Column('id',             sa.Integer(), primary_key=True),
        sa.Column('user_id',        sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        # test_name: "HbA1c" | "eGFR" | "LDL" | "blood_pressure" etc.
        sa.Column('test_name',      sa.String(255), nullable=False),
        sa.Column('value',          sa.Float(),     nullable=False),
        sa.Column('unit',           sa.String(50),  nullable=False),
        sa.Column('reference_low',  sa.Float(),     nullable=True),
        sa.Column('reference_high', sa.Float(),     nullable=True),
        sa.Column('lab_name',       sa.String(255), nullable=True),
        sa.Column('tested_at',      sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at',     sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_lab_results_user_id', 'lab_results', ['user_id'], unique=False)

    # ── 15. appointments ──────────────────────────────────────────────────────
    op.create_table(
        'appointments',
        sa.Column('id',               sa.Integer(), primary_key=True),
        sa.Column('user_id',          sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('title',            sa.String(255), nullable=False),
        sa.Column('provider_name',    sa.String(255), nullable=True),
        sa.Column('location',         sa.String(512), nullable=True),
        # appointment_type: "endocrinologist" | "gp" | "dietitian" | "ophthalmologist" etc.
        sa.Column('appointment_type', sa.String(100), nullable=True),
        sa.Column('notes',            sa.Text(),      nullable=True),
        sa.Column('reminder_minutes', sa.Integer(),   nullable=True, server_default='60'),
        sa.Column('is_completed',     sa.Boolean(),   nullable=True, server_default='false'),
        sa.Column('scheduled_at',     sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at',       sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_appointments_user_id',    'appointments', ['user_id'],     unique=False)
    op.create_index('ix_appointments_scheduled',  'appointments', ['scheduled_at'], unique=False)

    # ── 16. insights ──────────────────────────────────────────────────────────
    op.create_table(
        'insights',
        sa.Column('id',           sa.Integer(), primary_key=True),
        sa.Column('user_id',      sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('category',
                  sa.Enum('pattern', 'prediction', 'correlation',
                           'achievement', 'warning', 'tip',
                           name='insightcategory', create_type=False),
                  nullable=False),
        sa.Column('title',        sa.String(255), nullable=False),
        sa.Column('body',         sa.Text(),      nullable=False),
        sa.Column('data',         postgresql.JSON(), nullable=True),
        sa.Column('is_read',      sa.Boolean(),  nullable=True, server_default='false'),
        sa.Column('is_dismissed', sa.Boolean(),  nullable=True, server_default='false'),
        # severity: "info" | "warning" | "critical"
        sa.Column('severity',     sa.String(20), nullable=True, server_default='info'),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
        sa.Column('valid_until',  sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_insights_id',      'insights', ['id'],      unique=False)
    op.create_index('ix_insights_user_id', 'insights', ['user_id'], unique=False)

    # ── 17. glucose_patterns ──────────────────────────────────────────────────
    op.create_table(
        'glucose_patterns',
        sa.Column('id',           sa.Integer(), primary_key=True),
        sa.Column('user_id',      sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('pattern_type', sa.String(100), nullable=False),
        sa.Column('description',  sa.Text(),      nullable=False),
        sa.Column('data',         postgresql.JSON(), nullable=True),
        # 0.0 – 1.0 confidence score
        sa.Column('confidence',   sa.Float(), nullable=True),
        sa.Column('computed_at',  sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
        sa.UniqueConstraint('user_id', 'pattern_type',
                            name='uq_glucose_patterns_user_pattern'),
    )
    op.create_index('ix_glucose_patterns_user_id', 'glucose_patterns', ['user_id'], unique=False)

    # ── 18. correlation_cache ─────────────────────────────────────────────────
    op.create_table(
        'correlation_cache',
        sa.Column('id',              sa.Integer(), primary_key=True),
        sa.Column('user_id',         sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('variable_a',      sa.String(100), nullable=False),
        sa.Column('variable_b',      sa.String(100), nullable=False),
        sa.Column('pearson_r',       sa.Float(), nullable=True),
        sa.Column('spearman_r',      sa.Float(), nullable=True),
        sa.Column('p_value',         sa.Float(), nullable=True),
        sa.Column('is_significant',  sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('insight_text',    sa.Text(),  nullable=True),
        sa.Column('computed_at',     sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
        sa.UniqueConstraint('user_id', 'variable_a', 'variable_b',
                            name='uq_correlation_cache'),
    )
    op.create_index('ix_correlation_cache_user_id', 'correlation_cache', ['user_id'], unique=False)

    # ── 19. meal_impact_scores ────────────────────────────────────────────────
    op.create_table(
        'meal_impact_scores',
        sa.Column('id',                  sa.Integer(), primary_key=True),
        sa.Column('user_id',             sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        # SHA-256 hash of normalised meal name for reliable lookups
        sa.Column('meal_name_hash',      sa.String(64),  nullable=False),
        sa.Column('meal_display_name',   sa.String(255), nullable=False),
        sa.Column('avg_peak_mmol',       sa.Float(), nullable=True),
        sa.Column('avg_auc',             sa.Float(), nullable=True),
        sa.Column('avg_spike_magnitude', sa.Float(), nullable=True),
        sa.Column('impact_score',        sa.Float(), nullable=True),
        sa.Column('sample_count',        sa.Integer(), nullable=True, server_default='0'),
        sa.Column('last_computed',       sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('user_id', 'meal_name_hash', name='uq_meal_impact'),
    )
    op.create_index('ix_meal_impact_scores_user_id', 'meal_impact_scores', ['user_id'], unique=False)

    # ── 20. emergency_contacts ────────────────────────────────────────────────
    op.create_table(
        'emergency_contacts',
        sa.Column('id',                sa.Integer(), primary_key=True),
        sa.Column('user_id',           sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('name',              sa.String(255), nullable=False),
        sa.Column('phone',             sa.String(50),  nullable=True),
        sa.Column('email',             sa.String(255), nullable=True),
        # relationship_type: "partner" | "parent" | "sibling" | "doctor" etc.
        sa.Column('relationship_type', sa.String(100), nullable=True),
        sa.Column('notify_on_hypo',    sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('notify_on_hyper',   sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('hypo_threshold',    sa.Float(),   nullable=True, server_default='3.5'),
        sa.Column('hyper_threshold',   sa.Float(),   nullable=True, server_default='14.0'),
        sa.Column('created_at',        sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_emergency_contacts_user_id', 'emergency_contacts', ['user_id'], unique=False)

    # ── 21. care_portal_links ─────────────────────────────────────────────────
    op.create_table(
        'care_portal_links',
        sa.Column('id',            sa.Integer(), primary_key=True),
        sa.Column('user_id',       sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        # Secure random token for the read-only portal URL
        sa.Column('token',         sa.String(255), nullable=False),
        sa.Column('label',         sa.String(255), nullable=True),
        # JSON: {"glucose": true, "meals": true, "insulin": false, "insights": true}
        sa.Column('permissions',   postgresql.JSON(), nullable=True, server_default='{}'),
        sa.Column('is_active',     sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('expires_at',    sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_accessed', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at',    sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_care_portal_links_user_id', 'care_portal_links', ['user_id'], unique=False)
    op.create_index('ix_care_portal_links_token',   'care_portal_links', ['token'],   unique=True)

    # ── 22. supply_inventory ─────────────────────────────────────────────────
    # FIXED: table name matches ORM model __tablename__ = "supply_inventory"
    op.create_table(
        'supply_inventory',
        sa.Column('id',                       sa.Integer(), primary_key=True),
        sa.Column('user_id',                  sa.Integer(),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('name',                     sa.String(255), nullable=False),
        sa.Column('quantity',                 sa.Float(),     nullable=False),
        sa.Column('unit',                     sa.String(50),  nullable=False),
        sa.Column('usage_per_day',            sa.Float(),     nullable=True),
        # Stored, not computed — updated by background worker
        sa.Column('estimated_depletion_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('low_stock_threshold',      sa.Float(),     nullable=True),
        sa.Column('created_at',               sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.text('now()')),
    )
    # FIXED: index name and table reference match corrected table name
    op.create_index('ix_supply_inventory_user_id', 'supply_inventory', ['user_id'], unique=False)


# ---------------------------------------------------------------------------
# downgrade — drops in exact reverse creation order
# ---------------------------------------------------------------------------

def downgrade() -> None:
    op.drop_table('supply_inventory')  # FIXED: matches corrected table name
    op.drop_table('care_portal_links')
    op.drop_table('emergency_contacts')
    op.drop_table('meal_impact_scores')
    op.drop_table('correlation_cache')
    op.drop_table('glucose_patterns')
    op.drop_table('insights')
    op.drop_table('appointments')
    op.drop_table('lab_results')
    op.drop_table('medication_logs')
    op.drop_table('medications')
    op.drop_table('activities')
    op.drop_table('meal_items')
    op.drop_table('insulin_doses')
    op.drop_table('glucose_predictions')
    op.drop_table('glucose_readings')
    op.drop_table('meals')
    op.drop_table('subscriptions')
    op.drop_table('diabetes_profiles')
    op.drop_table('user_profiles')
    op.drop_table('food_database')
    op.drop_table('users')

    _drop_enums()