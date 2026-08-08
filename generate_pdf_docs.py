import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page

        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#78716C"))
        
        # Top Header
        self.drawString(54, 11 * inch - 36, "BOOKME.COM — EXHAUSTIVE SYSTEM TECHNICAL MANUAL & ARCHITECTURE SPECIFICATION")
        self.setStrokeColor(colors.HexColor("#D6D3D1"))
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)

        # Bottom Footer
        self.line(54, 48, 8.5 * inch - 54, 48)
        self.setFont("Helvetica", 8)
        self.drawString(54, 34, "Official Production Specification & Source Code Blueprint")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 34, page_text)
        self.restoreState()

def build_pdf():
    pdf_filename = "BOOKME_RESORT_SYSTEM_DOCUMENTATION.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Color Palette
    PRIMARY = colors.HexColor("#0C0A09")       # Obsidian Dark
    ACCENT = colors.HexColor("#D97706")        # Amber Accent
    ACCENT_DARK = colors.HexColor("#B45309")   # Dark Gold
    TEXT_DARK = colors.HexColor("#1C1917")     # Charcoal Body Text
    TEXT_MUTED = colors.HexColor("#78716C")    # Secondary Muted Text
    BG_LIGHT = colors.HexColor("#F5F5F4")      # Warm Off-white
    BORDER_COLOR = colors.HexColor("#E7E5E4")  # Border Line

    # Paragraph Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=ACCENT_DARK,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=ACCENT_DARK,
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=7
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-9,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0F172A"),
        backColor=colors.HexColor("#F8FAFC"),
        borderColor=colors.HexColor("#E2E8F0"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=5,
        spaceAfter=7
    )

    story = []

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 20))
    story.append(Paragraph("BOOKME.COM", ParagraphStyle('CoverBadge', fontName='Helvetica-Bold', fontSize=11, textColor=ACCENT, spaceAfter=6)))
    story.append(Paragraph("ONLINE RESORT MANAGEMENT & BOOKING SYSTEM", title_style))
    story.append(Paragraph("Exhaustive Technical Specification, End-to-End System Workflows, Database Architecture & API Reference", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2.5, color=ACCENT, spaceBefore=5, spaceAfter=20))

    meta_table_data = [
        [Paragraph("<b>Document Title:</b>", body_style), Paragraph("Bookme.com Comprehensive Technical System Manual", body_style)],
        [Paragraph("<b>Version / Build:</b>", body_style), Paragraph("v1.0.0 (Production Release — Turbopack Enabled)", body_style)],
        [Paragraph("<b>Target Audience:</b>", body_style), Paragraph("Software Engineers, System Architects, QA Engineers & DevOps", body_style)],
        [Paragraph("<b>Core Web Framework:</b>", body_style), Paragraph("Next.js 16 (App Router) + React 19 + TypeScript 5", body_style)],
        [Paragraph("<b>Database & Persistence:</b>", body_style), Paragraph("PostgreSQL via Prisma ORM v6 with Dynamic Transaction Support", body_style)],
        [Paragraph("<b>Security & Auth:</b>", body_style), Paragraph("NextAuth.js (JWT Provider) + Bcryptjs + Nodemailer Verification", body_style)],
        [Paragraph("<b>Payments & Gateway:</b>", body_style), Paragraph("Dodo Payments Hosted Checkout & Automated REST Refunds", body_style)],
        [Paragraph("<b>Interactive Animations:</b>", body_style), Paragraph("GSAP 3 (ScrollTrigger & ScrollTo) + Leaflet GIS Maps", body_style)],
    ]
    t_meta = Table(meta_table_data, colWidths=[150, 350])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)

    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>Table of Document Contents:</b>", h2_style))
    toc_data = [
        [Paragraph("1. Executive Summary & Vision", body_style), Paragraph("Section 6. Payment Gateway Integration", body_style)],
        [Paragraph("2. Full Technology Stack Deep-Dive", body_style), Paragraph("7. Role-Based Dashboard Desks", body_style)],
        [Paragraph("3. Database Schema & Data Models", body_style), Paragraph("8. Admin Console & RBAC Governance", body_style)],
        [Paragraph("4. Auth Subsystem & Registration", body_style), Paragraph("9. Complete API Endpoint Specification", body_style)],
        [Paragraph("5. Dynamic Tiered Cancellation Engine", body_style), Paragraph("10. Deployment & Environment Setup", body_style)],
    ]
    t_toc = Table(toc_data, colWidths=[250, 250])
    t_toc.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & VISION
    # =========================================================================
    story.append(Paragraph("1. Executive Summary & System Vision", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "<b>Bookme.com</b> is an enterprise-grade luxury resort management and guest booking web platform designed to streamline resort operations, "
        "deliver a high-end luxury guest experience, and manage multi-property inventory seamlessly. The application replaces fragmented legacy booking tools "
        "with an integrated Next.js 16 full-stack architecture featuring real-time invoice generation, automated payment processing, role-based staff operations, "
        "and a customer-centric dynamic cancellation policy engine.",
        body_style
    ))

    story.append(Paragraph("<b>Core Platform Objectives:</b>", h2_style))
    story.append(Paragraph("• <b>High-End Visual Aesthetics:</b> Deliver a luxury dark-mode visual experience (`bg-[#0C0A09]`) with GSAP scroll parallax, 3D mouse tilt cards, and interactive Leaflet map controls.", bullet_style))
    story.append(Paragraph("• <b>Resilient Guest Onboarding:</b> Provide friction-free registration with email verification codes, Nodemailer dev fallbacks, and account re-verification recovery.", bullet_style))
    story.append(Paragraph("• <b>Fair Cancellation Policy:</b> Guarantee a maximum fee cap of <b>10%</b> for late cancellations, providing guests with at least 90% refund security at all times.", bullet_style))
    story.append(Paragraph("• <b>Comprehensive Operations:</b> Support multi-role desks (Guest Portal, Staff Housekeeping Queue, Admin Governance) with granular RBAC permissions and audit CSV exports.", bullet_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: FULL TECH STACK DEEP DIVE
    # =========================================================================
    story.append(Paragraph("2. Technology Stack Deep-Dive", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The application architecture leverages a modern, full-stack JavaScript/TypeScript toolchain built around Next.js 16 App Router. "
        "Below is an in-depth breakdown of each architectural layer:",
        body_style
    ))

    tech_deep_data = [
        [Paragraph("<b>Layer</b>", body_style), Paragraph("<b>Technology</b>", body_style), Paragraph("<b>Architectural Function & Rationale</b>", body_style)],
        [
            Paragraph("<b>Core Framework</b>", body_style),
            Paragraph("Next.js 16 (Turbopack)", body_style),
            Paragraph("Utilizes the App Router paradigm with Server Components for fast initial page loads and API routes for backend execution. Turbopack provides sub-second hot module reloads.", body_style)
        ],
        [
            Paragraph("<b>Styling System</b>", body_style),
            Paragraph("Tailwind CSS + Vanilla CSS", body_style),
            Paragraph("Tailwind CSS v4 CSS-first design system with dark glassmorphism tokens, backdrop blur filters (`backdrop-blur-xl`), custom scrollbars, and luxury amber accent glows.", body_style)
        ],
        [
            Paragraph("<b>Animation Engine</b>", body_style),
            Paragraph("GSAP 3 (ScrollTrigger)", body_style),
            Paragraph("Drives hero mouse tilt physics, split-text letter reveals, directional panel transitions, timeline SVG path animations, and smooth section transitions.", body_style)
        ],
        [
            Paragraph("<b>GIS & Mapping</b>", body_style),
            Paragraph("Leaflet.js + OpenStreetMap", body_style),
            Paragraph("Renders client-side interactive global maps with custom animated pulse markers. Automatically triggers smooth `flyTo` coordinate transitions when searching destinations.", body_style)
        ],
        [
            Paragraph("<b>Database Layer</b>", body_style),
            Paragraph("Prisma ORM + PostgreSQL", body_style),
            Paragraph("Provides type-safe database queries, atomic database transactions (`prisma.$transaction`), foreign key relationships, auto-generated migration histories, and seed data scripts.", body_style)
        ],
        [
            Paragraph("<b>Authentication</b>", body_style),
            Paragraph("NextAuth.js + Bcryptjs", body_style),
            Paragraph("Manages JWT session encryption, password salting/hashing (10 rounds), credential verification, and attaches role & user type claims to session tokens.", body_style)
        ],
        [
            Paragraph("<b>Payment Gateway</b>", body_style),
            Paragraph("Dodo Payments REST API", body_style),
            Paragraph("Handles hosted checkout session redirects, webhook security verification (`/api/webhooks/dodo`), and REST-based automated refunds (`POST /refunds`).", body_style)
        ],
        [
            Paragraph("<b>Mailer Dispatch</b>", body_style),
            Paragraph("Nodemailer SMTP", body_style),
            Paragraph("Handles 6-digit email verification code dispatch, reservation booking confirmations, and detailed cancellation breakdown receipts. Features dev console fallback.", body_style)
        ],
    ]
    t_tech_deep = Table(tech_deep_data, colWidths=[90, 120, 290])
    t_tech_deep.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_tech_deep)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: DATABASE SCHEMA & DATA MODELS
    # =========================================================================
    story.append(Paragraph("3. Complete Database Data Dictionary", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The relational data model is defined in <code>prisma/schema.prisma</code> and enforced via PostgreSQL constraints. "
        "Below is the complete data dictionary detailing every entity, column, data type, and relation:",
        body_style
    ))

    # User Entity
    story.append(Paragraph("<b>1. User Entity (`users` table):</b>", h2_style))
    user_fields = [
        [Paragraph("<b>Field Name</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Constraints</b>", body_style), Paragraph("<b>Description</b>", body_style)],
        [Paragraph("id", body_style), Paragraph("String (UUID)", body_style), Paragraph("Primary Key, `@default(uuid())`", body_style), Paragraph("Unique user identifier", body_style)],
        [Paragraph("email", body_style), Paragraph("String", body_style), Paragraph("Unique, Indexed", body_style), Paragraph("Account login email address", body_style)],
        [Paragraph("password", body_style), Paragraph("String", body_style), Paragraph("Required", body_style), Paragraph("Bcrypt-hashed password string", body_style)],
        [Paragraph("fullName", body_style), Paragraph("String", body_style), Paragraph("Required", body_style), Paragraph("Full display name of user", body_style)],
        [Paragraph("role", body_style), Paragraph("Enum (RoleEnum)", body_style), Paragraph("Default: `GUEST`", body_style), Paragraph("Access level: `GUEST`, `STAFF`, `ADMIN`", body_style)],
        [Paragraph("isVerified", body_style), Paragraph("Boolean", body_style), Paragraph("Default: `false`", body_style), Paragraph("Indicates email verification status", body_style)],
        [Paragraph("verificationCode", body_style), Paragraph("String?", body_style), Paragraph("Nullable", body_style), Paragraph("6-digit email OTP code", body_style)],
    ]
    t_user = Table(user_fields, colWidths=[90, 80, 140, 190])
    t_user.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#292524")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_user)
    story.append(Spacer(1, 8))

    # Reservation Entity
    story.append(Paragraph("<b>2. Reservation Entity (`reservations` table):</b>", h2_style))
    res_fields = [
        [Paragraph("<b>Field Name</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Constraints</b>", body_style), Paragraph("<b>Description</b>", body_style)],
        [Paragraph("id", body_style), Paragraph("String (UUID)", body_style), Paragraph("Primary Key", body_style), Paragraph("Unique reservation booking ID", body_style)],
        [Paragraph("checkIn", body_style), Paragraph("DateTime", body_style), Paragraph("Required", body_style), Paragraph("Scheduled arrival timestamp", body_style)],
        [Paragraph("checkOut", body_style), Paragraph("DateTime", body_style), Paragraph("Required", body_style), Paragraph("Scheduled departure timestamp", body_style)],
        [Paragraph("status", body_style), Paragraph("Enum", body_style), Paragraph("Default: `PENDING`", body_style), Paragraph("Status: `PENDING`, `CONFIRMED`, `CANCELED`, `CHECKED_IN`", body_style)],
        [Paragraph("totalAmount", body_style), Paragraph("Decimal(10,2)", body_style), Paragraph("Required", body_style), Paragraph("Grand total stay cost (room + add-ons)", body_style)],
        [Paragraph("guestId", body_style), Paragraph("String", body_style), Paragraph("Foreign Key (Guest)", body_style), Paragraph("Link to booking guest entity", body_style)],
        [Paragraph("roomId", body_style), Paragraph("String", body_style), Paragraph("Foreign Key (Room)", body_style), Paragraph("Link to assigned room unit", body_style)],
    ]
    t_res = Table(res_fields, colWidths=[90, 80, 140, 190])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#292524")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_res)
    story.append(Spacer(1, 8))

    # Payment Entity
    story.append(Paragraph("<b>3. Payment Entity (`payments` table):</b>", h2_style))
    pay_fields = [
        [Paragraph("<b>Field Name</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Constraints</b>", body_style), Paragraph("<b>Description</b>", body_style)],
        [Paragraph("id", body_style), Paragraph("String (UUID)", body_style), Paragraph("Primary Key", body_style), Paragraph("Unique payment transaction ID", body_style)],
        [Paragraph("amount", body_style), Paragraph("Decimal(10,2)", body_style), Paragraph("Required", body_style), Paragraph("Payment currency amount", body_style)],
        [Paragraph("method", body_style), Paragraph("String", body_style), Paragraph("Required", body_style), Paragraph("Payment provider string e.g. 'Dodo Payments (ID: pay_123)'", body_style)],
        [Paragraph("status", body_style), Paragraph("Enum", body_style), Paragraph("Default: `PENDING`", body_style), Paragraph("Status: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`", body_style)],
        [Paragraph("reservationId", body_style), Paragraph("String", body_style), Paragraph("Foreign Key (Reservation)", body_style), Paragraph("Link to parent reservation", body_style)],
    ]
    t_pay = Table(pay_fields, colWidths=[90, 80, 140, 190])
    t_pay.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#292524")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_pay)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: AUTHENTICATION & SECURITY SUBSYSTEM
    # =========================================================================
    story.append(Paragraph("4. Authentication & Security Subsystem", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Security and user identity management are fundamental to Bookme.com. The application combines **NextAuth.js** "
        "for encrypted JWT session management with custom password salting, email verification OTP codes, and fallback handlers.",
        body_style
    ))

    story.append(Paragraph("<b>4.1 Registration Workflow (`POST /api/signup`):</b>", h2_style))
    story.append(Paragraph("1. <b>Input Validation:</b> Validates email format, password minimum length (6 chars), and full name.", bullet_style))
    story.append(Paragraph("2. <b>Existing Account Handling:</b> Checks if user exists. If account is verified (`isVerified = true`), returns HTTP 400 'Email already registered'.", bullet_style))
    story.append(Paragraph("3. <b>Unverified Account Recovery:</b> If user exists but is unverified (`isVerified = false`), the route updates the password hash, generates a fresh 6-digit OTP code, and re-dispatches the email code.", bullet_style))
    story.append(Paragraph("4. <b>Password Hashing:</b> Uses <code>bcryptjs</code> with salt round factor = 10.", bullet_style))
    story.append(Paragraph("5. <b>Transactional Provisioning:</b> Executes a Prisma `$transaction` creating User and Guest profile records simultaneously.", bullet_style))

    story.append(Paragraph("<b>4.2 Email Verification & Mailer Resilience (`src/lib/mailer.ts`):</b>", h2_style))
    story.append(Paragraph(
        "Nodemailer is configured to dispatch HTML email verification codes. "
        "If SMTP credentials (`SMTP_USER` / `SMTP_PASS`) are unconfigured or fail (e.g. in local offline dev mode), "
        "the mailer gracefully catches the error and logs the verification code directly to the server terminal, allowing registration testing without external email dependencies.",
        body_style
    ))

    story.append(Paragraph("<b>4.3 NextAuth Credentials & Authorization Sessions (`src/lib/auth.ts`):</b>", h2_style))
    story.append(Paragraph(
        "NextAuth is configured with the Credentials Provider. Upon authentication:",
        body_style
    ))
    story.append(Paragraph("• `authorize()` checks user existence, verifies password hash with `bcrypt.compare()`, and checks `isVerified === true`.", bullet_style))
    story.append(Paragraph("• Token callback injects `user.role` (`GUEST`, `STAFF`, `ADMIN`) and `user.type` into the encrypted JWT token.", bullet_style))
    story.append(Paragraph("• Session callback exposes `session.user.role` and `session.user.id` to client components and backend API endpoints.", bullet_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: DYNAMIC TIERED CANCELLATION ENGINE
    # =========================================================================
    story.append(Paragraph("5. Dynamic Tiered Cancellation & Refund Engine", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "To provide guest satisfaction while protecting resort revenue, Bookme.com implements a **Dynamic Tiered Cancellation Policy** "
        "enforcing a maximum fee cap of **10%**. Guests can cancel any stay at any time, with refund percentages dynamically calculated based on check-in notice:",
        body_style
    ))

    tier_spec_data = [
        [Paragraph("<b>Policy Tier</b>", body_style), Paragraph("<b>Notice Period</b>", body_style), Paragraph("<b>Refund %</b>", body_style), Paragraph("<b>Fee Retained</b>", body_style), Paragraph("<b>Operational Guarantee</b>", body_style)],
        [Paragraph("<b>Tier 1: Full Refund</b>", body_style), Paragraph("≥ 7 Days before Check-In", body_style), Paragraph("<b>100% Refund</b>", body_style), Paragraph("0% ($0.00)", body_style), Paragraph("Complete money-back guarantee with zero penalty.", body_style)],
        [Paragraph("<b>Tier 2: Light Fee</b>", body_style), Paragraph("3 to 7 Days before Check-In", body_style), Paragraph("<b>95% Refund</b>", body_style), Paragraph("5% Fee", body_style), Paragraph("Minor processing fee retained to cover gateway costs.", body_style)],
        [Paragraph("<b>Tier 3: Max Fee Cap</b>", body_style), Paragraph("< 3 Days / Same-Day / Past", body_style), Paragraph("<b>90% Refund</b>", body_style), Paragraph("<b>10% Max Fee</b>", body_style), Paragraph("Capped at 10% maximum fee; guest receives 90% refund.", body_style)],
    ]
    t_tier_spec = Table(tier_spec_data, colWidths=[100, 110, 80, 80, 130])
    t_tier_spec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#B45309")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_tier_spec)
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>5.1 Interactive Cancellation Modal Workflow (`src/app/dashboard/page.tsx`):</b>", h2_style))
    story.append(Paragraph("1. User clicks **Cancel Booking** on any reservation card in the Guest Portal.", bullet_style))
    story.append(Paragraph("2. Front-end calculates `daysRemaining = (checkInTime - Date.now()) / 24h`.", bullet_style))
    story.append(Paragraph("3. Modal renders a visual Policy Tier Badge (`100% Full Refund`, `95% Refund (5% Fee)`, `90% Refund (10% Max Fee)`).", bullet_style))
    story.append(Paragraph("4. Displays a financial summary table: Total Paid, Fee Deduction (-$), Net Refund to Source Card ($).", bullet_style))
    story.append(Paragraph("5. Enforces explicit user consent via agreement checkbox (`[x] I have read and accept the cancellation fee policy terms.`).", bullet_style))

    story.append(Paragraph("<b>5.2 Backend Refund Execution (`DELETE /api/book`):</b>", h2_style))
    story.append(Paragraph("1. Authorizes guest ownership of reservation ID (`reservation.guestId === session.user.id`).", bullet_style))
    story.append(Paragraph("2. Computes exact `refundAmount = totalAmount * (refundPercent / 100)` and `retentionFee = totalAmount - refundAmount`.", bullet_style))
    story.append(Paragraph("3. Extracts Dodo Payment ID string and dispatches POST refund to Dodo API (`https://test.dodopayments.com/refunds`).", bullet_style))
    story.append(Paragraph("4. Executes database transaction updating reservation `status: 'CANCELED'` and payment `status: 'REFUNDED'`. ", bullet_style))
    story.append(Paragraph("5. Dispatches HTML receipt email to guest with financial breakdown.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 6: PAYMENT GATEWAY INTEGRATION
    # =========================================================================
    story.append(Paragraph("6. Dodo Payments Gateway Integration", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Bookme.com integrates with <b>Dodo Payments API</b> for credit card processing and automated REST refunding. "
        "The checkout lifecycle operates across three primary stages:",
        body_style
    ))

    story.append(Paragraph("<b>1. Checkout Session Creation (`POST /api/checkout/[id]/session`):</b>", h2_style))
    story.append(Paragraph("• Reads grand total invoice amount (room base cost + add-on experiences + 15% resort taxes).", bullet_style))
    story.append(Paragraph("• Converts total amount to integer cents (`amountInCents = Math.round(totalAmount * 100)`).", bullet_style))
    story.append(Paragraph("• Sends POST request to `https://test.dodopayments.com/checkouts` with product details and return URL.", bullet_style))
    story.append(Paragraph("• Returns hosted checkout URL string (`data.checkout_url`) to client for immediate redirect.", bullet_style))

    story.append(Paragraph("<b>2. Payment Webhook Processor (`POST /api/webhooks/dodo`):</b>", h2_style))
    story.append(Paragraph("• Receives asynchronous payment status webhooks from Dodo Payments.", bullet_style))
    story.append(Paragraph("• On `payment.succeeded` event, updates reservation status from `PENDING` to `CONFIRMED` and payment record status to `COMPLETED`.", bullet_style))
    story.append(Paragraph("• Generates room assignment (`room.status = 'OCCUPIED'`) and dispatches booking confirmation email.", bullet_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 7: ROLE-BASED DASHBOARDS & OPERATIONAL DESKS
    # =========================================================================
    story.append(Paragraph("7. Role-Based Dashboard Desks", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "The dashboard (`src/app/dashboard/page.tsx`) renders dynamic role-specific interfaces based on `session.user.role`:",
        body_style
    ))

    story.append(Paragraph("<b>7.1 Guest Portal View:</b>", h2_style))
    story.append(Paragraph("• <b>My Bookings Tab:</b> Displays active and historical stay cards with status badges (`CONFIRMED`, `PENDING`, `CANCELED`), stay dates, suite categories, and 'Cancel Booking' triggers.", bullet_style))
    story.append(Paragraph("• <b>Saved Favorites Tab:</b> Grid view of bookmarked resorts with high-resolution imagery, location tags, ratings, and instant booking triggers.", bullet_style))
    story.append(Paragraph("• <b>My Profile Tab:</b> User account summary card showing verification badge, total bookings count, and saved resorts count.", bullet_style))

    story.append(Paragraph("<b>7.2 Staff Task Queue & Housekeeping View:</b>", h2_style))
    story.append(Paragraph("• <b>Housekeeping Desk:</b> Real-time room status grid (`CLEAN`, `DIRTY`, `IN_PROGRESS`, `INSPECTED`). Staff can toggle cleaning statuses with one click.", bullet_style))
    story.append(Paragraph("• <b>Guest Request Queue:</b> Lists active guest requests (room service, extra towels, shuttle requests) with status filters and staff assignment selectors.", bullet_style))

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 8: ADMIN CONSOLE & RBAC GOVERNANCE
    # =========================================================================
    story.append(Paragraph("8. Admin Console & RBAC Governance", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Administrative operators (`role === 'ADMIN'`) have access to system-wide management controls:",
        body_style
    ))

    story.append(Paragraph("• <b>Granular RBAC Permissions:</b> Custom operational roles can be provisioned with specific permission keys (`MANAGE_BOOKINGS`, `HOUSEKEEPING`, `FINANCE_ACCESS`, `STAFF_MANAGEMENT`, `DEPT_MANAGEMENT`, `MANAGE_SERVICES`, `PROPERTIES_MANAGEMENT`).", bullet_style))
    story.append(Paragraph("• <b>Staff Directory & Department Allocation:</b> Add new staff members, assign operational roles, and link them to resort departments.", bullet_style))
    story.append(Paragraph("• <b>Properties & Room Inventory:</b> Create new resort listings, edit suite categories, manage base night rates, and archive maintenance units.", bullet_style))
    story.append(Paragraph("• <b>Audit CSV Exports:</b> Embedded CSV generator buttons (`exportBookingsCSV`, `exportFinanceCSV`) for offline financial auditing.", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 9: COMPLETE API ROUTE SPECIFICATION
    # =========================================================================
    story.append(Paragraph("9. Complete API Endpoint Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "Below is the exhaustive specification table for all 22 backend API endpoints:",
        body_style
    ))

    api_full_data = [
        [Paragraph("<b>HTTP</b>", body_style), Paragraph("<b>Endpoint Path</b>", body_style), Paragraph("<b>Auth Scope</b>", body_style), Paragraph("<b>Request Payload / Params</b>", body_style), Paragraph("<b>Response Summary & Function</b>", body_style)],
        [Paragraph("GET", body_style), Paragraph("`/api/resorts`", body_style), Paragraph("Public", body_style), Paragraph("`?page=1&limit=12&query=Bali`", body_style), Paragraph("Returns paginated resort listings & total count", body_style)],
        [Paragraph("GET", body_style), Paragraph("`/api/resorts/[id]`", body_style), Paragraph("Public", body_style), Paragraph("URL param `id`", body_style), Paragraph("Returns resort detail, room types & services", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/signup`", body_style), Paragraph("Public", body_style), Paragraph("`{ email, password, fullName }`", body_style), Paragraph("Hashes password, sends OTP code & returns user ID", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/signup/verify`", body_style), Paragraph("Public", body_style), Paragraph("`{ email, code }`", body_style), Paragraph("Validates OTP code & sets `isVerified = true`", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/signup/resend`", body_style), Paragraph("Public", body_style), Paragraph("`{ email }`", body_style), Paragraph("Generates & dispatches fresh 6-digit OTP code", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/auth/[...nextauth]`", body_style), Paragraph("Public", body_style), Paragraph("`{ email, password }`", body_style), Paragraph("NextAuth JWT login endpoint", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/book`", body_style), Paragraph("Guest", body_style), Paragraph("`{ roomTypeId, checkIn, checkOut, serviceIds }`", body_style), Paragraph("Secures draft reservation & returns reservationId", body_style)],
        [Paragraph("DELETE", body_style), Paragraph("`/api/book`", body_style), Paragraph("Guest/Staff", body_style), Paragraph("`?id={reservationId}`", body_style), Paragraph("Executes tiered refund & updates DB to CANCELED", body_style)],
        [Paragraph("GET", body_style), Paragraph("`/api/checkout/[id]`", body_style), Paragraph("Guest", body_style), Paragraph("URL param `id`", body_style), Paragraph("Returns checkout session summary & total invoice", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/checkout/[id]/session`", body_style), Paragraph("Guest", body_style), Paragraph("`{ guestPhone }`", body_style), Paragraph("Creates Dodo checkout & returns hosted payment URL", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/webhooks/dodo`", body_style), Paragraph("System", body_style), Paragraph("Dodo webhook payload", body_style), Paragraph("Updates reservation to CONFIRMED & payment to COMPLETED", body_style)],
        [Paragraph("GET", body_style), Paragraph("`/api/dashboard/guest`", body_style), Paragraph("Guest", body_style), Paragraph("Session JWT", body_style), Paragraph("Returns guest bookings, favorites, & profile info", body_style)],
        [Paragraph("GET", body_style), Paragraph("`/api/dashboard/staff`", body_style), Paragraph("Staff", body_style), Paragraph("Session JWT", body_style), Paragraph("Returns housekeeping task list & room statuses", body_style)],
        [Paragraph("GET", body_style), Paragraph("`/api/dashboard/admin`", body_style), Paragraph("Admin", body_style), Paragraph("Session JWT", body_style), Paragraph("Returns system KPIs, audit logs & revenue ledgers", body_style)],
        [Paragraph("GET", body_style), Paragraph("`/api/favorites`", body_style), Paragraph("Guest", body_style), Paragraph("Session JWT", body_style), Paragraph("Returns array of favorite resort IDs", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/favorites`", body_style), Paragraph("Guest", body_style), Paragraph("`{ resortId }`", body_style), Paragraph("Toggles bookmark status of resort ID", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/admin/roles`", body_style), Paragraph("Admin", body_style), Paragraph("`{ name, permissions }`", body_style), Paragraph("Creates custom operational role entity", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/admin/staff`", body_style), Paragraph("Admin", body_style), Paragraph("`{ email, password, name, roleId, deptId }`", body_style), Paragraph("Provisions new staff account & links department", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/admin/departments`", body_style), Paragraph("Admin", body_style), Paragraph("`{ name, manager }`", body_style), Paragraph("Creates operational resort department entity", body_style)],
        [Paragraph("POST", body_style), Paragraph("`/api/admin/services`", body_style), Paragraph("Admin", body_style), Paragraph("`{ name, category, price, resortId }`", body_style), Paragraph("Creates add-on service experience entity", body_style)],
    ]
    t_api_full = Table(api_full_data, colWidths=[40, 115, 65, 140, 140])
    t_api_full.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_api_full)

    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 10: ENVIRONMENT CONFIGURATION & SETUP MANUAL
    # =========================================================================
    story.append(Paragraph("10. Environment Variables & Setup Guide", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(
        "To deploy or run Bookme.com locally, create a <code>.env</code> file in the project root containing:",
        body_style
    ))

    env_snippet = """# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/resort_db?schema=public"

# NextAuth Authentication Config
NEXTAUTH_SECRET="your-super-secret-jwt-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Nodemailer SMTP Email Dispatch
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"

# Payment Gateway Keys
DODO_PAYMENTS_API_KEY="test_dodo_api_key_string"
TO_EMAIL="code.faisal.dev@gmail.com" """

    story.append(Paragraph(env_snippet.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style))

    story.append(Paragraph("<b>Step-by-Step Command Execution Guide:</b>", h2_style))
    story.append(Paragraph("1. <b>Install Dependencies:</b> <code>npm install</code>", bullet_style))
    story.append(Paragraph("2. <b>Database Migration Push:</b> <code>npx prisma db push</code>", bullet_style))
    story.append(Paragraph("3. <b>Seed Database:</b> <code>node prisma/seed.js</code>", bullet_style))
    story.append(Paragraph("4. <b>TypeScript Compiler Audit:</b> <code>npx tsc --noEmit</code>", bullet_style))
    story.append(Paragraph("5. <b>Launch Development Server:</b> <code>npm run dev</code>", bullet_style))
    story.append(Paragraph("6. <b>Production Build Audit:</b> <code>npx next build</code>", bullet_style))

    story.append(Spacer(1, 14))
    story.append(Paragraph("<i>End of Official Technical System Manual — Bookme.com System Architecture v1.0.0</i>", ParagraphStyle('FooterNote2', fontName='Helvetica-Oblique', fontSize=8.5, textColor=TEXT_MUTED, alignment=1)))

    doc.build(story, canvasmaker=NumberedCanvas)
    print("Exhaustive PDF Generated Successfully:", pdf_filename)

if __name__ == '__main__':
    build_pdf()
