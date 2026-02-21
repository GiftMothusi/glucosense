"""
GlucoSense Meal Impact Scorer
Computes personal glucose response scores for individual meals.
"""
from __future__ import annotations
import numpy as np
from datetime import timedelta
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class MealImpactResult:
    meal_name: str
    avg_peak_mmol: float
    avg_spike_magnitude: float
    avg_area_under_curve: float
    impact_score: float          # 0 = low impact, 100 = very high impact
    sample_count: int
    impact_label: str            # "Low", "Moderate", "High", "Very High"
    recommendation: str


def compute_auc_trapezoidal(
    timestamps: List[float],  # minutes from meal
    values: List[float],
    baseline: float,
) -> float:
    """Compute incremental area under curve above baseline using trapezoidal rule."""
    auc = 0.0
    for i in range(1, len(timestamps)):
        dt = timestamps[i] - timestamps[i - 1]
        incremental_a = max(values[i - 1] - baseline, 0)
        incremental_b = max(values[i] - baseline, 0)
        auc += 0.5 * (incremental_a + incremental_b) * dt
    return round(auc, 2)


def score_meal_impact(
    baseline_mmol: float,
    post_meal_readings: List[Tuple[float, float]],  # (minutes_after_meal, glucose_mmol)
) -> Tuple[float, float, float]:
    """
    Returns (peak_mmol, spike_magnitude, auc).
    post_meal_readings should cover 0–120 minutes post meal.
    """
    if not post_meal_readings:
        return baseline_mmol, 0.0, 0.0

    times = [t for t, _ in post_meal_readings]
    values = [v for _, v in post_meal_readings]

    peak = max(values)
    spike = peak - baseline_mmol
    auc = compute_auc_trapezoidal(times, values, baseline_mmol)

    return round(peak, 2), round(max(spike, 0.0), 2), round(auc, 2)


def compute_impact_score(
    avg_spike: float,
    avg_auc: float,
    spike_weight: float = 0.6,
    auc_weight: float = 0.4,
    max_spike: float = 6.0,    # mmol/L — mapped to score of 100
    max_auc: float = 300.0,    # mmol·min
) -> float:
    """Normalise spike and AUC into a 0–100 impact score."""
    spike_score = min(avg_spike / max_spike, 1.0) * 100
    auc_score = min(avg_auc / max_auc, 1.0) * 100
    combined = spike_weight * spike_score + auc_weight * auc_score
    return round(min(combined, 100.0), 1)


def impact_label_and_recommendation(score: float, meal_name: str) -> Tuple[str, str]:
    if score < 25:
        return (
            "Low",
            f"{meal_name} has minimal impact on your glucose. It's a good choice for stable readings.",
        )
    elif score < 50:
        return (
            "Moderate",
            f"{meal_name} causes a moderate glucose rise. Consider pairing with a protein or fat source to blunt the spike.",
        )
    elif score < 75:
        return (
            "High",
            f"{meal_name} significantly raises your glucose. Consider a smaller portion, pre-meal bolus timing, or a lower-carb alternative.",
        )
    else:
        return (
            "Very High",
            f"{meal_name} causes a very large glucose spike. Discuss dosing strategy for this meal with your care team.",
        )


def aggregate_meal_impacts(
    meal_name: str,
    impact_events: List[Tuple[float, float, float]],  # [(peak, spike, auc), ...]
) -> Optional[MealImpactResult]:
    """Aggregate multiple meal events into a single impact score."""
    if not impact_events:
        return None

    peaks = [e[0] for e in impact_events]
    spikes = [e[1] for e in impact_events]
    aucs = [e[2] for e in impact_events]

    avg_peak = float(np.mean(peaks))
    avg_spike = float(np.mean(spikes))
    avg_auc = float(np.mean(aucs))
    score = compute_impact_score(avg_spike, avg_auc)
    label, recommendation = impact_label_and_recommendation(score, meal_name)

    return MealImpactResult(
        meal_name=meal_name,
        avg_peak_mmol=round(avg_peak, 2),
        avg_spike_magnitude=round(avg_spike, 2),
        avg_area_under_curve=round(avg_auc, 2),
        impact_score=score,
        sample_count=len(impact_events),
        impact_label=label,
        recommendation=recommendation,
    )
