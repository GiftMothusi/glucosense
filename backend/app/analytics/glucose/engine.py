"""
GlucoSense Glucose Analytics Engine
Core analytics: TIR, statistics, pattern detection, HbA1c estimation.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from scipy import stats


MMOL_TO_MGDL = 18.0182


@dataclass
class GlucoseStats:
    average_mmol: float
    std_dev: float
    coefficient_of_variation: float
    estimated_hba1c: float
    min_mmol: float
    max_mmol: float
    in_range_pct: float
    below_pct: float
    above_pct: float
    very_low_pct: float
    very_high_pct: float
    reading_count: int
    period_days: int


@dataclass
class Pattern:
    pattern_type: str
    description: str
    confidence: float
    data: dict


def mmol_to_mgdl(mmol: float) -> float:
    return round(mmol * MMOL_TO_MGDL, 1)


def mgdl_to_mmol(mgdl: float) -> float:
    return round(mgdl / MMOL_TO_MGDL, 2)


def estimate_hba1c(average_glucose_mmol: float) -> float:
    """
    ADAG (A1C-Derived Average Glucose) formula.
    eAG (mmol/L) = (HbA1c * 1.5944) - 2.5942
    Reversed: HbA1c = (eAG + 2.5942) / 1.5944
    """
    hba1c = (average_glucose_mmol + 2.5942) / 1.5944
    return round(hba1c, 1)


def compute_tir(
    readings: List[float],
    low: float = 3.9,
    high: float = 10.0,
    very_low: float = 3.0,
    very_high: float = 13.9,
) -> Dict[str, float]:
    """Compute Time In Range percentages."""
    if not readings:
        return {k: 0.0 for k in ["in_range", "below", "above", "very_low", "very_high"]}

    arr = np.array(readings)
    n = len(arr)

    in_range = np.sum((arr >= low) & (arr <= high)) / n * 100
    below = np.sum((arr < low) & (arr >= very_low)) / n * 100
    very_low_pct = np.sum(arr < very_low) / n * 100
    above = np.sum((arr > high) & (arr <= very_high)) / n * 100
    very_high_pct = np.sum(arr > very_high) / n * 100

    return {
        "in_range_pct": round(in_range, 1),
        "below_pct": round(below, 1),
        "above_pct": round(above, 1),
        "very_low_pct": round(very_low_pct, 1),
        "very_high_pct": round(very_high_pct, 1),
    }


def compute_mage(readings: List[float]) -> float:
    """
    Mean Amplitude of Glycemic Excursions (MAGE).
    Measures glycemic variability. Threshold = 1 SD.
    """
    if len(readings) < 3:
        return 0.0

    arr = np.array(readings)
    sd = np.std(arr)
    excursions = []

    i = 1
    while i < len(arr) - 1:
        # Find local peaks and valleys
        if arr[i] > arr[i - 1] and arr[i] > arr[i + 1]:
            # Peak: look back for trough
            j = i - 1
            while j > 0 and arr[j] > arr[j - 1]:
                j -= 1
            excursion = arr[i] - arr[j]
            if excursion > sd:
                excursions.append(excursion)
        elif arr[i] < arr[i - 1] and arr[i] < arr[i + 1]:
            # Trough: look back for peak
            j = i - 1
            while j > 0 and arr[j] < arr[j - 1]:
                j -= 1
            excursion = arr[j] - arr[i]
            if excursion > sd:
                excursions.append(excursion)
        i += 1

    return round(float(np.mean(excursions)) if excursions else 0.0, 2)


def compute_stats(
    readings: List[Tuple[datetime, float]],
    target_low: float = 3.9,
    target_high: float = 10.0,
    period_days: int = 14,
) -> GlucoseStats:
    """
    Compute comprehensive glucose statistics from a list of (timestamp, value_mmol) tuples.
    """
    if not readings:
        return GlucoseStats(
            average_mmol=0, std_dev=0, coefficient_of_variation=0,
            estimated_hba1c=0, min_mmol=0, max_mmol=0,
            in_range_pct=0, below_pct=0, above_pct=0,
            very_low_pct=0, very_high_pct=0,
            reading_count=0, period_days=period_days,
        )

    values = [v for _, v in readings]
    arr = np.array(values)
    avg = float(np.mean(arr))
    sd = float(np.std(arr))
    cv = round((sd / avg) * 100, 1) if avg > 0 else 0.0
    tir = compute_tir(values, low=target_low, high=target_high)

    return GlucoseStats(
        average_mmol=round(avg, 2),
        std_dev=round(sd, 2),
        coefficient_of_variation=cv,
        estimated_hba1c=estimate_hba1c(avg),
        min_mmol=round(float(np.min(arr)), 2),
        max_mmol=round(float(np.max(arr)), 2),
        in_range_pct=tir["in_range_pct"],
        below_pct=tir["below_pct"],
        above_pct=tir["above_pct"],
        very_low_pct=tir["very_low_pct"],
        very_high_pct=tir["very_high_pct"],
        reading_count=len(values),
        period_days=period_days,
    )


def detect_patterns(
    readings: List[Tuple[datetime, float]],
    target_low: float = 3.9,
    target_high: float = 10.0,
) -> List[Pattern]:
    """
    Detect glucose patterns:
    - Dawn phenomenon (consistent AM highs)
    - Post-meal spikes
    - Nocturnal hypoglycemia
    - Consistent high/low periods
    """
    patterns = []
    if len(readings) < 30:
        return patterns

    df = pd.DataFrame(readings, columns=["timestamp", "value"])
    df["hour"] = pd.to_datetime(df["timestamp"]).dt.hour
    df["date"] = pd.to_datetime(df["timestamp"]).dt.date

    # ── Dawn Phenomenon (3am–9am consistently high) ──
    dawn_mask = df["hour"].between(3, 9)
    rest_mask = df["hour"].between(10, 22)

    if dawn_mask.sum() >= 5 and rest_mask.sum() >= 5:
        dawn_avg = df.loc[dawn_mask, "value"].mean()
        rest_avg = df.loc[rest_mask, "value"].mean()
        diff = dawn_avg - rest_avg
        if diff > 1.5:
            confidence = min(diff / 4.0, 1.0)
            patterns.append(Pattern(
                pattern_type="dawn_phenomenon",
                description=(
                    f"Your glucose is on average {diff:.1f} mmol/L higher between 3–9am "
                    f"compared to the rest of the day. This is called the Dawn Phenomenon — "
                    f"your liver releases glucose in the early hours. Talk to your care team "
                    f"about adjusting your overnight insulin."
                ),
                confidence=round(confidence, 2),
                data={"dawn_avg": round(dawn_avg, 2), "rest_avg": round(rest_avg, 2), "diff": round(diff, 2)},
            ))

    # ── Nocturnal Hypoglycemia (midnight–4am below 3.9) ──
    night_mask = df["hour"].between(0, 4)
    if night_mask.sum() >= 5:
        night_readings = df.loc[night_mask, "value"]
        hypo_pct = (night_readings < target_low).mean() * 100
        if hypo_pct > 20:
            patterns.append(Pattern(
                pattern_type="nocturnal_hypoglycemia",
                description=(
                    f"{hypo_pct:.0f}% of your overnight readings (midnight–4am) are below "
                    f"{target_low} mmol/L. Nocturnal lows can be dangerous. Consider a bedtime snack "
                    f"or reviewing your overnight insulin dose with your doctor."
                ),
                confidence=min(hypo_pct / 50, 1.0),
                data={"hypo_pct": round(hypo_pct, 1), "hours": "0:00–4:00"},
            ))

    # ── Weekday vs Weekend Variation ──
    df["is_weekend"] = pd.to_datetime(df["timestamp"]).dt.dayofweek >= 5
    if df["is_weekend"].sum() >= 10 and (~df["is_weekend"]).sum() >= 10:
        weekend_avg = df.loc[df["is_weekend"], "value"].mean()
        weekday_avg = df.loc[~df["is_weekend"], "value"].mean()
        diff = abs(weekend_avg - weekday_avg)
        if diff > 1.0:
            higher = "weekends" if weekend_avg > weekday_avg else "weekdays"
            patterns.append(Pattern(
                pattern_type="weekday_weekend_variation",
                description=(
                    f"Your glucose averages {diff:.1f} mmol/L higher on {higher}. "
                    f"This may be linked to changes in routine, diet, activity, or meal timing "
                    f"between weekdays and weekends."
                ),
                confidence=min(diff / 3.0, 1.0),
                data={
                    "weekend_avg": round(weekend_avg, 2),
                    "weekday_avg": round(weekday_avg, 2),
                },
            ))

    # ── High Variability ──
    cv = (df["value"].std() / df["value"].mean()) * 100
    if cv > 36:  # Clinical threshold for high variability
        patterns.append(Pattern(
            pattern_type="high_variability",
            description=(
                f"Your glucose variability (CV: {cv:.0f}%) is above the recommended 36%. "
                f"High variability increases the risk of complications. Focus on consistent "
                f"meal timing and carbohydrate amounts."
            ),
            confidence=min((cv - 36) / 20, 1.0),
            data={"cv": round(cv, 1), "threshold": 36},
        ))

    return patterns


def compute_hourly_profile(
    readings: List[Tuple[datetime, float]]
) -> Dict[int, Dict[str, float]]:
    """
    Compute average glucose by hour of day with confidence intervals.
    Returns {0: {mean, low, high, count}, 1: {...}, ...}
    """
    df = pd.DataFrame(readings, columns=["timestamp", "value"])
    df["hour"] = pd.to_datetime(df["timestamp"]).dt.hour

    result = {}
    for hour in range(24):
        hour_data = df.loc[df["hour"] == hour, "value"]
        if len(hour_data) >= 2:
            mean = hour_data.mean()
            sem = stats.sem(hour_data)
            ci = stats.t.ppf(0.975, len(hour_data) - 1) * sem
            result[hour] = {
                "mean": round(float(mean), 2),
                "low": round(float(mean - ci), 2),
                "high": round(float(mean + ci), 2),
                "count": int(len(hour_data)),
            }
        elif len(hour_data) == 1:
            result[hour] = {
                "mean": round(float(hour_data.iloc[0]), 2),
                "low": round(float(hour_data.iloc[0]), 2),
                "high": round(float(hour_data.iloc[0]), 2),
                "count": 1,
            }

    return result


def compute_daily_averages(
    readings: List[Tuple[datetime, float]]
) -> List[Dict]:
    """Compute per-day averages for trend charts."""
    df = pd.DataFrame(readings, columns=["timestamp", "value"])
    df["date"] = pd.to_datetime(df["timestamp"]).dt.date
    daily = df.groupby("date")["value"].agg(["mean", "min", "max", "count"]).reset_index()
    return [
        {
            "date": str(row["date"]),
            "avg": round(row["mean"], 2),
            "min": round(row["min"], 2),
            "max": round(row["max"], 2),
            "count": int(row["count"]),
        }
        for _, row in daily.iterrows()
    ]


def compute_hypo_risk_score(
    recent_readings: List[Tuple[datetime, float]],
    trend_rate: Optional[float] = None,
    insulin_on_board: float = 0.0,
    recent_activity_minutes: int = 0,
) -> float:
    """
    Compute a hypo risk score 0–100.
    Combines current trend, recent lows, IOB, and activity.
    """
    if not recent_readings:
        return 0.0

    score = 0.0
    latest = recent_readings[-1][1]

    # Current glucose level
    if latest < 3.9:
        score += 60
    elif latest < 4.5:
        score += 40
    elif latest < 5.5:
        score += 20

    # Trend direction
    if trend_rate is not None:
        if trend_rate < -0.1:   # Falling fast (>0.1 mmol/L/min)
            score += min(abs(trend_rate) * 200, 30)
        elif trend_rate < 0:    # Falling slowly
            score += 10

    # Recent hypoglycemia in last 2 hours increases risk
    cutoff = recent_readings[-1][0] - timedelta(hours=2)
    recent_lows = [v for t, v in recent_readings if t >= cutoff and v < 3.9]
    if recent_lows:
        score += 20

    # Insulin on board
    score += min(insulin_on_board * 5, 20)

    # Recent exercise (within 4 hours increases sensitivity)
    if recent_activity_minutes > 30:
        score += 15

    return min(round(score, 1), 100.0)
