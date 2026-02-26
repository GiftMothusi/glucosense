import io
from datetime import datetime, timezone
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

PRIMARY     = colors.HexColor("#6C63FF")
PRIMARY_LIGHT = colors.HexColor("#EEF0FF")
SUCCESS     = colors.HexColor("#22C55E")
WARNING     = colors.HexColor("#F59E0B")
DANGER      = colors.HexColor("#EF4444")
TEXT_DARK   = colors.HexColor("#1A1A2E")
TEXT_MUTED  = colors.HexColor("#64748B")
WHITE       = colors.white
BORDER      = colors.HexColor("#E2E8F0")


def _get_tir_color(pct: float) -> colors.Color:
    if pct >= 70:
        return SUCCESS
    if pct >= 50:
        return WARNING
    return DANGER


def _glucose_status(mmol: float) -> str:
    if mmol < 3.9:
        return "LOW"
    if mmol <= 10.0:
        return "IN RANGE"
    return "HIGH"


def generate_report(
    user_name: str,
    diabetes_type: Optional[str],
    period_days: int,
    stats: Optional[object],
    patterns: list,
    daily_averages: list,
    generated_at: Optional[datetime] = None,
) -> bytes:
  
    buffer = io.BytesIO()
    generated_at = generated_at or datetime.now(timezone.utc)

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    base_styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        "title", fontSize=22, textColor=PRIMARY,
        fontName="Helvetica-Bold", spaceAfter=12
    )
    subtitle_style = ParagraphStyle(
        "subtitle", fontSize=11, textColor=TEXT_MUTED,
        fontName="Helvetica", spaceBefore=4, spaceAfter=8
    )
    section_style = ParagraphStyle(
        "section", fontSize=13, textColor=TEXT_DARK,
        fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=6
    )
    body_style = ParagraphStyle(
        "body", fontSize=10, textColor=TEXT_DARK,
        fontName="Helvetica", spaceAfter=4
    )
    muted_style = ParagraphStyle(
        "muted", fontSize=9, textColor=TEXT_MUTED,
        fontName="Helvetica", spaceAfter=2
    )

    story.append(Paragraph("GlucoSense", title_style))
    story.append(Paragraph("Diabetes Management Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=6))

    patient_data = [
        ["Patient", user_name, "Report Period", f"Last {period_days} days"],
        ["Diabetes Type", diabetes_type or "Not specified",
         "Generated", generated_at.strftime("%d %b %Y %H:%M UTC")],
    ]
    patient_table = Table(patient_data, colWidths=[35*mm, 65*mm, 35*mm, 45*mm])
    patient_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_DARK),
        ("TEXTCOLOR", (0, 0), (0, -1), TEXT_MUTED),
        ("TEXTCOLOR", (2, 0), (2, -1), TEXT_MUTED),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 6*mm))

    story.append(Paragraph("Glucose Summary", section_style))

    if stats:
        summary_data = [
            ["Metric", "Value", "Target"],
            ["Average Glucose", f"{stats.average_mmol:.1f} mmol/L", "4.0–10.0"],
            ["Estimated HbA1c", f"{stats.estimated_hba1c:.1f}%", "< 7.0%"],
            ["Std Deviation", f"{stats.std_dev:.1f} mmol/L", "< 2.0"],
            ["Coefficient of Variation", f"{stats.coefficient_of_variation:.1f}%", "< 36%"],
            ["Min / Max", f"{stats.min_mmol:.1f} / {stats.max_mmol:.1f} mmol/L", "—"],
        ]
        summary_table = Table(summary_data, colWidths=[70*mm, 60*mm, 50*mm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PRIMARY_LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 4*mm))

        story.append(Paragraph("Time In Range", section_style))
        tir_data = [
            ["Zone", "Range", "Percentage", "Status"],
            ["Very Low", "< 3.0 mmol/L",
             f"{stats.very_low_pct:.1f}%",
             "Critical" if stats.very_low_pct > 1 else "Good"],
            ["Low", "3.0–3.9 mmol/L",
             f"{stats.below_pct:.1f}%",
             "High" if stats.below_pct > 4 else "Good"],
            ["In Range", "3.9–10.0 mmol/L",
             f"{stats.in_range_pct:.1f}%",
             "Target" if stats.in_range_pct >= 70 else "Below target"],
            ["High", "10.0–13.9 mmol/L",
             f"{stats.above_pct:.1f}%",
             "High" if stats.above_pct > 25 else "Good"],
            ["Very High", "> 13.9 mmol/L",
             f"{stats.very_high_pct:.1f}%",
             "Critical" if stats.very_high_pct > 5 else "Good"],
        ]
        tir_table = Table(tir_data, colWidths=[40*mm, 45*mm, 35*mm, 60*mm])
        tir_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PRIMARY_LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(tir_table)
        story.append(Spacer(1, 4*mm))
    else:
        story.append(Paragraph(
            "No glucose data available for this period.", body_style
        ))
        story.append(Spacer(1, 4*mm))

    story.append(Paragraph("Detected Patterns", section_style))
    if patterns:
        for p in patterns:
            pattern_type = p.pattern_type.replace("_", " ").title()
            confidence_pct = int(p.confidence * 100)
            story.append(Paragraph(
                f"<b>{pattern_type}</b> — Confidence: {confidence_pct}%",
                body_style
            ))
            story.append(Paragraph(p.description, muted_style))
            story.append(Spacer(1, 2*mm))
    else:
        story.append(Paragraph(
            "No patterns detected. Log more readings to enable pattern analysis.",
            body_style
        ))
    story.append(Spacer(1, 4*mm))

    if daily_averages:
        story.append(Paragraph("Daily Glucose Averages", section_style))
        daily_data = [["Date", "Average (mmol/L)", "Min", "Max", "Readings"]]
        for day in daily_averages[-14:]:  # last 14 days max to fit page
            daily_data.append([
                day["date"],
                f"{day['avg']:.1f}",
                f"{day['min']:.1f}",
                f"{day['max']:.1f}",
                str(day["count"]),
            ])
        daily_table = Table(daily_data, colWidths=[40*mm, 45*mm, 30*mm, 30*mm, 30*mm])
        daily_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PRIMARY_LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(daily_table)
        story.append(Spacer(1, 4*mm))

    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=6))
    story.append(Paragraph(
        "This report is generated by GlucoSense and is intended for informational "
        "purposes only. Please consult your healthcare provider for medical advice.",
        muted_style
    ))

    doc.build(story)
    return buffer.getvalue()