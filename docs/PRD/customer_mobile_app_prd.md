# Product Requirements Document
# CCTV Customer Mobile App — React Native

**Version:** 1.2 *(Audit-corrected — all 17 findings resolved & synchronized with v2.0 Multi-Tenant Backend)*  
**Date:** August 2026  
**Author:** Antigravity AI  
**Project:** CCTV Monitoring Platform — Customer Mobile Client  

---

## 1. Executive Summary

The **Customer Mobile App** is a dedicated React Native application for end-customers of the CCTV Monitoring Platform. Customers are the end-users who own or are assigned cameras, hold subscriptions, and rely on the monitoring service for security. This app gives them a self-service mobile interface to:

- Watch their cameras live in real time via low-latency WebRTC (WHEP)
- Review recorded footage and timeline video chunks (continuous & motion)
- Share camera access securely with family members and household staff
- Trigger instantaneous SOS panic alerts in an emergency
- Manage their subscription and billing via Razorpay
- Report security incidents and track investigation progress
- Raise support tickets with the franchise/admin team
- Receive real-time push notifications and emergency status updates

The app communicates exclusively with the existing backend REST API (`/api/v1/`) and uses FCM for push notifications. Customers are authenticated with JWT (`role: "customer"`). The customer experience is fundamentally **consumer-grade** — the app should feel like a premium home security product, not an operations dashboard.

---

## 2. Problem Statement

Customers currently have no dedicated mobile interface to:
- Watch their home/office cameras on-the-go with low latency
- Be alerted instantly when something unusual happens (motion, perimeter breach)
- Trigger an emergency SOS from anywhere with one-tap native emergency dial-out
- Manage their subscription, renew plans, or pay invoices from a phone
- Share camera access with a family member quickly and safely
- Track security incidents or report problems directly to their assigned franchise

---

## 3. Goals & Success Metrics

| Goal | Metric |
|---|---|
| On-the-go camera access | Customer can open live view in < 5 seconds |
| Subscription self-service | Subscribe / cancel / renew without contacting support |
| Emergency responsiveness | SOS triggered in < 3 taps from any screen |
| Reduce support load | ≥ 60% of billing/subscription queries self-served in-app |
| Family sharing | Camera shared to family member in < 1 minute |
| Avatar & Profile customization | Instant avatar updates via Cloudinary CDN |

---

## 4. User Persona

**Primary User:** CCTV Monitoring Customer  
**Role in system:** `role: "customer"`  

- Owns one or more cameras (`camera.customerId === user._id`)
- May have cameras shared with them by another customer (`camera.sharedWith` includes their ID)
- Holds a `Subscription` (Basic / Premium / AI-Pro) — required to access live streams
- Has an optional emergency contact stored in `customerDetails.emergencyContact`
- Is assigned to a specific `Franchise` (`customerDetails.assignedFranchise`)

**What a customer CAN do (from the backend):**
- Self-register or log into their customer account
- View and stream cameras they own OR cameras shared with them
- Share cameras with other registered customers (by email)
- Trigger SOS alerts with GPS coordinates
- Report and view their own incidents and upload evidence media
- Subscribe to a plan, cancel, renew, create payment orders
- View invoices and payment history
- Create and comment on support tickets (auto-reopens closed tickets)
- Manage their profile, upload avatar images, and set notification preferences

**What a customer CANNOT do (backend enforces these):**
- Acknowledge or resolve SOS alerts (that's operators/admins only — `permit("alerts:resolve")`)
- Update incident status (customers cannot change status at all)
- View other customers' cameras, incidents, or SOS alerts
- Assign tickets or change ticket status (admin/franchise only)
- Assign or elevate administrative roles

---

## 5. Architecture & Technology Stack

### 5.1 Frontend (Mobile App)
| Concern | Choice |
|---|---|
| Framework | React Native (**bare workflow only** — same reasoning as Operator app; `react-native-webrtc` requires native linking) |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| State Management | Redux Toolkit + RTK Query |
| Realtime | Socket.IO Client (`socket.io-client` v4) |
| Video Streaming | WebRTC (`react-native-webrtc`) using WHEP protocol |
| Push Notifications | Firebase Cloud Messaging via `@react-native-firebase/messaging` |
| UI Library | React Native Paper + custom design system |
| Forms | React Hook Form + Zod |
| Secure Storage | `react-native-keychain` (JWT tokens) |
| Payments | Razorpay React Native SDK (`react-native-razorpay`) |
| Maps | `react-native-maps` (SOS location, camera locations) |
| Permissions | `react-native-permissions` (mic for SOS voice note, camera roll for uploads) |

### 5.2 Backend Integration

All API calls target the existing Node.js backend. Authentication uses:
- **Access Token** (short-lived JWT, 15m) — `Authorization: Bearer <token>` header
- **Refresh Token** (long-lived JWT, 30d) — stored in Keychain; Axios interceptor refreshes transparently on 401

**Customer-facing routes are mounted at:**
- `/api/v1/customer/...` — self-service panel (cameras, dashboard, subscription, profile, notifications)
- `/api/v1/users/profile/avatar` — profile avatar image upload (Cloudinary CDN)
- `/api/v1/sos/...` — SOS trigger and own history
- `/api/v1/incidents/...` — report and view own incidents
- `/api/v1/tickets/...` — support tickets
- `/api/v1/plans/...` — public plan listing (no auth needed)
- `/api/v1/subscriptions/...` — subscription management
- `/api/v1/payments/...` — payment orders and history
- `/api/v1/invoices/...` — invoice list and download
- `/api/v1/notifications/...` — notification centre and preferences
- `/api/v1/auth/...` — authentication and self-registration

> [!NOTE]
> The backend cleanly separates `/api/v1/customer` (singular) for customer self-service panel endpoints from `/api/v1/customers` (plural) which is strictly reserved for administrative tenant user management in `roleUserRoutes`. The mobile app exclusively uses `/api/v1/customer/...`.

### 5.3 Real-Time (Socket.IO)

> [!IMPORTANT]
> Customer accounts do **not** join operator-specific rooms. A customer's Socket.IO connection is for receiving **their own notifications** only.

The app establishes one persistent Socket.IO connection after login:
- Listens on the user's **private socket room** for `notification` events — emitted by the backend via `socketService.emitToUser(userId, "notification", ...)`. Listen with: `socket.on("notification", handler)`. **The event name is `"notification"` — NOT `"notification:<userId>"`.**
- Listens globally for `sos_acknowledged` — to update their own SOS status in real time
- Listens globally for `sos_resolved` — to update their own SOS status in real time
- Listens on the user's private socket room for `incident_updated` and `incident_closed` events

> [!NOTE]
> Customers do NOT receive `new_alert` events (those are camera-room events for operators), `shift_handover`, or any operator-specific events. The customer Socket.IO experience is notification-only.

### 5.4 Subscription Gate on Streaming

> [!CAUTION]
> **The backend enforces a subscription check on ALL streaming endpoints for customers.** (`stream.service.ts` lines 197–202):
> ```typescript
> if (user.role === "customer") {
>   const activeSub = await Subscription.findOne({ customerId: user.userId, status: "active" });
>   if (!activeSub) throw ApiError.forbidden("Active subscription required to view camera streams");
> }
> ```
> **Only `"active"` subscriptions pass** — `"past_due"` and `"canceled"` are rejected with 403. This is stricter than the dashboard (which shows `past_due` subscriptions). The app must check subscription status **before** attempting to open Live View:
> - `status === "active"` → proceed
> - `status === "past_due"` → show paywall with "Pay Now" CTA
> - Any other status → show paywall with "Subscribe" CTA

---

## 6. Authentication Module

### 6.1 Registration Screen (Customer Self-Registration)
**API:** `POST /api/v1/auth/register`  
**Fields:** Name, Email, Phone (10-digit Indian), Password (min 8 chars, 1 uppercase, 1 number), Role (`"customer"`)

**Behaviour:**
- Public self-registration allows creating standard customer accounts.
- On success: issues `accessToken` + `refreshToken` and auto-navigates into the Main Tab Navigator.
- Rate-limited (authLimiter) — handle 429 with countdown timer.

### 6.2 Login Screen
**API:** `POST /api/v1/auth/login`  
**Fields:** Email, Password (masked)

**Behaviour:**
- On success: store `accessToken` + `refreshToken` in Keychain; decode JWT to confirm `role === "customer"` — reject and show error if role mismatch
- On failure: display specific backend error (invalid credentials, account deactivated, franchise suspended)
- Rate-limited (authLimiter) — handle 429 with countdown timer

### 6.3 Forgot Password / OTP Reset Flow
1. `POST /api/v1/auth/forgot-password` — sends OTP to email
2. `POST /api/v1/auth/verify-otp` — verifies the 6-digit OTP
3. `POST /api/v1/auth/reset-password` — sets new password

### 6.4 Token Refresh (Transparent)
**API:** `POST /api/v1/auth/refresh-token`  
Axios interceptor handles 401s silently; if refresh fails → logout.

### 6.5 Change Password
**API:** `PUT /api/v1/auth/change-password`  
**Body:** `{ currentPassword, newPassword }`

### 6.6 Logout
**API:** `POST /api/v1/auth/logout`  
Clears Keychain, disconnects Socket.IO, resets Redux store.

---

## 7. App Structure & Navigation

```
App
├── Auth Stack (unauthenticated)
│   ├── LoginScreen
│   ├── SignUpScreen (Register)
│   ├── ForgotPasswordScreen
│   ├── OTPVerificationScreen
│   └── ResetPasswordScreen
│
└── Main Stack (authenticated, role=customer)
    ├── Bottom Tab Navigator  ← 4 permanent tabs
    │   ├── Tab: Home (Dashboard)
    │   ├── Tab: Cameras
    │   ├── Tab: Billing
    │   └── Tab: Profile
    │
    ├── Screen: Camera Detail
    ├── Screen: Live View (Full-screen WebRTC / WHEP)
    ├── Screen: Recording Playback
    ├── Screen: Share Camera
    ├── Screen: SOS History
    ├── Screen: SOS Detail
    ├── Screen: Incident List
    ├── Screen: Incident Detail
    ├── Screen: Report Incident
    ├── Screen: Plan Selection
    ├── Screen: Payment (Razorpay SDK)
    ├── Screen: Invoice List
    ├── Screen: Invoice Detail
    ├── Screen: Ticket List
    ├── Screen: Ticket Detail
    ├── Screen: Create Ticket
    ├── Screen: Notification Centre
    ├── Screen: Edit Profile (with Avatar Upload)
    ├── Screen: Change Password
    ├── Screen: Active Sessions
    └── Screen: Notification Preferences
```

> [!IMPORTANT]
> **URL Scheme:** Register `cctvcustomer` as the app URL scheme in `AndroidManifest.xml` and iOS `Info.plist`. Use `Linking.getInitialURL()` for terminated-state deep links. This is a **different scheme** from the Operator app (`operator://`) to allow both apps to coexist on the same device.

---

## 8. Feature Modules (Detailed)

---

### 8.1 Module 1 — Dashboard (Home Screen)

**API:** `GET /api/v1/customer/dashboard`

The dashboard returns a single unified payload:
```json
{
  "customer": { "name": "John Doe", "email": "john@example.com", "franchiseContact": { "name": "Downtown CCTV", "phone": "9876543210", "email": "contact@downtowncctv.com" } },
  "subscription": { "status": "active", "planName": "Premium", "startDate": "2026-08-01T00:00:00Z", "endDate": "2026-09-01T00:00:00Z" },
  "cameraStats": { "total": 4, "online": 3, "offline": 1, "maintenance": 0 },
  "cameras": [ ...lite camera objects ],
  "recentIncidents": [ ...last 5 incidents ],
  "activeSosAlerts": [ ...customer's own active/acknowledged SOS ]
}
```

**UI Components:**

#### Subscription Status Banner
- Shows plan name, status badge, and expiry date
- **Active:** Green pill with plan name (e.g., "Premium — expires Oct 2026")
- **Expired / canceled / none:** Red/amber pill with "Upgrade Now" CTA → navigates to Plan Selection
- **Past due:** Orange pill with "Pay Now" CTA → navigates directly to Payment screen

#### Camera Health Row (3 stat cards)
| Card | Colour | Data |
|---|---|---|
| Online | Green | `cameraStats.online` |
| Offline | Red | `cameraStats.offline` |
| Maintenance | Amber | `cameraStats.maintenance` |

Tapping any card navigates to Camera List filtered by that status.

#### Quick Access Camera Grid
- Horizontal scroll of camera cards (up to 4 visible)
- Each card: camera name, status dot, [Watch Live] button
- Tapping card → Camera Detail screen
- "View All" link → Camera List

#### Active SOS Banner
- Shown **only** when `activeSosAlerts.length > 0`
- Red pulsing banner: "⚠️ Your SOS is Active — tap to view status"
- Tapping navigates to SOS Detail

#### Recent Incidents Row
- Shows the 5 most recent incidents (from dashboard payload)
- Each item: type icon + severity + status badge + relative time
- "View All" → Incident List

**Refresh:** Pull-to-refresh.

---

### 8.2 Module 2 — Camera Management

#### 2a. Camera List Screen
**API:** `GET /api/v1/customer/cameras`

Returns all cameras where `customerId === user._id` OR `sharedWith` includes `user._id`.

**Camera Card:**
- Camera name + location (city, street)
- Status badge: online / offline / maintenance
- "Shared" badge if camera is not owned (comes from `sharedWith`)
- Action buttons: [Watch Live] [Recordings]
- Owner-only: [Share] [···] (manage menu)

**Filter:** All / Online / Offline / Mine / Shared With Me  
**Search:** Client-side by name or location

#### 2b. Camera Detail Screen
Tapping a camera opens the detail view:
- Camera name, serial number, full address
- Map pin (if `location.latitude` + `location.longitude` available)
- Status badge + last ping
- Health metrics: CPU, Memory, Temperature, Storage (`health.*`)
- Settings summary (recording enabled, motion detection, AI features)
- Action buttons: [Watch Live] [View Recordings] [Share Camera] (owner only)

#### 2c. Live View (Camera Stream)

> [!CAUTION]
> **Subscription gate:** Before initiating the stream, check `subscription.status === "active"`. If `past_due`, show a "Pay Now" paywall. Any other non-active status shows a "Subscribe" paywall. Do **not** rely on the 403 to catch this — check before opening the screen.

> [!IMPORTANT]
> **Use the customer panel endpoint, not the raw streams route:**
> The backend exposes a customer-specific wrapper at `GET /api/v1/customer/cameras/:id/live` (from `customer.routes.ts` lines 41–44, handled by `customerController.getLiveView`). Use this endpoint to start a live view session. It handles subscription validation and camera access in a customer-appropriate way.
> Avoid calling `GET /api/v1/streams/:cameraId/token` directly — that is the operator/admin stream route and requires the `streams:read` or similar permission which may not be granted to the `customer` role.

**API flow (in order):**
1. `GET /api/v1/customer/cameras/:id/live` → returns stream session info `{ sessionId, streamToken, pathName, webrtcUrl }`
2. `POST /api/v1/streams/:cameraId/webrtc/offer` → send SDP offer; returns `{ type: "answer", sdp, sessionUrl }`
3. Complete WebRTC handshake using the answer SDP in `react-native-webrtc`
4. `POST /api/v1/streams/stop` with `{ cameraId, sessionId }` on exit

**Implementation:**
- Full-screen landscape on stream start (auto-rotate)
- WHEP protocol for WebRTC consumption (read-only — customers do NOT have talkback)
- Stream token has 24h TTL; access token refresh handled separately by Axios interceptor

**Controls overlay (tap to show/hide):**
- 📸 Snapshot (save to camera roll)
- 🔊 Audio mute toggle
- ✕ Close (calls streams/stop)

**Error states:**
- 403 Forbidden → "A subscription is required" → paywall screen
- Camera offline → "Camera is currently offline"
- WebRTC failed → retry button

#### 2d. Recording Playback

> [!CAUTION]
> Same subscription gate as Live View. Only `"active"` subscription passes — `"past_due"` is rejected.

> [!IMPORTANT]
> **Use the customer panel endpoint, not the raw recordings route:**
> The backend exposes `GET /api/v1/customer/cameras/:id/playback` (from `customer.routes.ts` lines 48–52, handled by `customerController.getPlayback`). This is the customer-specific wrapper for recording playback.
> The raw routes (`/api/v1/recordings/:cameraId/playback` and `/api/v1/recordings/:cameraId/timeline`) use `permit("recordings:read")` — if the `customer` role does not have this permission assigned in the Role DB, those calls return 403. Always use the `/customer/...` wrapper.

**APIs:**
- `GET /api/v1/customer/cameras/:id/playback` — returns recording chunks for the given camera (supports both `?start=...&end=...` and `?startTime=...&endTime=...` query aliases)
- `GET /api/v1/recordings/:cameraId/timeline?date=YYYY-MM-DD` — hourly segments *(verify `recordings:read` permission exists for customer role before using directly)*

**Download (v1: owner-only):**
- `POST /api/v1/recordings/:id/download` — requires `recordings:download` permission

> [!WARNING]
> **Download permission:** The download endpoint uses `permit("recordings:download")` (a separate permission from `recordings:read`). Verify the `customer` role has this permission in the Role management system before implementing the Download button. If not granted, hide the Download button entirely rather than showing an error. In v1, download is shown only for cameras where `camera.customerId === user._id`; shared viewers see a note: "Download available to camera owner only."

**UI:**
- Calendar date picker
- 24-hour timeline bar with available segments highlighted
- Tap/drag to seek
- Video player for HLS/MP4
- Download button (owner only, subject to `recordings:download` permission)

---

### 8.3 Module 3 — Camera Sharing

> [!NOTE]
> **Sharing is owner-only.** Only the customer who owns the camera (`camera.customerId === user._id`) can share or revoke. The backend compares ObjectIds using `.toString()` equality, preventing duplicate sharing errors.

#### 3a. Share Camera
**API:** `POST /api/v1/customer/cameras/:id/share`  
**Body:** `{ email: string }` — email of the registered customer to share with

**Flow:**
1. Owner taps [Share Camera] on Camera Detail
2. Share screen appears with an email input + recent contacts (client-side from past shares)
3. On submit → API call
4. Backend finds a registered customer with that email, adds to `camera.sharedWith`, sends them a notification
5. Success toast: "Camera shared with [email]"

**Error states:**
- Email not found → "No registered customer found with this email"
- Self-share → "You cannot share with yourself"
- Already shared → "Camera is already shared with this user"

#### 3b. Revoke Camera Share
**API:** `DELETE /api/v1/customer/cameras/:id/share/:userId`

Shown in Camera Detail → "Shared With" list. Each entry has a [Revoke] button.
Confirmation dialog before calling the API.

#### 3c. Shared With Me Section
In the Camera List, cameras from `sharedWith` are shown with a "Shared" badge.
- Shared cameras are read-only (no share/revoke controls)
- Live view and recordings are available (subject to subscription of the **owner**, not the viewer)

> [!WARNING]
> **Subscription gate for shared cameras:** The stream service validates the **requesting user's** subscription, not the owner's. (`stream.service.ts` lines 197–202 — it checks `customerId: user.userId`). This means a shared viewer also needs their own active subscription to watch the stream. Make this clear in the UI: "Your subscription is required to view shared cameras."

---

### 8.4 Module 4 — SOS Emergency

> [!IMPORTANT]
> SOS is the most critical customer-facing feature. Triggering an SOS must be reachable from anywhere in the app in ≤ 2 taps. A persistent SOS button should be available on the Dashboard.

#### 4a. Trigger SOS
**API:** `POST /api/v1/sos`  
**Permission:** `sos:trigger` — granted to the `customer` role  
**Body:** `{ cameraId?: string, location?: string }`

**Flow:**
1. Customer taps the persistent 🆘 button (floating action button or dedicated button on Dashboard)
2. Full-screen confirmation modal:
   - 🆘 icon (pulsing red)
   - "Send Emergency Alert?"
   - Auto-populated location field (from device GPS if permission granted)
   - Optional camera picker (from their owned cameras)
   - [Cancel] and [SEND SOS] buttons
   - [SEND SOS] styled large and red with a 3-second press-and-hold to prevent accidental triggers
3. On confirm → API call → global Socket.IO `sos_triggered` event fires to all operators/admins
4. **Post-send emergency contact prompt:**
   - After SOS is sent successfully, show a full-screen success state with:
     - "✅ SOS Sent. Help is on the way."
     - If `customerDetails.emergencyContact` exists: show a prominent [Call [Contact Name]] button
     - Tapping it calls `Linking.openURL('tel:<emergencyContact.phone>')` — native dial-out, no backend involvement
     - [Skip] option to dismiss without calling
     - If no emergency contact configured: show "Tip: Add an emergency contact in Profile for faster help" and skip the prompt
5. Dashboard shows Active SOS Banner immediately after return

**Error states:**
- No network: "SOS requires internet. Try calling emergency services directly."

#### 4b. SOS History
**APIs:**
- `GET /api/v1/sos?` — paginated list filtered to `triggeredBy === user._id` (backend applies this for customer role)
- `GET /api/v1/sos/active` — for customer role, filtered to `triggeredBy === user._id` only

> [!IMPORTANT]
> From `sos.service.ts` lines 120–122: for customers, `filter.triggeredBy = user.userId`. Customers only see SOS events they triggered themselves. They cannot see SOS events from other customers.

Accessed from Profile → "My Emergency History" or from the Dashboard banner.

**SOS Card:**
- Status badge (active / acknowledged / resolved) with colour + animation
- Triggered at timestamp
- Location string (if provided)
- Linked camera (if any)
- Who acknowledged / resolved (name displayed after status change)

#### 4c. SOS Detail
**API:** `GET /api/v1/sos/:id`

Full detail view:
- Status timeline: Triggered → Acknowledged by [name] → Resolved by [name]
- Location string + map pin if `location` field has parseable coordinates
- Linked camera (tappable → Live View)
- Resolution notes (when resolved)
- Timeline / audit log: `GET /api/v1/sos/:id/timeline`

> [!NOTE]
> Customers can view the SOS timeline only for SOS events they triggered (`sos.service.ts` line 338). The backend enforces: `if (user.role === "customer" && sos.triggeredBy.toString() !== user.userId) throw 403`.

#### 4d. Real-Time SOS Status Updates
The customer's SOS status updates arrive via global Socket.IO events:
- `sos_acknowledged` → update badge on Dashboard SOS banner + SOS Detail screen
- `sos_resolved` → dismiss active SOS banner, show resolved status

---

### 8.5 Module 5 — Incident Reporting

> [!IMPORTANT]
> **Customer incident RBAC (from `incident.service.ts`):**
> - Customers can **create** incidents (reported incidents are scoped to their userId as `reportedBy`)
> - Customers can **view** only incidents they reported (`filter.reportedBy = user.userId`)
> - Customers **cannot** update incident status — `throw ApiError.forbidden("Customers cannot change incident status")`
> - Customers **can** add notes — but **the backend `addIncidentNote` function has no ownership check**. Any authenticated customer can add a note to any incident by ID. The mobile app must guard this: only show the [Add Note] button for incidents where `incident.reportedBy._id === user._id`.
> - Customers **can** upload media — same missing ownership check as notes. Apply the same client-side guard.
> - All incident endpoints require `incidents:read` / `incidents:write` permission. Verify the `customer` role has these permissions assigned in the Role DB.

#### 5a. Incident List Screen
**API:** `GET /api/v1/incidents` (backend auto-filters `reportedBy === user._id` for customers)

**Incident Card:**
- Type icon (🔒 theft / 🏚️ vandalism / 🔧 technical / 📄 other)
- Severity badge (low / medium / high / critical)
- Status badge (open / investigating / resolved / closed) — read-only
- Linked camera name (if any)
- Created timestamp (relative)

**Filter:** Status (All / Open / Investigating / Resolved / Closed)  
**Sort:** Newest first

#### 5b. Report New Incident
**API:** `POST /api/v1/incidents` (multipart/form-data, up to 5 attachments)

**Form fields:**
- Title (required)
- Description (required)
- Type: theft / vandalism / technical_issue / other (picker)
- Severity: low / medium / high / critical (picker)
- Camera: picker from their owned cameras (optional)
- Attachments: image/video picker (up to 5 files)

**Flow:** Form → Preview → Submit → "Incident #[id] Reported. Our team will review it."

#### 5c. Incident Detail Screen
**API:** `GET /api/v1/incidents/:id`

- Title, description, type, severity
- Status (read-only — customer cannot change)
- Linked camera (tappable)
- Attachments grid (thumbnails)
- Notes list (chronological, with author)
- **Timeline tab:** `GET /api/v1/incidents/:id/timeline` — chronological audit log of all status changes, notes added, and media uploads. Accessible to customers for incidents they reported.
- Composer: [Add Note] — shown **only** for incidents where `incident.reportedBy._id === user._id`

#### 5d. Add Note
**API:** `POST /api/v1/incidents/:id/notes`  
**Body:** `{ text: string }`

> [!WARNING]
> The backend `addIncidentNote` service has **no ownership check** for customers (confirmed in `incident.service.ts` lines 290–311 — `findById` only, no `reportedBy` guard). The mobile app must only render the [Add Note] composer when `incident.reportedBy._id === user._id`. Do not allow navigation to this endpoint by incident ID from external sources (e.g. push notifications) without verifying ownership first.

#### 5e. Upload Media
**API:** `POST /api/v1/incidents/:id/media` (up to 10 files)  
Image/video picker. Progress indicator.

> [!WARNING]
> Same missing ownership check as notes (`uploadIncidentMedia` in `incident.service.ts` lines 324–340 — no `reportedBy` guard). Only show the upload control for incidents the customer reported.

---

### 8.6 Module 6 — Subscription & Billing

This is a major differentiator for the customer app — fully self-serve subscription management.

#### 6a. Plan Selection Screen
**API:** `GET /api/v1/plans` *(no auth required — public endpoint)*

Returns all active plans sorted by price. Three plans exist in the system:
| Plan | Price/Month |
|---|---|
| Basic | ₹9.99 |
| Premium | ₹19.99 |
| AI-Pro | ₹39.99 |

**UI:**
- 3 plan cards with feature bullet lists
- "Current Plan" badge on active plan
- "Best Value" badge on Premium (hardcoded)
- [Select Plan] CTA → opens Duration Picker → Payment Flow

> [!NOTE]
> `GET /api/v1/plans` is public (no auth required per `billing.routes.ts` line 29). The app can display the plans page before login as a marketing screen.

#### 6b. Subscribe (Customer Panel Route vs Razorpay Flow)
**API:** `POST /api/v1/customer/subscribe`  
**Body:** `{ planName: string, durationMonths: number }`

> [!WARNING]
> There are **two separate subscription routes** in the backend:
> - `POST /api/v1/customer/subscribe` — uses `customer.service.ts`; only accepts `planName` + `durationMonths`; assumes instant payment success (sets invoice status to `"paid"` immediately)
> - `POST /api/v1/subscriptions` — uses `billing.service.ts`; accepts `planId`; sets invoice status to `"pending"` and is meant to be followed by a Razorpay payment flow
>
> **Which to use:** For a production-quality payment flow, use the **Razorpay flow** (`/subscriptions` → `/payments/create-order` → Razorpay SDK → `/payments/verify`). Use `/customer/subscribe` only as a fallback or for promotional/gifted subscriptions.

**Razorpay Payment Flow (recommended):**
1. `GET /api/v1/plans` → display plan picker
2. `POST /api/v1/subscriptions` `{ planId }` → creates subscription with `status: "pending"` invoice
3. `POST /api/v1/payments/create-order` `{ subscriptionId }` → returns `{ orderId, amount, currency }`
4. Open Razorpay SDK with `orderId` → user pays
5. `POST /api/v1/payments/verify` `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` → marks invoice as paid
6. Refresh subscription status → show success screen

**Error states for subscribe flow:**
- 400 `"Customer already has an active subscription"` → do not show the subscribe CTA if `subscription.status === "active"`. If this 400 is received anyway (stale state), redirect to Subscription Detail with message: "You already have an active subscription. Cancel it first before switching plans."

#### 6c. Current Subscription Screen
**API:** `GET /api/v1/customer/subscription`

Displays:
- Plan name + status badge
- Start date + expiry date
- Price paid
- Days remaining (progress bar)
- [Cancel Subscription] button (if active)
- [Renew] button (if past_due)

#### 6d. Cancel Subscription
**API:** `POST /api/v1/customer/cancel-subscription` *(use this — no subscriptionId needed)*

> [!NOTE]
> Backend keeps `endDate` intact after cancellation — customer retains access until the end of the billing period. Show this clearly: "Your access continues until [endDate]."

> [!IMPORTANT]
> There is also `PATCH /api/v1/subscriptions/:id/cancel` in the billing routes, but it requires knowing the `subscriptionId`. Use `POST /customer/cancel-subscription` for the mobile app — it automatically finds the customer's own active subscription. **Do not expose both routes** in the app.

Confirmation bottom sheet with explicit date shown. Red [Cancel Subscription] button.

#### 6e. Renew Subscription
**API:** `PATCH /api/v1/subscriptions/:id/renew`  
Extends `endDate` by the plan's `durationMonths`. Generates a new pending invoice. Follow with payment flow.

#### 6f. Invoice List
**APIs:**
- `GET /api/v1/customer/invoices` — customer panel alias
- `GET /api/v1/invoices` — direct billing route (same RBAC result for customers)

**Invoice Card:**
- Invoice date
- Amount + currency
- Status: paid (green) / pending (amber) / failed (red)
- Download button

#### 6g. Invoice Download
**API:** `GET /api/v1/invoices/:id/download`  
Opens PDF in in-app browser / shares to Files app.

#### 6h. Payment History
**API:** `GET /api/v1/customer/payments`  
Shows all Razorpay payment records:
- Order ID, payment ID, amount
- Status: created / paid / refunded
- Date

---

### 8.7 Module 7 — Support Tickets

> [!NOTE]
> **Customer ticket RBAC (from `ticket.service.ts`):**
> - Customers can **create** tickets
> - Customers see **only their own** tickets (`filter.createdBy = user.userId`)
> - Customers can **add comments** (adding a comment to a closed ticket auto-reopens it)
> - Customers **cannot** update status, assign, or close tickets (admin/franchise only)

#### 7a. Ticket List Screen
**API:** `GET /api/v1/tickets`

**Ticket Card:**
- Title + category
- Status badge (open / in-progress / resolved / closed)
- Priority badge (low / medium / high / critical)
- Last updated timestamp
- Unread reply indicator (blue dot)

**Filter:** Status (All / Open / In-Progress / Resolved)

#### 7b. Create Ticket
**API:** `POST /api/v1/tickets`  
**Body:** `{ title, description, category, priority }`

**Form fields:**
- Subject (required)
- Category: technical / billing / general / other (picker)
- Priority: low / medium / high / critical (picker)
- Description (required, multiline)

**On submit:** Success screen with ticket ID + "We'll respond within 24 hours"

#### 7c. Ticket Detail Screen
**API:** `GET /api/v1/tickets/:id`

- Ticket title, status, priority
- Full description
- Thread view: chronological comments by customer + admin/franchise responses
- Each comment: avatar + author role + timestamp + text

**Comment composer:**
- Text input + [Send] button at bottom
- Adding a comment to a `closed` ticket automatically re-opens it (backend behaviour from `ticket.service.ts` lines 191–193). Show a banner: "Replying will reopen this ticket."

---

### 8.8 Module 8 — Notifications

#### 8a. Notification Centre
**APIs:**
- `GET /api/v1/notifications` — paginated list
- `PATCH /api/v1/notifications/:id/read` — mark single as read
- `PATCH /api/v1/notifications/read-all` — mark all read
- `DELETE /api/v1/notifications/:id` — delete

**Notification Types:**
| Type | Icon | Example |
|---|---|---|
| `alert` | 🔔 | "Motion detected on Camera 3" |
| `system` | ⚙️ | "Subscription confirmed — Welcome to Premium" |
| `message` | 💬 | "Camera shared with you by [email]" |

> [!NOTE]
> The `message` type exists in the `NotificationType` enum but has no separate preference toggle — it falls under the `system` preference category in `INotificationPreference`. Do not expose a separate message preference row.

**UI:** Blue dot for unread; swipe left → delete; swipe right → mark read.

#### 8b. FCM Device Registration
**API:** `POST /api/v1/notifications/register-device`  
**Body:** `{ token: string, platform: "android" | "ios" }`  
Called on login and whenever the FCM token refreshes.

#### 8c. Notification Preferences
**API:** `GET/PUT /api/v1/notifications/preferences`

| Category | Push | In-App | Email |
|---|---|---|---|
| Alerts | ✓ | ✓ | ✓ |
| System | ✓ | ✓ | ✓ |

> [!IMPORTANT]
> Both categories have **three toggles each** (Push, In-App, Email). Render all three per row. This matches the `INotificationPreference` schema exactly: `{ alerts: { push, inApp, email }, system: { push, inApp, email } }`.

---

### 8.9 Module 9 — Profile & Settings

**APIs:**
- `GET /api/v1/customer/profile` — returns full user document
- `PUT /api/v1/customer/profile` — update profile fields
- `PUT /api/v1/users/profile/avatar` — upload avatar image (Cloudinary CDN)

**Displays:**
- Name, email, phone
- Role badge ("Customer")
- Assigned franchise contact (`customer.franchiseContact` from dashboard payload — populated name + phone + email)
- Emergency contact: name, phone, relation (`customerDetails.emergencyContact`)
- Avatar image (Cloudinary URL or local fallback)

> [!NOTE]
> Unlike the operator's `/auth/me` which returns only ObjectId for franchiseId, the **customer dashboard** (`GET /api/v1/customer/dashboard`) populates `franchiseContact` with `name email phone` automatically (from `customer.service.ts` line 182: `.populate("customerDetails.assignedFranchise", "name email phone")`). Use the dashboard payload to display franchise contact info — no second API call needed.

**Editable profile fields (via `PUT /api/v1/customer/profile`):**
- Name
- Phone
- Emergency contact (name, phone, relation)
- Address

#### Avatar Upload Flow:
- Uses `PUT /api/v1/users/profile/avatar` with `multipart/form-data` (file field: `avatar`).
- Backed by Cloudinary with automatic 300x300 thumbnail transformation, with automatic local `/uploads` fallback if CDN is not configured.

**Settings sections:**
1. **Notifications** → Preferences screen
2. **Security** → Change Password (`PUT /api/v1/auth/change-password`), Active Sessions
   - `GET /api/v1/auth/sessions` — list all active sessions (device, IP, last active)
   - `DELETE /api/v1/auth/sessions/:id` — revoke a specific session
   > [!WARNING]
   > If the customer revokes the **current device's session**, the next API call will return 401. The Axios interceptor's refresh attempt will also fail (the session is invalidated). The app must detect this, clear local tokens from Keychain, and navigate to the Login screen. Show a warning on the current device's session entry: "Revoking this session will log you out on this device."
3. **My Incidents** → Incident list
4. **My SOS History** → SOS history list
5. **Support Tickets** → Ticket list
6. **About** → App version, Terms, Privacy Policy
7. **Logout**

---

## 9. Real-Time Events (Socket.IO)

| Event Name | Emission Scope | Trigger | Customer App Action |
|---|---|---|---|
| `notification` | User's private socket room (via `emitToUser`) | Any notification sent to this customer | Add to Notification Centre; show in-app toast. Listen: `socket.on("notification", handler)` |
| `sos_acknowledged` | GLOBAL | Operator acknowledges any SOS | Update SOS status on Dashboard banner + SOS Detail (check `sosAlert.triggeredBy === user._id` before acting) |
| `sos_resolved` | GLOBAL | Operator resolves any SOS | Dismiss active SOS banner; show resolved status + resolution notes (check `triggeredBy` first) |
| `incident_updated` | User's private socket room | Operator updates status on customer's incident | Update status badge on Incident List + Incident Detail |
| `incident_closed` | User's private socket room | Operator closes customer's incident | Show "Resolved" banner on Incident Detail; update list |

> [!CAUTION]
> Customers do **NOT** receive `new_alert`, `shift_handover`, `talkback_started/stopped`, or `stream_started/stopped`.

> [!IMPORTANT]
> The `notification` event is **NOT** named `notification:<userId>`. The backend uses `socketService.emitToUser(userId, "notification", data)` which routes the event to the user's private socket room. The event name is simply `"notification"`. The user-scoping is done at the transport layer, not in the event name.

**Rooms the Customer App Joins:** None. Customers do NOT join franchise rooms or camera rooms. All events are delivered to a user-private socket room managed by the backend.

---

## 10. Push Notifications (FCM)

### URL Scheme Registration

**App URL scheme:** `cctvcustomer` (different from operator app's `operator://`)

| Platform | Configuration |
|---|---|
| Android | `AndroidManifest.xml` — `<data android:scheme="cctvcustomer" />` |
| iOS | `Info.plist` — add `cctvcustomer` to `CFBundleURLSchemes` |

Use React Native `Linking` module:
- **Foregrounded:** `Linking.addEventListener('url', handler)`
- **Terminated:** `Linking.getInitialURL()` before navigation renders

### Notification Types & Deep Links

| Trigger | Title | Body | Deep Link |
|---|---|---|---|
| Subscription confirmed | "✅ Welcome to [Plan]!" | "Your [plan] subscription is active." | `cctvcustomer://billing/subscription` |
| Subscription canceled | "📋 Subscription Canceled" | "Your access continues until [date]." | `cctvcustomer://billing/subscription` |
| Camera shared with you | "📷 Camera Shared" | "[email] shared a camera with you." | `cctvcustomer://cameras` |
| SOS acknowledged | "🆘 SOS Acknowledged" | "An operator has acknowledged your SOS." | `cctvcustomer://sos/:sosId` |
| SOS resolved | "✅ SOS Resolved" | "Your emergency has been resolved. [notes]" | `cctvcustomer://sos/:sosId` |
| **Incident status changed** | **"📋 Incident Update"** | **"Your incident '[title]' is now: [status]"** | **`cctvcustomer://incidents/:incidentId`** |
| Ticket status update | "🎫 Ticket Updated" | "Your ticket '[title]' status is now: [status]" | `cctvcustomer://tickets/:ticketId` |
| New ticket comment | "💬 New Reply" | "Support replied to '[title]'" | `cctvcustomer://tickets/:ticketId` |

---

## 11. Offline Behaviour

| Scenario | Behaviour |
|---|---|
| No network on launch | Show cached dashboard from Redux Persist; "Offline" banner |
| No network during SOS trigger | Show alert: "Cannot send SOS. Connect to internet or call emergency services." Block the action. |
| No network during streaming | Show "No connection" overlay on stream screen |
| No network during payment | Show error: "Payment requires an active internet connection." Block Razorpay SDK open. |
| Alert list offline | Show cached list with "Last updated X ago" |
| Ticket list offline | Show cached list |

---

## 12. Security Requirements

| Requirement | Implementation |
|---|---|
| Secure token storage | `react-native-keychain` |
| Payment data | Never stored locally; Razorpay SDK handles card data |
| Certificate pinning | Implement for production |
| Screen recording prevention | `react-native-prevent-screenshot` on Live View and Recording Playback screens |
| Auto-logout | After 30 minutes of inactivity |
| No sensitive data in logs | Strip tokens, payment IDs from console output in production |

---

## 13. Performance Requirements

| Metric | Target |
|---|---|
| App cold start | < 2.5 seconds |
| Dashboard load | < 1 second (P95) |
| Live stream start | < 5 seconds (WebRTC connection from token request to first frame) |
| Push notification delivery | < 5 seconds from event creation |
| Memory during streaming | < 200MB |

---

## 14. Error Handling Strategy

| Error Type | Treatment |
|---|---|
| 401 Unauthorized | Silent token refresh → retry; if refresh fails → force logout |
| 403 Forbidden on stream | Show subscription paywall / upgrade screen |
| 403 Forbidden (other) | "You don't have permission to do this" |
| 404 Not Found | "Item not found" with back navigation |
| 429 Rate Limited | "Too many requests. Try again in Xs" countdown |
| 500 Server Error | "Something went wrong. Please try again." |
| Razorpay payment failure | Show Razorpay's built-in error UI; allow retry |
| WebRTC failed | "Stream unavailable. Retry?" with reconnect button |

---

## 15. Screen Inventory

| # | Screen Name | Route Key | Module |
|---|---|---|---|
| 1 | Login | `Login` | Auth |
| 2 | Sign Up (Register) | `SignUp` | Auth |
| 3 | Forgot Password | `ForgotPassword` | Auth |
| 4 | OTP Verification | `OTPVerification` | Auth |
| 5 | Reset Password | `ResetPassword` | Auth |
| 6 | Dashboard | `Dashboard` | Home |
| 7 | Camera List | `CameraList` | Cameras |
| 8 | Camera Detail | `CameraDetail` | Cameras |
| 9 | Live View | `LiveView` | Cameras |
| 10 | Recording Playback | `RecordingPlayback` | Cameras |
| 11 | Share Camera | `ShareCamera` | Cameras |
| 12 | SOS Trigger (modal) | `SOSTrigger` | SOS |
| 13 | SOS History | `SOSHistory` | SOS |
| 14 | SOS Detail | `SOSDetail` | SOS |
| 15 | Incident List | `IncidentList` | Incidents |
| 16 | Incident Detail | `IncidentDetail` | Incidents |
| 17 | Report Incident | `ReportIncident` | Incidents |
| 18 | Plan Selection | `PlanSelection` | Billing |
| 19 | Payment (Razorpay) | `Payment` | Billing |
| 20 | Subscription Detail | `SubscriptionDetail` | Billing |
| 21 | Invoice List | `InvoiceList` | Billing |
| 22 | Invoice Detail | `InvoiceDetail` | Billing |
| 23 | Payment History | `PaymentHistory` | Billing |
| 24 | Ticket List | `TicketList` | Support |
| 25 | Ticket Detail | `TicketDetail` | Support |
| 26 | Create Ticket | `CreateTicket` | Support |
| 27 | Notification Centre | `Notifications` | Notifications |
| 28 | Profile | `Profile` | Profile |
| 29 | Edit Profile (with Avatar) | `EditProfile` | Profile |
| 30 | Change Password | `ChangePassword` | Profile |
| 31 | Active Sessions | `Sessions` | Profile |
| 32 | Notification Preferences | `NotifPreferences` | Profile |

---

## 16. Complete API Endpoint Reference

| Method | Endpoint | Screen(s) | Notes |
|---|---|---|---|
| POST | `/auth/register` | SignUp | Customer self-registration |
| POST | `/auth/login` | Login | Role verification for "customer" |
| POST | `/auth/forgot-password` | ForgotPassword | OTP dispatch to email |
| POST | `/auth/verify-otp` | OTPVerification | 6-digit OTP verification |
| POST | `/auth/reset-password` | ResetPassword | Set new password |
| POST | `/auth/refresh-token` | (Axios interceptor) | Transparent token rotation |
| POST | `/auth/logout` | Profile | Session revocation |
| PUT | `/auth/change-password` | ChangePassword | Password change |
| GET | `/auth/sessions` | Sessions | List active sessions |
| DELETE | `/auth/sessions/:id` | Sessions | Specific session revoke |
| GET | `/customer/dashboard` | Dashboard | Franchises populated |
| GET | `/customer/cameras` | CameraList | Owned + shared cameras |
| GET | `/customer/cameras/:id/live` | LiveView | Customer wrapper; returns stream token & WebRTC URL |
| GET | `/customer/cameras/:id/playback` | RecordingPlayback | Supports `?start=...&end=...` and `?startTime=...&endTime=...` |
| POST | `/customer/cameras/:id/share` | ShareCamera | Owner only |
| DELETE | `/customer/cameras/:id/share/:userId` | ShareCamera | Owner only |
| GET | `/customer/subscription` | SubscriptionDetail | Active plan details |
| POST | `/customer/subscribe` | Payment | Simple flow only |
| POST | `/customer/cancel-subscription` | SubscriptionDetail | Single cancel endpoint for mobile app |
| GET | `/customer/invoices` | InvoiceList | Billing invoices |
| GET | `/customer/payments` | PaymentHistory | Transaction history |
| GET | `/customer/notifications` | Notifications | Notification history |
| GET | `/customer/reports` | IncidentList | Alias for /incidents |
| GET | `/customer/profile` | Profile | Customer profile data |
| PUT | `/customer/profile` | EditProfile | Update profile fields |
| PUT | `/users/profile/avatar` | EditProfile | Multipart avatar upload (Cloudinary) |
| GET | `/plans` | PlanSelection | Public plan list |
| POST | `/subscriptions` | Payment | Razorpay flow creation |
| PATCH | `/subscriptions/:id/renew` | SubscriptionDetail | Subscription renewal |
| POST | `/payments/create-order` | Payment | Razorpay order generation |
| POST | `/payments/verify` | Payment | Razorpay signature verification |
| GET | `/invoices` | InvoiceList | Invoices list |
| GET | `/invoices/:id` | InvoiceDetail | Invoice metadata |
| GET | `/invoices/:id/download` | InvoiceDetail | PDF download |
| POST | `/streams/:cameraId/webrtc/offer` | LiveView | SDP offer relay to MediaMTX |
| POST | `/streams/stop` | LiveView | Stream termination |
| POST | `/sos` | SOSTrigger | Panic trigger with GPS |
| GET | `/sos` | SOSHistory | Auto-filtered to own alerts |
| GET | `/sos/active` | Dashboard | Auto-filtered to own active SOS |
| GET | `/sos/:id` | SOSDetail | SOS details |
| GET | `/sos/:id/timeline` | SOSDetail | Own SOS timeline |
| GET | `/incidents` | IncidentList | Auto-filtered to own |
| POST | `/incidents` | ReportIncident | Multipart incident report |
| GET | `/incidents/:id` | IncidentDetail | Incident details |
| POST | `/incidents/:id/notes` | IncidentDetail | Guard: own incidents only |
| POST | `/incidents/:id/media` | IncidentDetail | Guard: own incidents only |
| GET | `/incidents/:id/timeline` | IncidentDetail | Incident audit trail |
| GET | `/tickets` | TicketList | Auto-filtered to own |
| POST | `/tickets` | CreateTicket | Create support ticket |
| GET | `/tickets/:id` | TicketDetail | Ticket thread |
| POST | `/tickets/:id/comments` | TicketDetail | Auto-reopens closed ticket |
| GET | `/notifications` | Notifications | List notifications |
| PATCH | `/notifications/:id/read` | Notifications | Mark single read |
| PATCH | `/notifications/read-all` | Notifications | Mark all read |
| DELETE | `/notifications/:id` | Notifications | Delete notification |
| POST | `/notifications/register-device` | (on login) | Register FCM token |
| GET | `/notifications/preferences` | NotifPreferences | Preference settings |
| PUT | `/notifications/preferences` | NotifPreferences | Update preferences |

---

## 17. Key Differences vs Operator App

| Aspect | Operator App | Customer App |
|---|---|---|
| Primary purpose | Monitor & respond to events | Watch cameras & manage account |
| Talkback | ✅ Yes | ❌ No |
| SOS trigger | ❌ No (receives alerts) | ✅ Yes (triggers alerts) |
| SOS acknowledge/resolve | ✅ Yes | ❌ No |
| Incident status updates | ✅ Yes (if assigned) | ❌ No |
| Shift management | ✅ Clock in/out | ❌ Not applicable |
| Camera sharing | ❌ No | ✅ Yes (own cameras) |
| Subscription/billing | ❌ Not needed | ✅ Full billing module |
| Support tickets | ❌ No | ✅ Yes |
| Payment flow | ❌ No | ✅ Razorpay integration |
| Socket.IO rooms | Franchise + Camera rooms | No rooms (global events only) |
| Streaming | Operator can stream (assignment-gated) | Customer can stream (subscription-gated) |

---

## 18. Decisions Log ✅

| # | Question | Decision | Rationale / Detail |
|---|---|---|---|
| 1 | **Registration in-app?** | ✅ **Yes — customer self-registration enabled** | Enabled via `POST /api/v1/auth/register` with `role: "customer"`. Administrative and staff accounts remain protected via backend provisioning. |
| 2 | **Payment currency?** | ✅ **INR via Razorpay — confirmed for production** | Backend hardcodes `"INR"` and `provider: "razorpay"`. Use the Razorpay React Native SDK (`react-native-razorpay`). |
| 3 | **Camera map tab?** | ✅ **List-only view in v1** | No map tab in v1. Camera Detail screen still shows a single map pin if `location.latitude` + `location.longitude` are present. Full map overview deferred to v2. |
| 4 | **SOS hold-to-confirm duration?** | ✅ **3 seconds press-and-hold** | Prevents accidental SOS triggers. Use a circular progress animation around the SOS button during the 3-second hold. Releasing before 3s cancels the trigger. |
| 5 | **Shared camera download access?** | ✅ **Download deferred to v2 — owner-only in v1** | In v1, the Download button on RecordingPlayback is shown **only** if `camera.customerId === user._id`. Shared viewers see recordings (subject to their subscription) but have no download button. Note in UI: "Download available to camera owner only." |
| 6 | **Minimum OS versions?** | ✅ **Android 10+ (API 29) / iOS 15+** | Same as Operator app. Consistent baseline across both apps. |
| 7 | **Profile Avatar Upload?** | ✅ **Yes — via Cloudinary CDN (`PUT /users/profile/avatar`)** | Implemented with 300x300 thumbnail transformation and local disk fallback. |
| 8 | **Emergency contact auto-dial on SOS?** | ✅ **Yes — included in SOS trigger flow** | After the SOS is sent successfully, show a prompt: "Also call your emergency contact [name]?" with a [Call Now] button that uses `Linking.openURL('tel:<phone>')`. This is a native dial-out — no backend involvement. The contact info comes from `customerDetails.emergencyContact` (available in the profile). If no emergency contact is configured, this prompt is skipped silently. |

---

## 19. Architecture Next Steps

With all decisions locked, the recommended next steps before writing code:

1. **Project initialisation** — `npx react-native init CustomerApp --template react-native-template-typescript`
2. **Folder structure** — feature-based: `/features/cameras`, `/features/billing`, `/features/sos`, `/features/tickets`, etc.
3. **API client** — Axios instance with JWT interceptor + refresh logic (shared with Operator app if mono-repo)
4. **Subscription gate hook** — a `useSubscriptionGuard()` hook to check `subscription.status === 'active'` before entering Live View or Recording Playback
5. **Razorpay SDK setup** — install `react-native-razorpay`, configure with Razorpay test keys, build the 3-step payment flow (create-order → SDK → verify)
6. **Socket.IO client singleton** — listen for `notification` (user room), `sos_acknowledged`, `sos_resolved` (global), `incident_updated`, and `incident_closed`
7. **FCM setup** — `@react-native-firebase/messaging` + device token registration on login
8. **Deep link scheme** — register `cctvcustomer://` in both Android and iOS manifests
9. **Navigation scaffold** — Auth Stack (Login, SignUp, OTP) + Main Tab Navigator (4 tabs) shells
10. **SOS hold gesture** — implement 3-second press-and-hold using `react-native-gesture-handler` `LongPressGestureHandler` with circular progress animation

---

*End of PRD v1.2 — Decisions Locked & Audit-Approved*
