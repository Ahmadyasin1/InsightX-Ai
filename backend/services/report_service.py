"""Report generation service for InsightX AI — PDF, JSON, CSV exports."""
import csv
import io
import json
import logging
from datetime import datetime, timezone
from typing import List, Any, Dict

logger = logging.getLogger(__name__)


class ReportService:
    async def generate_pdf(self, investigation: Any, results: List[Any]) -> bytes:
        try:
            return self._generate_pdf_reportlab(investigation, results)
        except ImportError:
            logger.warning("ReportLab not installed — trying WeasyPrint")
        except Exception as e:
            logger.error(f"ReportLab PDF failed: {e}")

        try:
            from weasyprint import HTML
            html = self._build_html_report(investigation, results)
            return HTML(string=html).write_pdf()
        except Exception as e:
            logger.error(f"WeasyPrint PDF failed: {e}")
            raise RuntimeError(
                "PDF generation failed. Install reportlab: pip install reportlab"
            ) from e

    def _generate_pdf_reportlab(self, investigation: Any, results: List[Any]) -> bytes:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak,
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=2 * cm, rightMargin=2 * cm,
            topMargin=2 * cm, bottomMargin=2 * cm,
        )
        styles = getSampleStyleSheet()
        PRIMARY = colors.HexColor("#0078D4")
        DARK = colors.HexColor("#111827")
        MUTED = colors.HexColor("#6B7280")
        BORDER = colors.HexColor("#E5E7EB")

        def heading(text: str, size: int = 14):
            return Paragraph(text, ParagraphStyle(
                "H", parent=styles["Heading2"], fontSize=size,
                textColor=DARK, spaceAfter=8, fontName="Helvetica-Bold",
            ))

        def body(text: str, size: int = 9):
            safe = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            return Paragraph(safe, ParagraphStyle(
                "B", parent=styles["Normal"], fontSize=size,
                textColor=MUTED, leading=size * 1.5, fontName="Helvetica",
            ))

        story = []

        # Header
        hdr = Table(
            [[
                Paragraph("<b>InsightX AI</b>", ParagraphStyle("brand", fontSize=18, textColor=PRIMARY)),
                Paragraph("Forensic Investigation Report", ParagraphStyle("sub", fontSize=10, textColor=MUTED, alignment=TA_CENTER)),
                Paragraph(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                        ParagraphStyle("dt", fontSize=8, textColor=MUTED, alignment=2)),
            ]],
            colWidths=[5 * cm, 7 * cm, 5 * cm],
        )
        story.append(hdr)
        story.append(Spacer(1, 0.3 * cm))
        story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=0.4 * cm))

        story.append(heading(f"{investigation.title}", 16))
        story.append(body(f"Case: {investigation.case_number} · Status: {investigation.status} · Priority: {investigation.priority}"))
        story.append(Spacer(1, 0.4 * cm))

        total_score = max((r.incident_score or 0 for r in results), default=0)
        risk = (results[0].risk_level if results else "N/A") or "N/A"
        meta = [
            ["Incident Score", f"{total_score:.0f} / 100"],
            ["Risk Level", str(risk).upper()],
            ["Evidence Files", str(len(results))],
            ["Total Anomalies", str(sum(r.anomaly_count or 0 for r in results))],
            ["Persons Detected", str(sum(r.person_count or 0 for r in results))],
            ["Vehicles Detected", str(sum(r.vehicle_count or 0 for r in results))],
        ]
        meta_t = Table(meta, colWidths=[5 * cm, 12 * cm])
        meta_t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F8FAFC")),
            ("TEXTCOLOR", (0, 0), (0, -1), DARK),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(heading("Investigation Overview"))
        story.append(meta_t)
        story.append(Spacer(1, 0.5 * cm))

        # Executive brief
        for r in results:
            if r.executive_brief:
                story.append(heading("Executive Intelligence Brief"))
                story.append(body(r.executive_brief))
                story.append(Spacer(1, 0.4 * cm))
                break

        # Anomalies table
        story.append(heading("Detected Anomalies & Surveillance Events"))
        rows = [["Type", "Severity", "Description", "Time", "Conf."]]
        for r in results:
            for a in (r.anomalies or [])[:40]:
                rows.append([
                    str(a.get("type", "—"))[:20],
                    str(a.get("severity", "—")).upper(),
                    str(a.get("description", ""))[:60],
                    f"{float(a.get('timestamp', 0)):.1f}s",
                    f"{float(a.get('confidence', 0)) * 100:.0f}%",
                ])
        if len(rows) == 1:
            rows.append(["—", "—", "No anomalies detected", "—", "—"])
        anom_t = Table(rows, colWidths=[3 * cm, 2 * cm, 7 * cm, 2 * cm, 1.5 * cm])
        anom_t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
        ]))
        story.append(anom_t)
        story.append(Spacer(1, 0.5 * cm))

        # Timeline
        story.append(heading("Event Timeline"))
        tl_rows = [["Timestamp", "Event", "Description"]]
        for r in results:
            for ev in (r.timeline or [])[:30]:
                tl_rows.append([
                    f"{float(ev.get('timestamp', 0)):.1f}s",
                    str(ev.get("type", "—"))[:24],
                    str(ev.get("description", ""))[:80],
                ])
        if len(tl_rows) == 1:
            tl_rows.append(["—", "—", "No timeline events recorded"])
        tl_t = Table(tl_rows, colWidths=[2.5 * cm, 4 * cm, 10 * cm])
        tl_t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6B46C1")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ]))
        story.append(tl_t)
        story.append(Spacer(1, 0.5 * cm))

        # Transcript excerpt
        for r in results:
            text = (r.transcription or {}).get("text", "") if r.transcription else ""
            if text:
                story.append(heading("Audio Transcript Excerpt"))
                story.append(body(text[:1500] + ("…" if len(text) > 1500 else "")))
                break

        # VLM scene captions (HuggingFace)
        for r in results:
            caps = ((r.detections or {}).get("vlm_scene_captions") if r.detections else None) or []
            if not caps and isinstance(r.reasoning, dict):
                caps = r.reasoning.get("vlm_captions") or []
            if caps:
                story.append(heading("Visual Scene Intelligence (HF VLM)"))
                for c in caps[:6]:
                    story.append(body(f"@{float(c.get('timestamp', 0)):.1f}s — {c.get('description', '')}"))
                story.append(Spacer(1, 0.4 * cm))
                break

        story.append(Spacer(1, 0.8 * cm))
        story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
        story.append(body(
            f"Generated by InsightX AI · {investigation.case_number} · "
            f"Powered by Detectra AI Engine · Confidential",
            size=8,
        ))

        doc.build(story)
        return buf.getvalue()

    async def generate_json(self, investigation: Any, results: List[Any]) -> Dict:
        return {
            "report_metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "platform": "InsightX AI",
                "version": "1.0.0",
                "engine": "Detectra AI v7",
            },
            "investigation": {
                "id": investigation.id,
                "case_number": investigation.case_number,
                "title": investigation.title,
                "status": investigation.status,
                "priority": investigation.priority,
                "description": investigation.description,
                "created_at": investigation.created_at.isoformat(),
            },
            "analysis_results": [
                {
                    "evidence_id": r.evidence_id,
                    "incident_score": r.incident_score,
                    "risk_level": r.risk_level,
                    "person_count": r.person_count,
                    "vehicle_count": r.vehicle_count,
                    "object_count": r.object_count,
                    "anomaly_count": r.anomaly_count,
                    "executive_brief": r.executive_brief,
                    "timeline": r.timeline,
                    "anomalies": r.anomalies,
                    "transcription": r.transcription,
                    "reasoning": r.reasoning,
                    "evidence_graph": r.evidence_graph,
                    "detections": r.detections,
                }
                for r in results
            ],
        }

    async def generate_csv(self, investigation: Any, results: List[Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Case Number", "Title", "Status", "Priority", "Created At"])
        writer.writerow([
            investigation.case_number, investigation.title,
            investigation.status, investigation.priority,
            investigation.created_at.isoformat(),
        ])
        writer.writerow([])
        writer.writerow(["Evidence ID", "Incident Score", "Risk Level", "Persons", "Vehicles", "Objects", "Anomalies"])
        for r in results:
            writer.writerow([
                r.evidence_id, r.incident_score, r.risk_level,
                r.person_count, r.vehicle_count, r.object_count, r.anomaly_count,
            ])
        writer.writerow([])
        writer.writerow(["Timestamp", "Type", "Severity", "Description", "Evidence ID"])
        for r in results:
            for a in (r.anomalies or []):
                writer.writerow([
                    a.get("timestamp", 0), a.get("type"), a.get("severity"),
                    a.get("description"), r.evidence_id,
                ])
        return output.getvalue()

    def _build_html_report(self, investigation: Any, results: List[Any]) -> str:
        anomaly_rows = ""
        for r in results:
            for a in (r.anomalies or []):
                conf = a.get("confidence", 0)
                conf_pct = conf * 100 if conf <= 1 else conf
                anomaly_rows += f"""
                <tr>
                    <td>{a.get('type', 'Unknown')}</td>
                    <td><span class="badge {a.get('severity', 'low')}">{a.get('severity', 'low').upper()}</span></td>
                    <td>{a.get('description', '')}</td>
                    <td>{a.get('timestamp', 0):.1f}s</td>
                    <td>{conf_pct:.0f}%</td>
                </tr>"""

        total_score = max((r.incident_score or 0) for r in results) if results else 0
        risk_color = {"critical": "#ef4444", "high": "#f97316", "medium": "#eab308", "low": "#22c55e"}.get(
            (results[0].risk_level if results else "low") or "low", "#94a3b8"
        )

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>InsightX AI — Investigation Report {investigation.case_number}</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; }}
  .header {{ background: linear-gradient(135deg, #0078D4, #1e1b4b); color: #fff; padding: 40px 48px; }}
  .header h1 {{ font-size: 28px; font-weight: 700; }}
  .content {{ padding: 40px 48px; }}
  .section {{ margin-bottom: 36px; }}
  .section h2 {{ font-size: 18px; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 16px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  th {{ background: #f1f5f9; padding: 10px 12px; text-align: left; }}
  td {{ padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }}
  .brief {{ background: #EFF6FF; border-left: 4px solid #0078D4; padding: 16px 20px; font-size: 14px; line-height: 1.6; }}
</style>
</head>
<body>
<div class="header">
  <div style="color:#93c5fd;font-weight:800">InsightX AI</div>
  <h1>Investigation Report</h1>
  <div>{investigation.title} · {investigation.case_number}</div>
</div>
<div class="content">
  <div class="section">
    <h2>Overview</h2>
    <p>Incident Score: <strong style="color:{risk_color}">{total_score:.0f}/100</strong></p>
    <p>Evidence files analyzed: {len(results)}</p>
  </div>
  {'<div class="section"><h2>Executive Brief</h2><div class="brief">' + results[0].executive_brief + '</div></div>' if results and results[0].executive_brief else ''}
  <div class="section">
    <h2>Detected Anomalies</h2>
    <table>
      <thead><tr><th>Type</th><th>Severity</th><th>Description</th><th>Timestamp</th><th>Confidence</th></tr></thead>
      <tbody>{anomaly_rows or '<tr><td colspan="5">No anomalies detected</td></tr>'}</tbody>
    </table>
  </div>
</div>
</body></html>"""
