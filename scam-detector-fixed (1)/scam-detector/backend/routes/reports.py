"""
Reports route: generate a downloadable PDF report for a detection
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime
import io

from database.connection import get_db
from utils.auth import get_current_user

router = APIRouter()


@router.get("/pdf/{detection_id}")
async def download_pdf_report(
    detection_id: str,
    current_user = Depends(get_current_user),
):
    """Generate a PDF report for a specific detection."""
    db  = get_db()
    try:
        oid = ObjectId(detection_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await db.detections.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Detection not found")
    if str(doc["user_id"]) != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    pdf_bytes = _build_pdf(doc, current_user)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=scam_report_{detection_id[:8]}.pdf"},
    )


def _build_pdf(doc: dict, user: dict) -> bytes:
    """Build PDF using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.units import cm

    buffer = io.BytesIO()
    doc_pdf = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    story  = []

    # ─── Header ───────────────────────────────────────────────────────────────
    title_style = ParagraphStyle("title", fontSize=22, textColor=colors.HexColor("#1e40af"),
                                  spaceAfter=6, fontName="Helvetica-Bold")
    sub_style   = ParagraphStyle("sub",   fontSize=11, textColor=colors.grey, spaceAfter=20)

    story.append(Paragraph("🛡️ AI Voice Scam Detection Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 0.4*cm))

    # ─── Result badge ─────────────────────────────────────────────────────────
    is_scam    = doc.get("is_scam", False)
    label      = doc.get("label", "UNKNOWN")
    confidence = doc.get("confidence", 0)
    risk       = doc.get("risk_level", "Low")
    color_map  = {"High": "#dc2626", "Medium": "#f59e0b", "Low": "#16a34a"}
    risk_color = color_map.get(risk, "#64748b")

    result_style = ParagraphStyle("result", fontSize=18, fontName="Helvetica-Bold",
                                   textColor=colors.HexColor("#dc2626" if is_scam else "#16a34a"),
                                   spaceAfter=4)
    story.append(Paragraph(f"Verdict: {label}", result_style))
    story.append(Paragraph(
        f"Confidence: <b>{confidence}%</b> &nbsp;&nbsp; Risk Level: <b><font color='{risk_color}'>{risk}</font></b>",
        styles["Normal"]
    ))
    story.append(Spacer(1, 0.5*cm))

    # ─── Details table ────────────────────────────────────────────────────────
    created = doc.get("created_at", datetime.utcnow())
    if isinstance(created, datetime):
        created_str = created.strftime("%Y-%m-%d %H:%M UTC")
    else:
        created_str = str(created)

    table_data = [
        ["Field", "Value"],
        ["File Name",       doc.get("file_name", "Live Recording")],
        ["Detection ID",    str(doc.get("_id", ""))[:16] + "..."],
        ["User",            user.get("email", "")],
        ["Duration",        f"{doc.get('duration', 0):.1f} seconds"],
        ["Source",          doc.get("source", "upload").capitalize()],
        ["Detected At",     created_str],
        ["Raw Score",       str(doc.get("raw_score", ""))],
    ]

    table = Table(table_data, colWidths=[4.5*cm, 13*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",    (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.6*cm))

    # ─── AI Explanation ───────────────────────────────────────────────────────
    story.append(Paragraph("AI Analysis", ParagraphStyle("h2", fontSize=14,
                fontName="Helvetica-Bold", textColor=colors.HexColor("#1e293b"), spaceAfter=6)))
    story.append(Paragraph(doc.get("explanation", "No explanation available."), styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    # ─── Footer ───────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0")))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "This report was generated automatically by the AI Voice Scam Detection System. "
        "Results are based on machine learning analysis and should be used as a guide only.",
        ParagraphStyle("footer", fontSize=8, textColor=colors.grey)
    ))

    doc_pdf.build(story)
    return buffer.getvalue()
