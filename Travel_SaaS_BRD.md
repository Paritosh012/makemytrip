# Business Requirements Document (BRD)
### Travel SaaS — Direct-to-Agency Travel Booking Marketplace

**Document owner:** Paritosh
**Version:** 1.0
**Status:** Baseline
**Related project:** Multi-tenant Travel SaaS (MERN)

---

## 1. Purpose of this document

This BRD describes *why* Travel SaaS exists and *what* the business needs it to do. It is written for stakeholders (product, engineering, and reviewers) and stays at the level of business outcomes rather than implementation detail. The matching technical behaviour is specified separately in the FRD.

## 2. Business background

Most Indian travellers book holiday packages through large aggregators. On those platforms the actual trip is usually run by a small local agency, but the customer never deals with that agency directly — they deal with layers of resellers. This adds cost, hides who is really accountable for the trip, and makes pricing opaque.

Travel SaaS is a marketplace that connects travellers **directly** with the agencies that run the trips. Each agency operates as an isolated tenant on a shared platform, lists its own packages, and manages its own bookings, while the customer gets a single, clean place to discover and book trips.

## 3. Vision statement

> Make holiday booking honest and direct — let travellers explore freely, book the trip they actually want in minutes, and deal with the real people running it.

## 4. Business objectives

| # | Objective | Why it matters |
|---|-----------|----------------|
| BO-1 | Let visitors browse the full catalogue with **no account required** | Lowers the barrier to entry; mirrors how real travel sites convert browsers into buyers |
| BO-2 | Require sign-up **only at the point of booking** | Captures the customer at the moment of intent, not before |
| BO-3 | Give each agency an **isolated, self-service workspace** | Agencies own their inventory and bookings without seeing each other's data |
| BO-4 | Make every payment **secure and verifiable** | Trust is the deciding factor in travel spend |
| BO-5 | Keep pricing **transparent** (one price, per person, no hidden fees) | Differentiates from fee-heavy aggregators |
| BO-6 | Monetise via **agency subscriptions** rather than customer markups | Keeps customer prices honest while still earning revenue |

## 5. Scope

### 5.1 In scope
- Public, browse-first home page with search and destination filtering.
- Customer account creation via email OTP and password.
- Package discovery and a guided booking + payment flow.
- Razorpay payment integration with server-side verification.
- Agency ("Host") onboarding through an application + approval process.
- Per-agency package and booking management.
- Subscription plans that cap each agency's usage.
- Platform administration (users, agencies, applications).

### 5.2 Out of scope (current phase)
- Customer-visible ratings and written reviews backed by real data *(currently presentational only — see roadmap)*.
- In-app messaging/chat between customer and agency.
- Dynamic or seasonal pricing, coupons, and promo codes.
- Flights, hotels, and cabs as separate verticals (packages only for now).
- Mobile native apps (the web app is responsive instead).

## 6. Stakeholders

| Stakeholder | Interest in the product |
|-------------|------------------------|
| Traveller (END_USER) | Discover trips easily, book and pay safely, manage bookings |
| Travel agency (HOST) | List packages, receive verified bookings, grow within a plan |
| Platform admin (SUPER_ADMIN) | Approve agencies, oversee users and tenants, keep the platform healthy |
| Platform owner / business | Earn subscription revenue, keep customers trusting the brand |

## 7. Key business requirements

- **BR-1 — Frictionless discovery.** A first-time visitor must be able to reach the home page and view real, bookable packages without signing in.
- **BR-2 — Intent-based registration.** The system must defer account creation until the visitor chooses to book, then return them to the exact trip afterwards.
- **BR-3 — Tenant isolation.** One agency must never be able to see or modify another agency's packages or bookings.
- **BR-4 — Verified payments only.** A booking may only be marked confirmed after the payment is cryptographically verified on the server.
- **BR-5 — Controlled onboarding.** New agencies must be reviewed and explicitly approved before they can sell.
- **BR-6 — Usage governed by plan.** An agency's ability to create packages/take bookings must respect the limits of its subscription.
- **BR-7 — Transparent pricing.** The price shown during discovery must be the price charged, with the per-person rate and total visible before payment.

## 8. Success metrics (illustrative targets)

| Metric | Indicates |
|--------|-----------|
| Browse-to-signup conversion | Whether the browse-first model is working |
| Signup-to-first-booking rate | Whether the booking flow is smooth |
| Payment success rate | Health of the payment integration |
| Booking confirmation rate (paid ÷ reserved) | How many reservations turn into real trips |
| Active agencies per plan tier | Subscription monetisation health |

## 9. Assumptions

- Agencies are willing to operate self-service and keep their own inventory current.
- Customers prefer dealing directly with the trip operator when price and trust are equal.
- Email is a sufficient identity channel for OTP at this stage (no SMS/social login yet).
- A shared-database multi-tenant model is acceptable for the expected scale.

## 10. Constraints

- Built on the MERN stack with MongoDB as the single shared datastore.
- Payments are processed exclusively through Razorpay.
- The current release targets web browsers (desktop + mobile web), not native apps.
- Hosting: API on Render, client on Vercel.

## 11. Roadmap (post-baseline)

1. Real ratings & reviews collection (replace the current presentational ratings).
2. Customer ↔ agency messaging.
3. Coupons, seasonal pricing, and wishlists.
4. Additional travel verticals (stays, transport).
5. Analytics dashboards for agencies.

---
*End of BRD.*
