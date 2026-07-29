from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "ledgerguard-openapi-overview.pdf"
BASE_URL = "https://ledgerguard-gules.vercel.app"


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D5E8DE"))
    canvas.line(18 * mm, 282 * mm, 192 * mm, 282 * mm)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(colors.HexColor("#0D3B2A"))
    canvas.drawString(18 * mm, 286 * mm, "LEDGERGUARD | ARC TESTNET")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#52675E"))
    canvas.drawRightString(192 * mm, 11 * mm, f"Page {doc.page}")
    canvas.drawString(18 * mm, 11 * mm, "Public technical overview - no credentials or private keys")
    canvas.restoreState()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        title="LedgerGuard OpenAPI Overview",
        author="LedgerGuard",
        subject="Arc Testnet non-custodial transaction preflight and settlement evidence API",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="Hero",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=27,
            leading=31,
            textColor=colors.HexColor("#0A2B20"),
            alignment=TA_LEFT,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Deck",
            parent=styles["BodyText"],
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#40594F"),
            spaceAfter=14,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=19,
            textColor=colors.HexColor("#0D3B2A"),
            spaceBefore=8,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#40594F"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeBlock",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#10251D"),
            backColor=colors.HexColor("#EDF7F1"),
            borderPadding=8,
            spaceBefore=5,
            spaceAfter=8,
        )
    )

    story = [
        Spacer(1, 7 * mm),
        Paragraph("LedgerGuard", styles["Hero"]),
        Paragraph(
            "OpenAPI overview for Circle Agent Marketplace review",
            styles["Deck"],
        ),
        Paragraph(
            "A non-custodial Arc Testnet transaction preflight and settlement-evidence API for AI agents. "
            "LedgerGuard never requests seed phrases, private keys, or custody of funds. Signing remains client-side.",
            styles["Deck"],
        ),
        Table(
            [
                ["Production URL", BASE_URL],
                ["OpenAPI 3.1", f"{BASE_URL}/openapi.json"],
                ["Service catalog", f"{BASE_URL}/.well-known/ledgerguard.json"],
                ["Network", "Arc Testnet | CAIP-2 eip155:5042002"],
                ["Mainnet state", "Disabled - explicit release review required"],
            ],
            colWidths=[38 * mm, 126 * mm],
            hAlign="LEFT",
        ),
        Spacer(1, 6 * mm),
        Paragraph("Public endpoints", styles["Section"]),
    ]

    endpoint_rows = [
        ["Method", "Path", "Purpose"],
        ["POST", "/v1/preflight", "Decode intent, enforce policy, and simulate when a sender is supplied."],
        ["POST", "/v1/evidence", "Reconcile a finalized transaction with the declared transfer or approval intent."],
        ["GET", "/v1/paid/network-risk", "x402 v2 paid Arc network-risk snapshot; testnet price 0.001 USDC."],
        ["GET", "/v1/networks", "Network registry and release status."],
        ["GET", "/ready", "Arc Testnet RPC chain-ID and readiness verification."],
    ]
    endpoint_table = Table(endpoint_rows, colWidths=[20 * mm, 47 * mm, 97 * mm], repeatRows=1)
    endpoint_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0D3B2A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B9CEC3")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F8F5")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend(
        [
            endpoint_table,
            Spacer(1, 5 * mm),
            Paragraph("Decision contract", styles["Section"]),
            Paragraph(
                "<b>ALLOW</b> means all configured checks passed. <b>REVIEW</b> means a human or caller must resolve "
                "a warning, including a skipped simulation. <b>BLOCK</b> means the caller must not sign or broadcast.",
                styles["Deck"],
            ),
            Paragraph("Example request", styles["Section"]),
            Paragraph(
                '{<br/>'
                '&nbsp;&nbsp;"network": "arcTestnet",<br/>'
                '&nbsp;&nbsp;"to": "0x3600000000000000000000000000000000000000",<br/>'
                '&nbsp;&nbsp;"data": "0x...",<br/>'
                '&nbsp;&nbsp;"valueWei": "0",<br/>'
                '&nbsp;&nbsp;"intent": {<br/>'
                '&nbsp;&nbsp;&nbsp;&nbsp;"action": "transfer",<br/>'
                '&nbsp;&nbsp;&nbsp;&nbsp;"expectedRecipient": "0x...",<br/>'
                '&nbsp;&nbsp;&nbsp;&nbsp;"expectedAssetAddress": "0x3600...0000",<br/>'
                '&nbsp;&nbsp;&nbsp;&nbsp;"expectedAmountMicroUsdc": "1000000",<br/>'
                '&nbsp;&nbsp;&nbsp;&nbsp;"purpose": "Agent API purchase"<br/>'
                '&nbsp;&nbsp;},<br/>'
                '&nbsp;&nbsp;"policy": {"requireSimulation": true, "maxAmountMicroUsdc": "1000000"}<br/>'
                '}',
                styles["CodeBlock"],
            ),
            PageBreak(),
            Paragraph("Security and settlement model", styles["Hero"]),
            Paragraph(
                "The API is designed as a verification layer, not a wallet. It returns evidence and policy decisions; "
                "it does not hold funds, create signatures, or broadcast transactions for users.",
                styles["Deck"],
            ),
        ]
    )

    security_rows = [
        ["Control", "Current behavior"],
        ["Custody", "None. No private keys, seed phrases, or wallet credentials."],
        ["Signing", "Client-side only. Preflight accepts unsigned calldata."],
        ["Simulation", "Missing or failed required simulation fails closed."],
        ["Asset", "Arc Testnet USDC is checked against the configured official address."],
        ["Approvals", "Unlimited approvals are blocked by default; approval evidence is parsed separately."],
        ["Evidence", "Receipt, chain, status, transfer/approval event, recipient, asset, and amount are reconciled."],
        ["Mainnet", "Disabled until official parameters, code fingerprint, human approval, and canary checks."],
        ["HTTP", "Strict CSP, explicit CORS, no-store API responses, sanitized external errors."],
    ]
    security_table = Table(security_rows, colWidths=[37 * mm, 127 * mm], repeatRows=1)
    security_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0D3B2A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B9CEC3")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F8F5")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend(
        [
            security_table,
            Spacer(1, 7 * mm),
            Paragraph("x402 testnet resource", styles["Section"]),
            Paragraph(
                "GET /v1/paid/network-risk returns HTTP 402 and a PAYMENT-REQUIRED header until a valid "
                "x402 v2 payment signature is settled by Circle Gateway. The current testnet price is "
                "1,000 micro-USDC (0.001 USDC).",
                styles["Deck"],
            ),
            Paragraph("Integration references", styles["Section"]),
            Paragraph(
                f"OpenAPI: {BASE_URL}/openapi.json<br/>"
                f"Integration guide: https://github.com/lw22336599-rgb/ledgerguard/blob/main/docs/INTEGRATION.md<br/>"
                f"Source: https://github.com/lw22336599-rgb/ledgerguard<br/>"
                "Contact: lw22336599@gmail.com | lw22336599-rgb",
                styles["Deck"],
            ),
            Spacer(1, 7 * mm),
            Paragraph(
                "<b>Release status:</b> Public Arc Testnet MVP. No mainnet, customer, revenue, or production-SLA claim is made.",
                styles["Small"],
            ),
        ]
    )

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    build()
