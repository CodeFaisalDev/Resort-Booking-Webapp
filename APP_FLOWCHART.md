# Comprehensive Application Architecture & System Flowchart

**Project**: Online Resort Management & Booking System (`bookme.com`)  
**Stack**: Next.js 16 (App Router + Turbopack), React 19, TypeScript, Prisma ORM, PostgreSQL, NextAuth.js, Nodemailer, Dodo Payments API, Leaflet Maps, GSAP & Tailwind CSS.

---

## 1. High-Level System Architecture Flowchart

```mermaid
flowchart TD
    %% User Roles & Access Points
    subgraph Users ["Users & Client Interfaces"]
        Guest["👤 Guest User"]
        Staff["👨‍💼 Staff Member"]
        Admin["👑 System Admin"]
    end

    subgraph Entry ["Public Application & Landing"]
        Home["🏠 Homepage (GSAP Parallax & Interactive Map)"]
        Catalog["🏨 Resort Catalog (/resorts)"]
        Details["🛋️ Resort Details & Room Config (/resorts/[id])"]
        Login["🔐 Auth & Verification (/login, /signup)"]
    end

    subgraph CoreEngine ["Core Business Logic & API Layer"]
        AuthAPI["/api/auth (NextAuth JWT + Email Code)"]
        BookAPI["/api/book (Booking & Dynamic Tiered Cancellation)"]
        CheckoutAPI["/api/checkout/[id] (Dodo Payments Gateway)"]
        DashboardAPI["/api/dashboard (Guest, Staff, Admin endpoints)"]
        AdminAPI["/api/admin (Roles, Staff, Services, Depts)"]
    end

    subgraph PaymentService ["External Services"]
        DodoPay["💳 Dodo Payments API (Checkout & Refunds)"]
        SMTPMail["✉️ Nodemailer SMTP (Verification & Invoices)"]
    end

    subgraph DatabaseLayer ["Database Infrastructure"]
        Postgres[(🐘 PostgreSQL Database via Prisma ORM)]
    end

    %% User Interactions
    Guest --> Home
    Guest --> Catalog
    Guest --> Details
    Guest --> Login
    Staff --> Login
    Admin --> Login

    %% Public Flow
    Home --> Catalog
    Catalog --> Details
    Details -->|Secures Draft Stay| CheckoutAPI
    CheckoutAPI --> DodoPay
    DodoPay -->|Webhook/Callback| BookAPI

    %% Auth Flow
    Login --> AuthAPI
    AuthAPI --> SMTPMail
    AuthAPI --> Postgres

    %% Dashboard Operations
    Guest -->|Manage Stays & Favorites| DashboardAPI
    Staff -->|Housekeeping & Task Queue| DashboardAPI
    Admin -->|Properties, Roles & Ledgers| AdminAPI

    %% API to Database
    BookAPI --> Postgres
    DashboardAPI --> Postgres
    AdminAPI --> Postgres
    BookAPI -->|Automated Refund| DodoPay
    BookAPI -->|Confirmation Email| SMTPMail
```

---

## 2. Dynamic Tiered Cancellation & Refund Flowchart

```mermaid
flowchart TD
    Start["Guest clicks 'Cancel Booking' on Dashboard"] --> FetchDetails["Fetch Reservation Details & Check-In Date"]
    FetchDetails --> CalcDays["Calculate Days Remaining = (CheckIn - CurrentTime) / 24h"]
    
    CalcDays --> CheckConfirmed{"Is Reservation Status CONFIRMED?"}
    
    CheckConfirmed -->|No - PENDING| Tier0["Tier 0: Unpaid/Pending Booking\n100% Refund ($0 Retention Fee)"]
    
    CheckConfirmed -->|Yes - Paid| EvaluateDays{"Check Days Remaining until Check-In"}
    
    EvaluateDays -->|">= 7 Days"| Tier1["🟢 Tier 1: Standard Notice\n100% Full Refund ($0 Fee)"]
    EvaluateDays -->|"3 to 7 Days"| Tier2["🟡 Tier 2: 3-7 Days Notice\n95% Refund (5% Processing Fee)"]
    EvaluateDays -->|"< 3 Days / Past Date"| Tier3["🟠 Tier 3: Late Notice / Same Day\n90% Refund (10% Max Fee Cap)"]

    Tier0 --> PreviewModal["Render Cancellation Breakdown Modal"]
    Tier1 --> PreviewModal
    Tier2 --> PreviewModal
    Tier3 --> PreviewModal

    PreviewModal --> UserReview["User Views Total Paid, Fee, & Net Refund"]
    UserReview --> AcceptTerms{"User Checks Agreement Box?"}
    
    AcceptTerms -->|No| KeepBtn["User Clicks 'Keep Reservation' -> Modal Closes"]
    AcceptTerms -->|Yes| ConfirmBtn["User Clicks 'Confirm Cancellation'"]

    ConfirmBtn --> CallAPI["DELETE /api/book?id={reservationId}"]
    CallAPI --> ProcessRefund{"Is Refund Amount > $0 & Dodo Key Present?"}

    ProcessRefund -->|Yes| DodoRefund["Trigger Automated Dodo Refund POST /refunds"]
    ProcessRefund -->|No / Dev Bypass| WarnLog["Log Warning & Proceed with DB Cancellation"]

    DodoRefund --> DBUpdate["Update DB: Reservation -> 'CANCELED', Payment -> 'REFUNDED'"]
    WarnLog --> DBUpdate

    DBUpdate --> SendEmail["Dispatch Detailed Email Invoice with Policy Breakdown"]
    SendEmail --> ToastNotify["Show Success Toast & Re-Sync Dashboard UI State"]
    ToastNotify --> End["Complete"]
```

---

## 3. End-to-End User Journey Flowchart

```mermaid
flowchart LR
    subgraph Discovery ["1. Discovery & Search"]
        A1[Browse Homepage] --> A2[Filter by Location / Date / Guests]
        A2 --> A3[Interactive Leaflet Map FlyTo]
    end

    subgraph Selection ["2. Suite & Experience Selection"]
        B1[View Resort Details] --> B2[Select Room Type Category]
        B2 --> B3[Add Spa & Culinary Services]
        B3 --> B4[View Live Invoice Breakdown]
        B4 --> B5[View Cancellation Policy Banner]
    end

    subgraph Checkout ["3. Secure Checkout & Payment"]
        C1[Create Draft Reservation] --> C2[Redirect to Checkout Page]
        C2 --> C3[Enter Guest Contact Information]
        C3 --> C4[Redirect to Dodo Payments Gateway]
        C4 --> C5[Payment Completed & Webhook Triggered]
    end

    subgraph Management ["4. Guest & Staff Operations"]
        D1[Access Role Dashboard] --> D2{User Role}
        D2 -->|Guest| D3[View Active Bookings, Favorites & Profile]
        D2 -->|Staff| D4[Manage Housekeeping & Task Queue]
        D2 -->|Admin| D5[Manage Properties, Roles, Finance CSV Exports]
    end

    Discovery --> Selection
    Selection --> Checkout
    Checkout --> Management
```

---

## 4. Comprehensive Feature & Functionality Matrix

### 👤 Guest Portal Features
- **Cinematic Homepage**: GSAP scroll animations, 3D mouse parallax cards, interactive Leaflet resort map, and pricing estimator calculator.
- **Resort Discovery**: Instant search by location, guest counts, stay duration, and date ranges.
- **Suite Customization**: Real-time invoice estimation with add-on experience toggles (Lagoon Breakfast, Balinese Spa, Sunset High Tea).
- **Dynamic Tiered Cancellation**:
  - Full refund for ≥ 7 days notice.
  - 95% refund for 3–7 days notice (5% fee).
  - 90% refund for < 3 days / past check-in (capped at 10% maximum fee).
  - Interactive cancellation modal with clear financial breakdown.
- **Saved Favorites**: One-click bookmarking of luxury resorts.
- **Guest Profile**: Account verification status, reservation count, and contact management.

### 👨‍💼 Staff Desk Features
- **Task Queue Dashboard**: Real-time listing of guest requests, maintenance tasks, and service orders.
- **Housekeeping Desk**: Filter rooms by status (`CLEAN`, `DIRTY`, `IN_PROGRESS`, `INSPECTED`), assign staff members, and log status updates.
- **Guest Reservation Lookup**: Inspect check-in dates, suite numbers, and payment verification.

### 👑 Admin Management Features
- **Property & Room Management**: Create, edit, and archive resort properties, room categories, and suite numbers.
- **Role-Based Access Control (RBAC)**: Create custom staff roles with granular permissions (`MANAGE_BOOKINGS`, `HOUSEKEEPING`, `FINANCE_ACCESS`, `STAFF_MANAGEMENT`, `DEPT_MANAGEMENT`, `MANAGE_SERVICES`, `PROPERTIES_MANAGEMENT`).
- **Staff Directory**: Add new staff, assign departments, and update operational roles.
- **Financial Ledgers & CSV Exports**: One-click CSV export buttons for bookings audit logs and financial revenue ledgers.

---

## 5. API Endpoint Matrix

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/resorts` | Public | List resorts with pagination, search query, and filters |
| `GET` | `/api/resorts/[id]` | Public | Fetch resort details, room types, and add-on services |
| `POST` | `/api/signup` | Public | Register new guest, send verification code via Nodemailer |
| `POST` | `/api/signup/verify` | Public | Verify 6-digit email code and activate account |
| `POST` | `/api/auth/[...nextauth]` | Public | Handle NextAuth JWT credentials login |
| `POST` | `/api/book` | Guest | Create draft stay reservation |
| `DELETE` | `/api/book` | Guest / Staff | Cancel reservation with dynamic tiered refund calculation |
| `GET` | `/api/checkout/[id]` | Guest | Fetch checkout session details & invoice breakdown |
| `POST` | `/api/checkout/[id]/session` | Guest | Generate Dodo Payments checkout session URL |
| `POST` | `/api/webhooks/dodo` | System | Process payment completion webhooks |
| `GET` | `/api/dashboard/guest` | Guest | Fetch guest reservations, favorites, and profile |
| `GET` | `/api/dashboard/staff` | Staff | Fetch housekeeping task queue and room statuses |
| `GET` | `/api/dashboard/admin` | Admin | Fetch system KPIs, revenue metrics, and audit logs |
| `GET/POST` | `/api/favorites` | Guest | Fetch and toggle bookmarked resorts |
| `GET/POST` | `/api/admin/roles` | Admin | Manage operational roles and granular permissions |
| `GET/POST` | `/api/admin/staff` | Admin | Manage staff accounts and department assignments |
| `GET/POST` | `/api/admin/departments` | Admin | Manage resort departments |
| `GET/POST` | `/api/admin/services` | Admin | Manage resort add-on services |
