# Project Brief: Luxury Horizon Resort Management System

This document outlines the end-to-end technical specification and architecture for the **Online Resort Management System**. The application is designed as a high-performance, responsive, full-stack web application leveraging 3D interactive design aesthetics.

---

## 1. Executive Tech Stack Summary

*   **Framework:** Next.js (App Router) for unified full-stack architecture, utilizing Server Components for optimal SEO and lightning-fast loading speeds.
*   **Database:** Neon PostgreSQL (Serverless Postgres) paired with Prisma ORM or Drizzle ORM for type-safe database access.
*   **UI/UX Component Ecosystem:** 21st.dev for advanced Tailwind CSS configurations and interactive 3D elements (e.g., mouse-tilt room models, custom scroll-linked animations, and premium modular layouts).
*   **Authentication:** Next-Auth (Auth.js) or Clerk, incorporating Multi-Factor Authentication (MFA) and Role-Based Access Control (RBAC) distinguishing `Guest`, `Staff`, and `Admin`.
*   **Payment Gateway Simulation:** Dodo Payments (Sandbox Mode) for secure mock transactions, webhook handling, and simulated digital invoicing.
*   **Email Notification Subsystem:** Nodemailer wired to Gmail SMTP with secure app passwords for automated transactional emails (booking confirmations, payment receipts, task alerts).

---

## 2. Core Functional Modules

### A. Guest Portal (Public-Facing App)
*   **Immersive Booking Flow:** 3D room showcase components via 21st.dev allowing users to switch room types (`Deluxe`, `Suite`) dynamically[cite: 1].
*   **Real-time Availability Engine:** Date-picker calculations against conflicting `check_in` and `check_out` schedules to block overbooking[cite: 1].
*   **Add-on Services Marketplace:** Options to bundle internal services (`Spa`, `Room Service`) directly during reservation checkout[cite: 1].
*   **Personal Dashboard:** History of previous stays, ongoing reservations, pending payment records, and easy profile management[cite: 1].

### B. Admin & Staff Operations Control Panel
*   **Role-Based Dashboards:** 
    *   *Admins:* View financial metrics, manage `DEPARTMENT` setups, analyze staff distribution, and run system audits[cite: 1].
    *   *Staff:* Dedicated task manager showing items from the `ROOM_ASSIGNMENT` matrix (e.g., room turnovers, maintenance requests)[cite: 1].
*   **Room Housekeeping Matrix:** Live table updates updating a room's status (`available`, `occupied`, `dirty`) in real time[cite: 1].
*   **Billing & Settlement Portal:** Admin panel interfaces to view `PAYMENT` logs, resolve pending transactions, and track revenue[cite: 1].

---

## 3. Database Schema Design (Neon PostgreSQL)

Below is the structured Prisma database schema mapping out all required attributes, data types, and logical relations based on the system ER diagram[cite: 1].

```prisma
// datasource configuration for Neon Serverless Postgres
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
  MAINTENANCE
  DIRTY
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CANCELED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

model Guest {
  id           String        @id @default(uuid()) @db.Uuid
  fullName     String        @map("full_name")
  email        String        @unique
  idProofNum   String        @map("id_proof_num")
  phone        String
  nationality  String
  reservations Reservation[]
  payments     Payment[]

  @@map("guest")
}

model RoomType {
  id           String  @id @default(uuid()) @db.Uuid
  name         String
  description  String  @db.Text
  basePrice    Decimal @map("base_price") @db.Decimal(10, 2)
  maxOccupency Int     @map("max_occupency")
  rooms        Room[]

  @@map("room_type")
}

model Room {
  id              String           @id @default(uuid()) @db.Uuid
  roomTypeId      String           @map("room_type_id") @db.Uuid
  roomNum         String           @unique @map("room_num")
  floor           String
  status          RoomStatus       @default(AVAILABLE)
  roomType        RoomType         @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)
  reservations    Reservation[]
  roomAssignments RoomAssignment[]

  @@map("room")
}

model Reservation {
  id                 String               @id @default(uuid()) @db.Uuid
  guestId            String               @map("guest_id") @db.Uuid
  roomId             String               @map("room_id") @db.Uuid
  checkIn            DateTime             @map("check_in") @db.Date
  checkOut           DateTime             @map("check_out") @db.Date
  numGuests          Int                  @map("num_guests")
  status             ReservationStatus    @default(PENDING)
  totalAmount        Decimal              @map("total_amount") @db.Decimal(10, 2)
  createdAt          DateTime             @default(now()) @map("created_at")
  guest              Guest                @relation(fields: [guestId], references: [id], onDelete: Cascade)
  room               Room                 @relation(fields: [roomId], references: [id], onDelete: Cascade)
  payments           Payment[]
  reservationServices ReservationService[]
  roomAssignments    RoomAssignment[]

  @@map("reservation")
}

model Payment {
  id            String        @id @default(uuid()) @db.Uuid
  reservationId String        @map("reservation_id") @db.Uuid
  guestId       String        @map("guest_id") @db.Uuid
  amount        Decimal       @db.Decimal(10, 2)
  method        String
  status        PaymentStatus @default(PENDING)
  paidAt        DateTime?     @map("paid_at")
  reservation   Reservation   @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  guest         Guest         @relation(fields: [guestId], references: [id], onDelete: Cascade)

  @@map("payment")
}

model Department {
  id          String  @id @default(uuid()) @db.Uuid
  name        String
  managerName String  @map("manager_name")
  staffs      Staff[]

  @@map("department")
}

model Staff {
  id              String           @id @default(uuid()) @db.Uuid
  departmentId    String           @map("department_id") @db.Uuid
  fullName        String           @map("full_name")
  role            String
  shift           String
  department      Department       @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  services        Service[]
  roomAssignments RoomAssignment[]

  @@map("staff")
}

model Service {
  id                  String               @id @default(uuid()) @db.Uuid
  name                String
  category            String
  price               Decimal              @db.Decimal(10, 2)
  staffId             String               @map("staff_id") @db.Uuid
  staff               Staff                @relation(fields: [staffId], references: [id], onDelete: SetNull)
  reservationServices ReservationService[]

  @@map("service")
}

model ReservationService {
  id            String      @id @default(uuid()) @db.Uuid
  reservationId String      @map("reservation_id") @db.Uuid
  serviceId     String      @map("service_id") @db.Uuid
  quantity      String      
  subtotal      String      
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  service       Service     @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@map("reservation_service")
}

model RoomAssignment {
  id            String      @id @default(uuid()) @db.Uuid
  reservationId String      @map("reservation_id") @db.Uuid
  roomId        String      @map("room_id") @db.Uuid
  staffId       String      @map("staff_id") @db.Uuid
  taskType      String      @map("task_type")
  status        String
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  room          Room        @relation(fields: [roomId], references: [id], onDelete: Cascade)
  staff         Staff       @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@map("room_assignment")
}