# Functional Requirements Document (FRD)
### Travel SaaS — Direct-to-Agency Travel Booking Marketplace

**Version:** 1.0
**Companion to:** Travel SaaS Business Requirements Document (BRD)
**Stack:** Node.js · Express · MongoDB/Mongoose · React (Vite) · Redux Toolkit · JWT · Razorpay

---

## 1. Introduction

This document specifies *how* the system behaves to satisfy the business requirements in the BRD. Requirements are grouped by module and tagged with IDs (FR-x.y) so they can be traced and tested.

## 2. Actors & roles

| Role | Description | Tenant-bound? |
|------|-------------|---------------|
| **Guest** | Unauthenticated visitor | No |
| **END_USER** | Registered traveller who books trips | No (tenantId = null) |
| **HOST** | Approved travel agency that lists & sells packages | Yes (own tenantId) |
| **ADMIN** | Staff with a subset of admin permissions | Platform |
| **SUPER_ADMIN** | Full platform administrator | Platform |

Authentication uses a **JWT stored in an httpOnly cookie**; the client never reads the token directly. Role and (for hosts) `tenantId` are encoded on the user and enforced on every protected request.

---

## 3. Module: Public discovery (Guest)

- **FR-1.1** The home page SHALL load for unauthenticated users and SHALL fetch the public package catalogue from `GET /packages/public`.
- **FR-1.2** The system SHALL let a guest search packages by **title or destination** (client-side filter over the loaded catalogue).
- **FR-1.3** The system SHALL let a guest filter packages by **destination category** (e.g. beaches, mountains, desert, wildlife, city, snow).
- **FR-1.4** Each package card SHALL display: title, destination, trip duration (derived from start/end dates), starting date, per-person price, and live seat availability.
- **FR-1.5** When seats are low (≤ 5) the card SHALL show a "Filling fast" indicator; when zero it SHALL show "Sold out" and disable booking. *(Derived from real `seatsAvailable`.)*
- **FR-1.6** The home page SHALL expose a footer link **"Become a Host"** that routes to the agency application flow. *(Relocated here from the customer sidebar.)*

> **Note on ratings:** package cards currently show a presentational star rating derived deterministically on the client because the data model has no reviews field yet. Replacing this with a real reviews collection is a roadmap item (see BRD §11).

---

## 4. Module: Booking-triggered authentication

- **FR-2.1** When a **guest** taps "Book now", the system SHALL store the selected package reference and present a prompt to sign in or create an account (it SHALL NOT silently redirect).
- **FR-2.2** After successful authentication, the system SHALL **return the user to the same package** and resume the booking automatically.
- **FR-2.3** Registration SHALL follow a four-step flow: **(1)** submit details → **(2)** verify email **OTP** → **(3)** set password → **(4)** log in.
- **FR-2.4** The OTP SHALL be time-limited and validated server-side before a password can be set.
- **FR-2.5** If a non-END_USER (e.g. HOST/ADMIN) attempts to book, the system SHALL inform them that a traveller account is required and SHALL NOT create a booking.

---

## 5. Module: Booking & payment (END_USER)

- **FR-3.1** An authenticated END_USER SHALL select a seat quantity bounded by `1 ≤ seats ≤ seatsAvailable`, with a live running total.
- **FR-3.2** On confirmation, the system SHALL create a booking via `POST /bookings` with status **PENDING** and SHALL store a **price snapshot** (price captured at booking time, independent of later package edits).
- **FR-3.3** The booking SHALL be tagged with the customer's `userId`, the `packageId`, and the package's `tenantId`.
- **FR-3.4** From "My trips", the user SHALL initiate payment, which creates a Razorpay **order** on the server for the booking amount.
- **FR-3.5** After the Razorpay checkout returns, the server SHALL verify the payment by recomputing an **HMAC-SHA256** signature over `order_id|payment_id` using the secret key and comparing it to the signature returned by Razorpay.
- **FR-3.6** Verification SHALL be **idempotent** and SHALL re-check seat availability before committing.
- **FR-3.7** On successful verification the system SHALL mark the booking **CONFIRMED**, set payment status to **SUCCESS**, and **atomically deduct** the booked seats from the package.
- **FR-3.8** If verification fails or is abandoned, the booking SHALL remain **PENDING** and the user SHALL be able to retry payment.
- **FR-3.9** A user SHALL be able to **cancel** a PENDING or CONFIRMED booking; a paid cancellation SHALL move payment status to **REFUNDED** (refund simulated in the current phase).
- **FR-3.10** A user SHALL only ever see their **own** bookings.

---

## 6. Module: Agency onboarding (Guest/END_USER → HOST)

- **FR-4.1** A signed-in user SHALL submit a host application with agency name, business email, phone, and an optional description.
- **FR-4.2** Applications SHALL be queued for review with a status (e.g. PENDING).
- **FR-4.3** Approval SHALL run inside a **MongoDB transaction** that: locks the application (PENDING → PROCESSING), creates a **Tenant**, promotes the user to **HOST** with the new `tenantId`, and finalises the application as **APPROVED** — all-or-nothing.
- **FR-4.4** A rejected application SHALL leave the user's role unchanged.

---

## 7. Module: Package management (HOST)

- **FR-5.1** A HOST SHALL create, read, update, and delete packages **scoped to its own tenant** (`tenantId` filter applied on every query).
- **FR-5.2** A HOST SHALL NOT be able to view or modify another tenant's packages or bookings.
- **FR-5.3** Package creation/availability SHALL respect the agency's subscription limits (see §8).
- **FR-5.4** A package SHALL expose: title, description, destination, price, seatsAvailable, startDate, endDate.

---

## 8. Module: Subscriptions & limits (HOST)

- **FR-6.1** Each tenant SHALL have a subscription with a plan (**BASIC / PRO / PREMIUM**) defining `maxAgents` and `maxBookingsPerMonth`.
- **FR-6.2** Booking limits SHALL be evaluated against the **host tenant's** subscription, not the customer's account.
- **FR-6.3** A `maxBookingsPerMonth` of "unlimited" SHALL be represented explicitly so that no comparison treats an absent limit as zero. *(Guards against the `count >= null` class of bug.)*
- **FR-6.4** When a limit is reached, further bookings/packages for that tenant SHALL be blocked with a clear message.

---

## 9. Module: Administration (SUPER_ADMIN / ADMIN)

- **FR-7.1** A SUPER_ADMIN SHALL view and manage platform users.
- **FR-7.2** A SUPER_ADMIN SHALL review host applications and approve/reject them.
- **FR-7.3** A SUPER_ADMIN SHALL view tenants and their status (e.g. ACTIVE / SUSPENDED).
- **FR-7.4** ADMIN access SHALL be **permission-gated** (e.g. VIEW_USERS, VIEW_TENANTS, APPROVE_HOSTS); the UI SHALL only show actions the admin is permitted to perform.

---

## 10. Cross-cutting: access control & routing

- **FR-8.1** Protected routes SHALL enforce role membership; a logged-out user hitting a protected route SHALL be redirected to login, and a wrong-role user to an unauthorized handler.
- **FR-8.2** Customer pages (home, my trips, become-a-host) SHALL render in the **public site layout** (header + footer); host/admin pages SHALL render in the **dashboard layout** (sidebar).
- **FR-8.3** The legacy `/home` path SHALL redirect to `/`.

---

## 11. Data requirements (collections)

| Collection | Key fields |
|------------|-----------|
| **User** | name, email, password (hashed, never returned), role, tenantId, isVerified, permissions |
| **Tenant** | agency identity, status |
| **HostApplication** | applicant, agency details, status |
| **Subscription** | tenantId, plan, maxAgents, maxBookingsPerMonth, status |
| **Package** | tenantId, title, description, destination, price, seatsAvailable, startDate, endDate |
| **Booking** | userId, packageId, tenantId, seats, price (snapshot), status, razorpayOrderId, paymentStatus, isPaymentVerified |
| **OTP** | email, code, expiry |

Indexes exist on booking `tenantId`, `userId`, `status`, and `razorpayOrderId` to keep tenant-scoped and lookup queries fast.

---

## 12. Non-functional requirements

- **NFR-1 — Security.** Passwords hashed with bcrypt; JWT in httpOnly cookie; payment signatures verified server-side; secrets in environment variables only.
- **NFR-2 — Data isolation.** Every tenant-owned query filters by `tenantId`.
- **NFR-3 — Integrity.** Multi-step state changes (host approval, seat deduction on payment) use transactions/atomic updates.
- **NFR-4 — Responsiveness.** The customer site SHALL be usable on mobile and desktop widths.
- **NFR-5 — Resilience.** Email dispatch (OTP) SHALL NOT block the HTTP request/response cycle.
- **NFR-6 — Usability.** Discovery requires no login; the price shown equals the price charged.

---

## 13. Representative acceptance criteria

- A guest can open the site and book — being asked to sign up only at the booking step — and land back on the same trip after signing in. *(FR-2.1, FR-2.2)*
- A booking cannot reach CONFIRMED unless its Razorpay signature verifies on the server. *(FR-3.5, FR-3.7)*
- Host A cannot retrieve Host B's packages or bookings via any endpoint. *(FR-5.2, NFR-2)*
- Approving a host either fully promotes them (tenant + role + status) or changes nothing. *(FR-4.3)*

---
*End of FRD.*
