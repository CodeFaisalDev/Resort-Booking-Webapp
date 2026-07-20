# Resort Room Booking and Management System: System Architecture

Welcome to the architectural documentation for the **Resort Room Booking and Management System**. This document describes the application design, modern tech stack, key components, and directory layout.

---

## 1. Executive Technology Stack

The application is built as a unified full-stack web application optimized for performance, security, and aesthetics.

*   **Framework:** **Next.js (v16.2.10, App Router)** with **React (v19)**. The project leverages Server Components for SEO and fast initial renders, and Client Components (using `'use client'`) for interactive widgets.
*   **Database ORM:** **Prisma Client (v6.2.1)** connected to **Neon Serverless PostgreSQL**. Type-safe database queries are written through Prisma, with a database schema defined in `prisma/schema.prisma`.
*   **Authentication & Security:** **Next-Auth (Auth.js v4.24.14)** with Credentials Provider. It implements Role-Based Access Control (RBAC) supporting three primary user tiers:
    1.  **Guest:** Access to the booking engine, reservation history, checkout invoice, and profile management.
    2.  **Staff:** Housekeeping, room inspection dashboard, and task completion flow.
    3.  **Admin (Specialized Staff):** Full operational control panel including financial reporting, department management, staff CRUD, and booking audit desks.
*   **Styling & UI Components:** **Tailwind CSS (v4)** with custom configurations and components from **21st.dev**. Responsive layouts incorporate **GSAP (GreenSock)** scroll animations, **canvas-confetti** for micro-interactions, and **Leaflet Maps** for coordinate tracking.
*   **Notifications Subsystem:** **Nodemailer** for sending automated booking receipts and notifications via SMTP.
*   **Payment Simulator:** Mock checkout integrating with simulated **Dodo Payments** webhooks to mock credit card payments and secure transactional workflows.

---

## 2. Directory Layout & Organization

The codebase is organized in a standard Next.js App Router structure:

```
Online Resort Management System/
├── prisma/                          # Database configuration and migration files
│   ├── schema.prisma                # Prisma DB schema definition
│   ├── seed.js                      # Predefined seed data for development
│   └── seed_100.js                  # Advanced seeding script (generating 100+ items)
├── public/                          # Static assets (SVGs, favicon)
├── src/
│   ├── app/                         # App Router page components & API endpoints
│   │   ├── about/                   # Public about page
│   │   ├── api/                     # Backend API routes (Admin, Auth, Book, checkout, Dashboard, Housekeeping)
│   │   ├── book/                    # Interactive booking flow pages
│   │   ├── checkout/                # Invoice review and mock payment pages
│   │   ├── dashboard/               # Main role-based management dashboard
│   │   ├── resorts/                 # Resorts browsing pages
│   │   ├── globals.css              # Global styles & Tailwind directives
│   │   ├── layout.tsx               # Root HTML wrapper and session provider
│   │   └── page.tsx                 # High-performance animated landing page
│   ├── components/                  # Reusable UI widgets and layout modules
│   │   ├── ui/                      # Primitive design-system components (buttons, dialogs, dropdowns, etc.)
│   │   ├── Navbar.tsx               # Global persistent header navigation
│   │   ├── Footer.tsx               # Responsive interactive footer
│   │   └── AnimateOnScroll.tsx      # GSAP scroll-triggered wrapper
│   ├── lib/                         # Shared utilities and global singletons
│   │   ├── auth.ts                  # Next-Auth configuration & credentials callbacks
│   │   ├── cache.ts                 # In-memory API response cache
│   │   ├── db.ts                    # Prisma DB client instantiation
│   │   ├── mailer.ts                # Nodemailer transporter and send helper
│   │   └── utils.ts                 # CSS class-merging helper
│   └── proxy.ts                     # Next-Auth routing middleware configuration
├── package.json                     # Node.js dependencies and run scripts
├── tsconfig.json                    # TypeScript compiler configuration
└── components.json                  # Shadcn-UI configuration
```

---

## 3. Core Database Models

The database models mapped in `prisma/schema.prisma` form the backbone of the resort's operational data flow:

*   **Resort:** Represents different property locations (e.g., Maldives, Bali, Aspen) with coordinates, ratings, and image arrays.
*   **RoomType:** Defines different room categories (`Deluxe`, `Suite`, `Villa`) with base pricing, description, and occupancy capacities.
*   **Room:** Specific physical rooms linked to a `Resort` and `RoomType`, tracking their current cleaning state (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `DIRTY`).
*   **Guest:** User accounts for public visitors, containing email, hashed password, nationality, and phone details.
*   **Reservation:** Tracks check-in/out schedules, guest counts, total pricing, and reservation states (`PENDING`, `CONFIRMED`, `CANCELED`).
*   **Payment:** Records billing transactions linked to reservations, detailing amounts, payment methods, and statuses (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`).
*   **Department & Staff:** Internal corporate structure mapping staff members to departments (e.g., Housekeeping, Front Desk) and roles (e.g., `STAFF` vs. `ADMIN`).
*   **Service:** Extra guest services (`Spa Treatment`, `Private Chef`, `Airport Transfer`) with pricing.
*   **ReservationService:** Join model linking selected add-on services to reservations.
*   **RoomAssignment:** Tracks tasks (`Turnover Cleaning`, `Deep Sweep`, `Repair`) assigned to staff members for a specific room.

---

## 4. Key Architectural Patterns

### A. Next-Auth Credentials & Custom Session JWTs
To maintain role-based access control (RBAC), Next-Auth callbacks in `src/lib/auth.ts` inspect the incoming login request. Staff accounts verify credentials against the `Staff` table, while guest accounts check the `Guest` table. If successful, user roles (`ADMIN`, `STAFF`, `GUEST`) and user types (`staff`, `guest`) are stored in the JWT token and forwarded to the client-side session.

### B. In-Memory Singletons (Database & Cache)
To avoid exhausting connection pools in serverless contexts:
1.  **Prisma Client (`src/lib/db.ts`):** Created as a global singleton `globalForPrisma.prisma` to prevent re-instantiation on Next.js hot-reloads.
2.  **Memory Cache (`src/lib/cache.ts`):** Instantiated globally to cache stable API endpoints like resort listings, minimizing redundant SQL queries.

### C. Route Middleware Protection (`src/proxy.ts`)
Standard Next-Auth middleware handles route-level route protection. Only authenticated sessions can access subpaths matching `/dashboard/:path*`, `/book/:path*`, and `/checkout/:path*`, redirecting anonymous users back to the `/login` page.

### D. Transaction Isolation for Bookings & Cleanliness
To prevent overbooking or inconsistent states:
-   **Booking Engine (`src/app/api/book/route.ts`):** Performs date conflict scans.
-   **Administrative Actions (`src/app/api/admin/bookings/route.ts`):** Integrates transactional operations (`prisma.$transaction`) to handle check-in, check-out, and mid-stay cancellations. Canceling a stay mid-way updates the reservation, updates the room status to `DIRTY`, adjusts the original payment to a prorated amount, and inserts a refund payment record in a single, atomic operation.
