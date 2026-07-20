# Resort Room Booking and Management System: Application Flows

This document details the central operational flows of the application using structured sequence maps and logic paths.

---

## 1. Guest Booking Flow

The booking flow handles availability checks, pricing calculation, add-on service selections, and reservation persistence.

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest
    participant Client as Booking Client
    participant API as Booking API
    participant DB as Database

    Guest->>Client: Input Dates and Room Type
    Client->>API: POST Reservation Request
    activate API
    API->>DB: Query rooms and check conflicts
    
    alt Overbooked or Conflicting Dates
        API-->>Client: 409 Conflict (Occupied)
        Client-->>Guest: Show conflict message
    else Room is available
        API->>API: Compute base price and services
        API->>DB: Save PENDING Reservation
        API-->>Client: 201 Created (ID returned)
        deactivate API
        Client->>Guest: Redirect to Checkout Page
    end
```

---

## 2. Checkout & Simulated Payment Flow

Payments are simulated through a checkout invoice page that fires a mock transaction request to the webhook callback.

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest
    participant Page as Checkout Page
    participant API as Webhook API
    participant DB as Database

    Guest->>Page: Clicks Pay Now
    Page->>API: POST Webhook Request
    activate API
    API->>DB: Confirm Reservation and Log Payment
    API->>API: Send Receipt Email
    API-->>Page: 200 OK (Payment Confirmed)
    deactivate API
    Page->>Guest: Redirect to Dashboard
```

---

## 3. Admin & Housekeeping Task Management Flow

Rooms are cleaned and maintained through a live operations panel. Admins assign tasks, and staff members execute and mark them as complete.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Staff
    actor Staff as Housekeeping Staff
    participant Dash as Admin Dashboard
    participant API as Housekeeping API
    participant DB as Database

    Admin->>Dash: Assigns turnover task to Staff
    Dash->>API: POST Assign Task
    activate API
    API->>DB: Save RoomAssignment and set Room to DIRTY
    API-->>Dash: 200 OK (Task Assigned)
    deactivate API
    
    Staff->>Dash: Clicks Complete Task
    Dash->>API: PUT Complete Task
    activate API
    API->>DB: Set status to COMPLETED and Room to AVAILABLE
    API-->>Dash: 200 OK (Room Released)
    deactivate API
    Dash-->>Staff: Live updates (Room is AVAILABLE)
```

---

## 4. Next-Auth Session Propagation Flow

Authentication is managed via Next-Auth JSON Web Tokens (JWT) to secure layouts and propagate roles.

```mermaid
graph TD
    A[Login Page] --> B[Next-Auth API Route]
    B --> C{Check Role Type}
    C -->|STAFF| D[Verify Staff Credentials]
    C -->|GUEST| E[Verify Guest Credentials]
    D --> F[Generate Staff JWT with Role and Dept]
    E --> G[Generate Guest JWT]
    F --> H[Store JWT in Cookie]
    G --> H
    H --> I[Middleware Route Protection]
    I -->|Valid Session| J[Allow Access to Dashboard]
    I -->|No Session| K[Redirect to Login]
```
