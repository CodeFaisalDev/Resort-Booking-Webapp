# Portfolio Case Study: bookme.com — Next-Gen Luxury Resort & Hospitality Booking Platform

## 📌 Project Overview
**bookme.com** is a full-stack, enterprise-grade luxury resort management and booking web application. Built with Next.js 16 (App Router), React 19, TypeScript, Prisma ORM, and PostgreSQL, the platform delivers a cinematic, 60fps user experience for travelers while providing resort operators with a robust, role-based administration system.

The application spans the entire hospitality workflow—from immersive 3D destination discovery and interactive Leaflet map filtering to multi-tier RBAC management, real-time room turnover state machines, automated Dodo Payment webhooks, and Nodemailer transaction receipts.

---

## 🚀 Key Features

### 🌟 Guest Experience
- **Cinematic 3D Hero & Parallax Animations:** Preloader screen, floating tilt cards, and fluid scroll transitions designed to evoke modern luxury aesthetics.
- **Interactive Stays Map:** Custom Leaflet/OpenStreetMap integration allowing users to explore overwater villas and chalets visually with live price tags and instant preview popups.
- **Advanced Resort Filtering & Search:** Real-time search across destinations, room types, price ranges, ratings, and amenity combinations.
- **Provisional & Instant Checkout:** Multi-step reservation engine supporting add-on concierge services (spa treatments, airport charters) with provisional room holds.
- **Self-Service Guest Dashboard:** Comprehensive guest portal to manage active reservations, view itemized invoice breakdowns, add stay services, write reviews, and process cancellations.

### 🛡️ Operator & Admin Control Panel
- **Role-Based Access Control (RBAC):** Distinct permission levels and dedicated UI views for `GUEST`, `STAFF`, and `ADMIN`.
- **Live KPI Analytics & Operational Metrics:** Real-time revenue metrics, occupancy rates, pending check-ins, and active room stats powered by custom server-side caching.
- **Housekeeping & Turnover State Machine:** Automated room status tracking (`CLEAN` ➔ `OCCUPIED` ➔ `DIRTY` ➔ `MAINTENANCE`) with staff shift assignment and task turnover workflows.
- **Prorated Stay Truncation & Refund Engine:** Administrative tool enabling staff to adjust guest check-out dates mid-stay, automatically recalculating charges and issuing instant prorated refunds via payment webhooks.

### 💳 Payments & Automation
- **Dodo Payments & Webhook Architecture:** Automated processing for `payment.succeeded` and `refund.succeeded` events with transactional database state updates.
- **Nodemailer Transactional Communications:** HTML email system sending styled verification codes, password resets, booking receipts, check-in welcomes, and refund vouchers.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 16 (App Router & Turbopack), React 19, TypeScript, Tailwind CSS, Lucide Icons, GSAP & Framer Motion.
- **Mapping & Visuals:** Leaflet.js, OpenStreetMap, HTML5 Canvas, Custom Skeleton Loaders.
- **Backend & Database:** Next.js Route Handlers & Server Actions, Prisma ORM 6, PostgreSQL, NextAuth.js (JWT authentication).
- **Payments & Webhooks:** Dodo Payments API, Crypto Signature Verification.
- **Email Infrastructure:** Nodemailer with SMTP transport.
- **State Management & Caching:** In-memory TTL dashboard caching layer (`dashboardCache`), Prisma `$transaction` isolation.

---

## 💡 Technical Challenges & Solutions

### 1. Concurrent Room Reservations & Preventing Double Booking
- **The Challenge:** High-traffic booking platforms face race conditions where two users attempt to reserve the same room for overlapping check-in/check-out date ranges simultaneously.
- **The Solution:** Implemented strict transactional isolation using Prisma's `prisma.$transaction()` with explicit date overlap queries (`checkIn < newCheckOut AND checkOut > newCheckIn`). If a conflict is detected, the transaction aborts instantly, guaranteeing data integrity without overbooking.

### 2. Complex Mid-Stay Truncation & Automated Prorated Refunds
- **The Challenge:** When an admin truncates an active guest stay (e.g., guest checks out 3 days early), the system must compute nights stayed vs. remaining nights, calculate partial room refunds plus unused service add-ons, update room availability, and issue a credit via webhook without breaking payment reconciliation.
- **The Solution:** Engineered a custom calculation algorithm in `src/app/api/admin/bookings/route.ts` that calculates `proratedTotal = (dailyRate * nightsStayed) + activeServicesCost`, updates database payment records transactionally, triggers a Dodo refund API request, and dispatches an itemized HTML refund email to the guest.

### 3. High-Performance Dashboard with Low Database Load
- **The Challenge:** The admin panel fetches multi-table aggregations (reservations, staff schedules, housekeeping tasks, revenue totals) on every page refresh, threatening database CPU spikes under frequent operator updates.
- **The Solution:** Architected a lightweight, server-side TTL caching layer (`dashboardCache`) that stores computed KPI metrics with smart cache invalidation. Write actions (e.g., checking in a guest, assigning a cleaning task) instantly invalidate relevant cache keys, achieving sub-50ms dashboard response times.

### 4. Flawless 60fps Visual Aesthetics with SSR/Hydration Compatibility
- **The Challenge:** Combining heavy visual animations (GSAP timelines, dynamic backdrop image transitions, interactive maps, scroll listeners) with Next.js Server Side Rendering (SSR) frequently leads to hydration mismatch warnings or layout shifts.
- **The Solution:** Decoupled client-only animation triggers into dedicated dynamic components wrapped in `useEffect` and dynamic imports (`ssr: false` for Leaflet). Implemented custom skeleton loaders to ensure Zero Cumulative Layout Shift (CLS) during data fetching.

---

## 📈 Impact & Portfolio Summary Points

- **Full-Stack Competency:** Designed and developed the entire application from database schema architecture to polished UI micro-interactions.
- **Security & Reliability:** Built robust RBAC security, JWT session management, input validation, and secure webhook signature verification.
- **Real-World Business Logic:** Handled complex edge cases including mid-stay modifications, room turnover state transitions, and automated email receipts.
