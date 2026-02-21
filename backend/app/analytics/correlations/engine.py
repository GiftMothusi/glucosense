"""
GlucoSense Correlation Engine
Finds statistically significant relationships between lifestyle variables
and glucose outcomes, expressed as human-readable insights.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class Correlation:
    variable_a: str
    variable_b: str
    pearson_r: float
    spearman_r: float
    p_value: float
    is_significant: bool
    insight_text: str
    direction: str  # "positive" | "negative" | "none"
    strength: str   # "strong" | "moderate" | "weak" | "none"


def _classify_correlation(r: float, p: float) -> Tuple[bool, str, str]:
    """Returns (is_significant, direction, strength)."""
    is_sig = p < 0.05
    direction = "positive" if r > 0 else "negative" if r < 0 else "none"
    abs_r = abs(r)
    if abs_r >= 0.5:
        strength = "strong"
    elif abs_r >= 0.3:
        strength = "moderate"
    elif abs_r >= 0.1:
        strength = "weak"
    else:
        strength = "none"
    return is_sig, direction, strength


def _generate_insight_text(
    var_a: str, var_b: str, r: float, p: float, is_sig: bool
) -> str:
    """Generate a human-readable insight string."""
    if not is_sig or abs(r) < 0.1:
        return f"No significant relationship found between {var_a} and {var_b}."

    direction_word = "higher" if r > 0 else "lower"
    strength_word = "strongly" if abs(r) >= 0.5 else "moderately" if abs(r) >= 0.3 else "slightly"

    templates = {
        ("sleep_hours", "fasting_glucose"): (
            f"On days you sleep {'less' if r > 0 else 'more'}, your fasting glucose tends to be "
            f"{direction_word}. Sleep {strength_word} affects your morning glucose levels."
        ),
        ("steps", "post_meal_spike"): (
            f"More daily steps are {strength_word} correlated with {'lower' if r < 0 else 'higher'} "
            f"post-meal glucose spikes. Physical activity improves insulin sensitivity."
        ),
        ("stress_score", "average_glucose"): (
            f"Higher stress levels {strength_word} correlate with {direction_word} glucose. "
            f"Cortisol released during stress can raise blood sugar."
        ),
        ("carbs_g", "post_meal_peak"): (
            f"Higher carbohydrate intake {strength_word} correlates with {direction_word} post-meal peaks. "
            f"Carb amount is {strength_word} predictive of your glucose response."
        ),
    }

    key = (var_a, var_b)
    if key in templates:
        return templates[key]

    return (
        f"{var_a.replace('_', ' ').title()} {strength_word} correlates with "
        f"{direction_word} {var_b.replace('_', ' ')} (r={r:.2f}, p={p:.3f})."
    )


def compute_correlations(
    daily_data: pd.DataFrame,
) -> List[Correlation]:
    """
    Compute pairwise correlations between available variables.

    Expected DataFrame columns (any subset):
    - date, avg_glucose, fasting_glucose, post_meal_spike,
      sleep_hours, steps, carbs_g, stress_score, weight_kg
    """
    correlations = []
    numeric_cols = daily_data.select_dtypes(include=[np.number]).columns.tolist()

    pairs_of_interest = [
        ("sleep_hours", "fasting_glucose"),
        ("sleep_hours", "avg_glucose"),
        ("steps", "avg_glucose"),
        ("steps", "post_meal_spike"),
        ("carbs_g", "avg_glucose"),
        ("carbs_g", "post_meal_spike"),
        ("stress_score", "avg_glucose"),
        ("weight_kg", "avg_glucose"),
    ]

    for var_a, var_b in pairs_of_interest:
        if var_a not in numeric_cols or var_b not in numeric_cols:
            continue

        # Drop rows where either variable is missing
        pair_df = daily_data[[var_a, var_b]].dropna()
        if len(pair_df) < 7:  # Need at least 7 data points
            continue

        x = pair_df[var_a].values
        y = pair_df[var_b].values

        pearson_r, pearson_p = stats.pearsonr(x, y)
        spearman_r, _ = stats.spearmanr(x, y)
        is_sig, direction, strength = _classify_correlation(pearson_r, pearson_p)
        insight = _generate_insight_text(var_a, var_b, pearson_r, pearson_p, is_sig)

        correlations.append(Correlation(
            variable_a=var_a,
            variable_b=var_b,
            pearson_r=round(float(pearson_r), 3),
            spearman_r=round(float(spearman_r), 3),
            p_value=round(float(pearson_p), 4),
            is_significant=is_sig,
            insight_text=insight,
            direction=direction,
            strength=strength,
        ))

    # Sort by absolute correlation, most significant first
    correlations.sort(key=lambda c: abs(c.pearson_r), reverse=True)
    return correlations
