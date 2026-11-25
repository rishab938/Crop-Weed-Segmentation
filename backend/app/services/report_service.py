"""PDF report generation using ReportLab."""
from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

from app.core.logging import logger


async def generate_pdf_report(analysis) -> bytes:
    """Generate a PDF agronomic report from the analysis object."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    lime = colors.HexColor("#84cc16")
    dark = colors.HexColor("#0b1209")
    muted = colors.HexColor("#6b7280")

    title_style = ParagraphStyle("Title", parent=styles["Title"], textColor=dark, fontSize=20)
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"], textColor=dark)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=16)
    note_style = ParagraphStyle("Note", parent=styles["Normal"], fontSize=8, textColor=muted)

    elements = []

    # Header
    elements.append(Paragraph("Crop &amp; Weed AI", title_style))
    elements.append(Paragraph("Autonomous Precision Agriculture Survey Report", body_style))
    elements.append(Spacer(1, 8 * mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=lime))
    elements.append(Spacer(1, 4 * mm))

    # Metadata
    meta = [
        ["Report ID", str(analysis.id)[:8].upper()],
        ["Analysis ID", str(analysis.id)],
        ["Status", analysis.status.capitalize()],
        ["Generated", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")],
    ]
    if analysis.weed_coverage_pct is not None:
        meta.append(["Weed Coverage", f"{analysis.weed_coverage_pct:.1f}%"])
    if analysis.crop_coverage_pct is not None:
        meta.append(["Crop Coverage", f"{analysis.crop_coverage_pct:.1f}%"])
    if analysis.images_stitched is not None:
        meta.append(["Images Processed", str(analysis.images_stitched)])

    t = Table(meta, colWidths=[60 * mm, 100 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f9e8")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 6 * mm))

    # Zones
    zones = (analysis.zones_data or {}).get("zones", [])
    if zones:
        elements.append(Paragraph("Zone Breakdown", h2_style))
        elements.append(Spacer(1, 2 * mm))
        zone_data = [["Zone", "Weed Coverage %", "Severity"]]
        for z in zones:
            cov = z.get("coverage_pct", 0)
            sev = "Critical" if cov > 20 else ("Moderate" if cov > 12 else "Low")
            zone_data.append([z.get("id", "?"), f"{cov:.1f}%", sev])
        zt = Table(zone_data, colWidths=[30 * mm, 60 * mm, 60 * mm])
        zt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), lime),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
            ("ROWBACKGROUNDS", (1, 0), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(zt)
        elements.append(Spacer(1, 4 * mm))

    # Disclaimer
    if analysis.weed_coverage_pct is None:
        elements.append(Paragraph(
            "NOTE: Segmentation model was unavailable during processing. "
            "Weed coverage statistics could not be calculated.",
            note_style,
        ))
    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=muted))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        "This report was generated automatically by Crop & Weed AI. "
        "Values derived from image-space analysis. "
        "Chemical savings and treatment area estimates require field calibration for accuracy.",
        note_style,
    ))

    doc.build(elements)
    pdf_bytes = buf.getvalue()
    logger.info("PDF report generated for analysis %s (%d bytes)", analysis.id, len(pdf_bytes))
    return pdf_bytes
