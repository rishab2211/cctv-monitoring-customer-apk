# Implementation Plan
# CCTV Customer Mobile App — React Native (Bare Workflow)

> **PRD Version:** 1.2 (Decisions Locked & Audit-Approved)
> **Backend:** Node.js REST API at `http://localhost:5000/api/v1`
> **Min OS:** Android 10+ (API 29) / iOS 15+

---

## Overview

5-phase plan progressing from project foundation → auth → cameras/streaming → SOS → billing/incidents/tickets → notifications/profile/polish. Each phase ends with an independently testable build.

---

## Phase 0 — Project Bootstrap & Foundation

**Goal:** Runnable skeleton with all native dependencies linked, core infrastructure in place, navigation scaffold.

---

### 0.1 Project Initialization

```bash
npx react-native init CustomerApp --template react-native-template-typescript
```

**Feature-based folder structure:**

```
src/
├── api/               ← Axios instance + RTK Query base
├── app/               ← Redux store + root config
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── cameras/
│   ├── sos/
│   ├── incidents/
│   ├── billing/
│   ├── tickets/
│   ├── notifications/
│   └── profile/
├── navigation/        ← Auth Stack, Main Tab Navigator
├── hooks/             ← useSubscriptionGuard, useFCMToken, useSocket
├── components/        ← Shared UI components
├── utils/             ← Error parsers, date utils, formatters
└── constants/         ← API base URL, colors, routes
```

### 0.2 Native Dependencies

| Package | Purpose | Notes |
|---|---|---|
| `react-native-webrtc` | WebRTC/WHEP live streaming | Native linking required |
| `@react-native-firebase/app` | Firebase core | Google Services JSON/plist |
| `@react-native-firebase/messaging` | FCM push notifications | — |
| `react-native-keychain` | Secure JWT storage | — |
| `react-native-razorpay` | Payment SDK | Razorpay test keys needed |
| `react-native-maps` | Camera location pin | Google Maps API key |
| `react-native-permissions` | Camera roll, mic, GPS | — |
| `react-native-gesture-handler` | SOS hold gesture | GestureHandlerRootView |
| `react-native-reanimated` | Animations | Babel plugin required |
| `socket.io-client` | Real-time | v4 |
| `@reduxjs/toolkit` + `react-redux` | State management | — |
| `redux-persist` | Offline cache | AsyncStorage adapter |
| `react-hook-form` + `zod` | Form validation | — |
| `react-native-paper` | Base UI | — |
| `react-native-prevent-screenshot` | Stream screen protection | — |
| `react-native-video` | HLS/MP4 playback | — |
| `react-native-blob-util` | PDF invoice download | — |
| `@react-native-community/netinfo` | Offline detection | — |

### 0.3 Platform Configuration

**Android `AndroidManifest.xml`:**
```xml
<data android:scheme="cctvcustomer" />
<!-- Permissions: INTERNET, ACCESS_FINE_LOCATION, CAMERA, READ_EXTERNAL_STORAGE, RECORD_AUDIO -->
```

**iOS `Info.plist`:**
```xml
<key>CFBundleURLSchemes</key>
<array><string>cctvcustomer</string></array>
<!-- NSLocationWhenInUseUsageDescription, NSCameraUsageDescription, NSMicrophoneUsageDescription -->
```

### 0.4 Core Infrastructure

#### [NEW] `src/api/axiosInstance.ts`
- Base URL: `http://localhost:5000/api/v1`
- JWT Bearer header injection from Keychain
- Axios response interceptor:
  - On 401 → `POST /auth/refresh-token` with stored refresh token
  - On success → update Keychain + retry original request
  - On refresh failure → clear Keychain → dispatch `logout` → navigate to Login
  - On 429 → parse retry-after, surface countdown to UI

#### [NEW] `src/api/rtk-query/baseApi.ts`
- RTK Query `createApi` with Axios base query
- Tag types: `Auth`, `Dashboard`, `Cameras`, `SOS`, `Incidents`, `Billing`, `Tickets`, `Notifications`, `Profile`

#### [NEW] `src/app/store.ts`
- Redux store with `redux-persist` (AsyncStorage) for offline cache
- Slices: `authSlice` (tokens, user identity, role), `uiSlice` (loading/error states)

#### [NEW] `src/hooks/useSocket.ts`
- Singleton Socket.IO client connecting after login, disconnecting on logout
- Listens: `notification`, `sos_acknowledged`, `sos_resolved`, `incident_updated`, `incident_closed`

#### [NEW] `src/hooks/useSubscriptionGuard.ts`
- Reads `subscription.status` from Redux/RTK Query cache
- Returns `{ canStream: boolean, paywallType: "upgrade" | "pay_now" | null }`
- Gate used before LiveView and RecordingPlayback

#### [NEW] `src/navigation/index.tsx`
- Root navigator: `AuthStack` vs `MainStack` based on auth state
- `AuthStack`: Login → SignUp → ForgotPassword → OTPVerification → ResetPassword
- `MainStack`: Bottom Tab Navigator (4 tabs: Home, Cameras, Billing, Profile) + all stack screens
- Deep link: `Linking.getInitialURL()` on launch, `Linking.addEventListener` foregrounded
- URL scheme: `cctvcustomer://`

### 0.5 Design System

**[NEW] `src/constants/theme.ts`** — Premium dark-first:
- Colors: Deep navy `#0A0F1E`, teal `#00C6AE`, SOS red `#FF3B30`, amber `#FF9F0A`, green `#30D158`
- Typography: Inter font
- 4px base grid, 12px card radius, 24px button radius

**[NEW] `src/components/` (Shared):**
- `StatusBadge` — colored pill
- `SOSFab` — persistent red floating SOS button
- `LoadingOverlay` — blur full-screen spinner
- `EmptyState` — illustration + message + CTA
- `OfflineBanner` — top banner when offline
- `ErrorBoundary` — catch unhandled render errors

### Phase 0 Deliverable
App launches to Login screen, all native deps linked, no crashes.

---

## Phase 1 — Authentication Module

**Goal:** Full auth flow with secure token management.
**PRD §6 | APIs: `/auth/*` | Testing: `auth_testing_guide.md`**

---

### 1.1 Screens

#### [NEW] `LoginScreen`
- Email + password (React Hook Form + Zod)
- `POST /api/v1/auth/login`
- On success: store tokens in Keychain; decode JWT — block entry if `role !== "customer"`
- Errors: 401 → "Invalid credentials", 403 → "Account deactivated", 429 → countdown
- Links: [Forgot Password?], [Create Account]

#### [NEW] `SignUpScreen`
- Name, Email, Phone (10-digit Indian), Password, Confirm Password
- Hidden `role: "customer"` in payload
- `POST /api/v1/auth/register`
- On success: store tokens → Dashboard
- Errors: 409 duplicate email, 400 validation inline, 429 countdown

#### [NEW] `ForgotPasswordScreen`
- Email input → `POST /api/v1/auth/forgot-password`
- Shows masked email: "OTP sent to ad***@..."

#### [NEW] `OTPVerificationScreen`
- 6-digit OTP input (autofill on Android/iOS)
- `POST /api/v1/auth/verify-otp`
- Stores `resetToken` → navigates to ResetPassword
- Resend button with countdown

#### [NEW] `ResetPasswordScreen`
- New password + confirm
- `POST /api/v1/auth/reset-password` with `{ resetToken, newPassword, confirmPassword }`
- On success → Login with success toast

### 1.2 RTK Query Endpoints (`src/features/auth/authApi.ts`)

```typescript
login(body) → POST /auth/login
register(body) → POST /auth/register
forgotPassword(email) → POST /auth/forgot-password
verifyOtp(body) → POST /auth/verify-otp
resetPassword(body) → POST /auth/reset-password
logout() → POST /auth/logout
changePassword(body) → PUT /auth/change-password
getSessions() → GET /auth/sessions
revokeSession(id) → DELETE /auth/sessions/:id
```

### 1.3 Token Lifecycle
- **Storage:** `react-native-keychain` — entries: `access_token`, `refresh_token`
- **Refresh:** Axios interceptor — silent, transparent
- **Reuse detection:** 401 on refresh → force logout, "Session expired. Please log in again."
- **Auto-logout:** `AppState` + `BackgroundTimer` — 30 min inactivity

### 1.4 FCM Registration on Login
`POST /api/v1/notifications/register-device` after login with FCM token + platform.
`messaging().onTokenRefresh(token => re-register)`

### Phase 1 Deliverable
Full auth flow, tokens in Keychain, role guard active, FCM registered.

**Test coverage:** `auth_testing_guide.md` §2–9 end-to-end.

---

## Phase 2 — Dashboard & Camera Management

**Goal:** Home screen, camera browsing, live streaming, recordings, sharing.
**PRD §8.1, §8.2 | APIs: `/customer/dashboard`, `/customer/cameras/*` | Testing: `customer_testing_guide.md`, `stream_testing_guide.md`**

---

### 2.1 Dashboard Screen (Home Tab)

**API:** `GET /api/v1/customer/dashboard`

**Subscription Status Banner:**

| Status | UI |
|---|---|
| `active` | Green pill: "Premium — expires Oct 2026" |
| `past_due` | Orange pill + "Pay Now" CTA → Payment screen |
| `canceled`/none | Red pill + "Upgrade Now" CTA → Plan Selection |

**Camera Health Row:** 3 stat cards (Online/Offline/Maintenance). Tap → filtered Camera List.

**Quick Access Camera Grid:** Horizontal scroll up to 4 cards. [Watch Live] → subscription guard → LiveView.

**Active SOS Banner:** Pulsing red. Shown only when `activeSosAlerts.length > 0`. Tap → SOSDetail.

**Recent Incidents Row:** Last 5 from dashboard payload. "View All" → IncidentList.

**Data:** RTK Query with `redux-persist` cache. Pull-to-refresh. Socket.IO events update without re-fetching.

### 2.2 Camera List Screen (Cameras Tab)

**API:** `GET /api/v1/customer/cameras`

- Filter: All / Online / Offline / Mine / Shared With Me
- Client-side search by name/location
- Camera card: name, location, status badge, "Shared" badge (if `isOwner === false`), [Watch Live], [Recordings], owner-only [Share] [⋯]

### 2.3 Camera Detail Screen

Receives camera object from route params. No extra API call for static data.

- Name, serial number, full address
- Map pin (`react-native-maps`) if coordinates available
- Status badge + last ping
- Health metrics (CPU, Memory, Temperature, Storage)
- Settings summary (recording, motion detection, AI)
- Buttons: [Watch Live], [View Recordings], [Share Camera] (owner only)

### 2.4 Live View Screen

> [!CAUTION]
> **Use `/customer/cameras/:id/live` — NOT `/streams/:cameraId/token`**. The raw streams route may require `streams:read` permission not granted to customers.

**Pre-flight:** `useSubscriptionGuard` — if not `"active"`, show paywall modal. Do NOT navigate.

**Stream flow:**
1. `GET /api/v1/customer/cameras/:id/live` → `{ sessionId, streamToken, pathName, webrtcUrl }`
2. `POST /api/v1/streams/:cameraId/webrtc/offer` with SDP offer → `{ type: "answer", sdp, sessionUrl }`
3. WebRTC handshake via `react-native-webrtc`
4. On exit: `POST /api/v1/streams/stop` with `{ cameraId, sessionId }`

**UI:** Landscape auto-rotate. Controls overlay (tap to show/hide): 📸 Snapshot, 🔊 Mute, ✕ Close.
`react-native-prevent-screenshot` active.

**Errors:** 403 → paywall, camera offline → retry, WebRTC fail → retry button.

### 2.5 Recording Playback Screen

> [!CAUTION]
> **Use `/customer/cameras/:id/playback` — NOT raw `/recordings` route**. The raw route requires `recordings:read` permission that may not be granted.

**Pre-flight:** Same subscription guard.

**APIs:**
- `GET /customer/cameras/:id/playback?start=...&end=...` (both `start`/`end` and `startTime`/`endTime` aliases work)
- Timeline (if permission confirmed): `GET /recordings/:cameraId/timeline?date=YYYY-MM-DD`

**UI:** Calendar picker, 24h timeline bar, video player (`react-native-video`), seek.
Download button: shown only if `camera.customerId === user._id` AND `recordings:download` permission confirmed. Hidden entirely for shared viewers.
`react-native-prevent-screenshot` active.

### 2.6 Camera Sharing

#### Share Camera Screen
`POST /api/v1/customer/cameras/:id/share` `{ email }`
- Owner guard: only accessible when `camera.customerId === user._id`
- Errors: "No registered customer found", "Cannot share with yourself", "Already shared"
- Success toast: "Camera shared with [email]"

#### Revoke Share
`DELETE /api/v1/customer/cameras/:id/share/:userId`
- Listed in Camera Detail "Shared With" section
- Confirmation dialog before API call

> [!WARNING]
> **Shared camera subscription:** Viewers need their OWN active subscription (not the owner's). Show: "Your subscription is required to view shared cameras."

### Phase 2 Deliverable
Dashboard with live data, camera list/detail, working WebRTC stream (requires MediaMTX), recording playback, camera sharing.

**Test coverage:** `customer_testing_guide.md` §2–6, `stream_testing_guide.md` §1–8 with customer token.

---

## Phase 3 — SOS Emergency Module

**Goal:** One-tap SOS from all screens. 3-second hold-to-confirm. Real-time updates.
**PRD §8.4 | APIs: `/sos/*` | Testing: `sos_testing_guide.md`**

---

### 3.1 Persistent SOS FAB

Rendered in `MainStack` shell — visible from ALL authenticated screens, above tab navigator.
Tap → opens `SOSTrigger` modal (full-screen).

### 3.2 SOS Trigger Modal

**API:** `POST /api/v1/sos` `{ cameraId?, location? }`

**Flow:**
1. Full-screen red gradient modal with pulsing 🆘 icon
2. Auto-populated GPS location (`react-native-permissions` → `ACCESS_FINE_LOCATION`)
3. Optional camera picker (owned cameras)
4. **3-second press-and-hold on [SEND SOS]:**
   - `LongPressGestureHandler` from `react-native-gesture-handler`
   - Circular progress animation via `react-native-reanimated`
   - Release before 3s → cancel + reset animation
   - Complete 3s → trigger API call
5. **Post-send full-screen success:**
   - "✅ SOS Sent. Help is on the way."
   - If `customerDetails.emergencyContact` exists: [Call [Name]] → `Linking.openURL('tel:<phone>')`
   - [Skip] to dismiss
   - If no contact: tip + [Skip]
6. Dashboard shows Active SOS Banner on return

**No network:** Block action. Show: "Cannot send SOS. Connect to internet or call emergency services."

### 3.3 SOS History Screen

**APIs:** `GET /api/v1/sos` (paginated, backend auto-filters to own), `GET /api/v1/sos/active`

SOS Card: status badge (pulsing red for `active`), timestamp, location, linked camera, who acknowledged/resolved.

Accessible from: Profile → "My Emergency History" or Dashboard banner.

### 3.4 SOS Detail Screen

**APIs:** `GET /api/v1/sos/:id`, `GET /api/v1/sos/:id/timeline`

- Vertical status timeline: Triggered → Acknowledged by [name] → Resolved by [name]
- Map pin if coordinates parseable
- Linked camera (tappable → LiveView with subscription guard)
- Resolution notes
- Timeline tab: audit log

### 3.5 Real-Time SOS Socket Events

```typescript
socket.on("sos_acknowledged", (data) => {
  if (data.triggeredBy === user._id) {
    // Update Dashboard SOS banner + SOSDetail if open
  }
});
socket.on("sos_resolved", (data) => {
  if (data.triggeredBy === user._id) {
    // Dismiss active SOS banner, show resolved status
  }
});
```

### Phase 3 Deliverable
SOS FAB on all screens, 3-sec hold animation, GPS location, emergency dial-out, history, detail, real-time socket updates.

**Test coverage:** `sos_testing_guide.md` §1–4 (customer token). Socket.IO: §9.

---

## Phase 4 — Incident Reporting, Billing & Tickets

**Goal:** Self-serve Razorpay billing, incident reporting, support tickets.
**PRD §8.3, §8.5, §8.6, §8.7 | Testing: `incident_testing_guide.md`, `billing_testing_guide.md`, `ticket_testing_guide.md`**

---

### 4.1 Incident Module

#### Incident List Screen
`GET /api/v1/incidents` — backend auto-filters to `reportedBy === user._id`

- Filter: All / Open / Investigating / Resolved / Closed
- Sort: Newest first
- Card: type icon, severity badge, status badge (read-only), linked camera, relative time

#### Report New Incident Screen
`POST /api/v1/incidents` (multipart/form-data)

Fields: Title, Description, Type (theft/vandalism/technical_issue/other), Severity (low/medium/high/critical), Camera (optional, owned only), Attachments (up to 5 files, 10MB each).

Flow: Form → Preview → Submit → "Incident #[id] Reported. Our team will review it."

#### Incident Detail Screen
APIs:
- `GET /api/v1/incidents/:id`
- `GET /api/v1/incidents/:id/timeline`
- `POST /api/v1/incidents/:id/notes` — **owner guard only**
- `POST /api/v1/incidents/:id/media` — **owner guard only**

> [!CAUTION]
> **Backend has NO ownership check** on `addIncidentNote` or `uploadIncidentMedia`. The app MUST enforce: only render [Add Note] and [Upload Media] when `incident.reportedBy._id === user._id`.

UI: Title, description, type/severity, status badge (read-only), linked camera, attachments grid, notes list, timeline tab, [Add Note] composer (guarded).

Socket.IO: `incident_updated` → update status badge; `incident_closed` → show resolved banner.

### 4.2 Billing Module (Billing Tab)

#### Plan Selection Screen
`GET /api/v1/plans` — **public, no auth required**

3 plan cards:

| Plan | Price | Badge |
|---|---|---|
| Basic | ₹9.99/mo | — |
| Premium | ₹19.99/mo | "Best Value" (hardcoded) |
| AI-Pro | ₹39.99/mo | — |

"Current Plan" badge on active. If already active: hide Subscribe, show "Cancel first to switch plans."

#### Razorpay Payment Flow (Production)

> [!IMPORTANT]
> Use this flow for production, NOT `POST /customer/subscribe` (which assumes instant payment and marks invoice `paid` immediately without Razorpay).

**Steps:**
1. `POST /api/v1/subscriptions` `{ planId }` → `{ subscription._id, invoice._id }` (status: `pending_payment`)
2. `POST /api/v1/payments/create-order` `{ subscriptionId }` → `{ orderId, amount, currency, razorpayKeyId }`
3. `RazorpayCheckout.open({ key, order_id: orderId, amount, currency: "INR" })`
4. SDK success callback: `POST /api/v1/payments/verify` `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
5. Verify success → refresh subscription → SubscriptionDetail success state

**Errors:** SDK failure → Razorpay built-in UI + retry; 400 active sub → redirect; no internet → block.

#### Current Subscription Screen
`GET /api/v1/customer/subscription`

- Plan, status badge, dates, price, days-remaining progress bar
- [Cancel] if `active`, [Renew] if `past_due`

#### Cancel Subscription
> [!IMPORTANT]
> Use `POST /api/v1/customer/cancel-subscription` — NOT `PATCH /subscriptions/:id/cancel`. The customer endpoint auto-finds the active subscription.

Confirmation sheet: "Your access continues until [endDate]." Red button.

#### Renew Subscription
`PATCH /api/v1/subscriptions/:id/renew` → new pending invoice → Razorpay flow.

#### Invoice List Screen
`GET /api/v1/customer/invoices` — Invoice date, INR amount, status (paid/pending/failed), [Download]

#### Invoice Download
`GET /api/v1/invoices/:id/download` → PDF via `react-native-blob-util` → share to Files app.

#### Payment History Screen
`GET /api/v1/customer/payments` — Order ID, payment ID, amount, status, date.

### 4.3 Support Tickets Module

#### Ticket List Screen
`GET /api/v1/tickets` — auto-filtered to `createdBy === user._id`

Filter: All / Open / In-Progress / Resolved. Card: title, category, status badge, priority badge, last updated, unread dot.

#### Create Ticket Screen
`POST /api/v1/tickets` `{ title, description, category, priority }`

Fields: Subject, Category (technical/billing/general/other), Priority (low/medium/high/critical), Description.
Success: "Ticket #[number] created. We'll respond within 24 hours."

#### Ticket Detail Screen
`GET /api/v1/tickets/:id`, `POST /api/v1/tickets/:id/comments` `{ text }`

Thread view: chronological comments (customer + admin/franchise). Comment composer at bottom.
Auto-reopen: if ticket `closed`, show banner "Replying will reopen this ticket." before send.

Customer cannot: update status, assign, close.

### Phase 4 Deliverable
Incident CRUD with file uploads, ownership guard, Razorpay full payment flow, subscription management, invoices/payments, support ticket CRUD + thread.

**Test coverage:** `incident_testing_guide.md` §1–9, `billing_testing_guide.md` §1–17, `ticket_testing_guide.md` §1–9.

---

## Phase 5 — Notifications, Profile & Polish

**Goal:** Push notifications, deep links, profile management, security hardening, offline mode.
**PRD §8.8, §8.9, §9–14 | Testing: `notification_testing_guide.md`**

---

### 5.1 Notification Centre Screen

APIs: `GET /api/v1/notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `DELETE /notifications/:id`

- Paginated flat list (infinite scroll)
- Blue dot unread, swipe left → delete, swipe right → mark read
- "Mark All Read" header button
- Icons: `alert` → 🔔, `system` → ⚙️, `message` → 💬

> [!IMPORTANT]
> Socket event is `"notification"` — **NOT** `"notification:<userId>"`. The backend routes to the user's private room at the transport layer. Listen: `socket.on("notification", handler)`.

Real-time: prepend new notification from socket + in-app toast banner. Tab badge shows unread count.

### 5.2 Push Notifications (FCM) & Deep Links

```typescript
// Foreground
messaging().onMessage(msg => showInAppBanner(msg));

// Background tap
messaging().onNotificationOpenedApp(msg => navigate(msg.data.link));

// Terminated state
const initial = await messaging().getInitialNotification();
if (initial) navigate(initial.data.link);
```

**Deep Link Routing:**

| Deep Link | Screen |
|---|---|
| `cctvcustomer://billing/subscription` | SubscriptionDetail |
| `cctvcustomer://cameras` | CameraList |
| `cctvcustomer://sos/:sosId` | SOSDetail |
| `cctvcustomer://incidents/:incidentId` | IncidentDetail |
| `cctvcustomer://tickets/:ticketId` | TicketDetail |

React Navigation `linking` config wires these automatically.

### 5.3 Notification Preferences Screen

`GET/PUT /api/v1/notifications/preferences`

2 rows × 3 columns (Push / In-App / Email):

| Category | Push | In-App | Email |
|---|---|---|---|
| Alerts | toggle | toggle | toggle |
| System | toggle | toggle | toggle |

> [!NOTE]
> `message` type has NO separate toggle row — it falls under `system`. Do NOT add a third row.

PUT payload: `{ alerts: { push, inApp, email }, system: { push, inApp, email } }`

### 5.4 Profile Screen (Profile Tab)

APIs: `GET /customer/profile`, `PUT /customer/profile`, `PUT /users/profile/avatar` (multipart, field: `avatar`)

**Profile header:** Avatar (Cloudinary/fallback), Name, Email, Phone, "Customer" badge, Franchise contact (from dashboard payload — no extra call).

**Edit Profile:** Name, Phone, Emergency contact (name/phone/relation), Address. Avatar upload → `PUT /users/profile/avatar` (300×300 Cloudinary transform).

**Settings sections:**
1. Notifications → NotifPreferences
2. Security: Change Password (`PUT /auth/change-password`), Active Sessions (`GET/DELETE /auth/sessions`)

> [!WARNING]
> If customer revokes their **own current session**, the next API call returns 401, refresh fails, Axios interceptor clears Keychain and navigates to Login. Show warning on current session entry: "Revoking this will log you out on this device."

3. My Incidents → IncidentList
4. My SOS History → SOSHistory
5. Support Tickets → TicketList
6. About (app version, Terms, Privacy Policy)
7. Logout → `POST /auth/logout` → clear Keychain → disconnect Socket.IO → reset Redux → Login

### 5.5 Security Hardening

| Requirement | Implementation |
|---|---|
| Screen recording prevention | `react-native-prevent-screenshot` on LiveView + RecordingPlayback |
| Certificate pinning | `react-native-ssl-pinning` for production builds |
| Auto-logout | `AppState` + `BackgroundTimer` — 30 min inactivity |
| No sensitive data in logs | Logger wrapper strips tokens/payment IDs in production (`__DEV__` guard) |
| Payment data | Never stored locally — Razorpay SDK handles all card data |

### 5.6 Offline Behaviour

| Scenario | Behaviour |
|---|---|
| Launch offline | Cached Redux Persist data + "Offline" banner |
| SOS offline | Block send: "Cannot send SOS. Connect to internet or call emergency services." |
| Streaming offline | "No connection" overlay |
| Payment offline | Block SDK: "Payment requires an active internet connection." |
| Lists offline | Cached list + "Last updated X ago" |

### 5.7 Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| Cold start | < 2.5s | Hermes engine, no sync startup ops |
| Dashboard load | < 1s P95 | RTK Query + Redux Persist instant paint |
| Live stream start | < 5s | Pre-warm WebRTC before offer |
| Push delivery | < 5s | FCM high-priority channel |
| Streaming memory | < 200MB | Release peer on screen unmount |

### Phase 5 Deliverable
Full Notification Centre, FCM push + deep links, preferences, complete profile with avatar, sessions, change password, offline mode, all security requirements.

**Test coverage:** `notification_testing_guide.md` §1–4, `customer_testing_guide.md` §12–13.

---

## Complete Screen Inventory (32 Screens)

| # | Screen | Route Key | Phase | Module |
|---|---|---|---|---|
| 1 | Login | `Login` | 1 | Auth |
| 2 | Sign Up | `SignUp` | 1 | Auth |
| 3 | Forgot Password | `ForgotPassword` | 1 | Auth |
| 4 | OTP Verification | `OTPVerification` | 1 | Auth |
| 5 | Reset Password | `ResetPassword` | 1 | Auth |
| 6 | Dashboard | `Dashboard` | 2 | Home |
| 7 | Camera List | `CameraList` | 2 | Cameras |
| 8 | Camera Detail | `CameraDetail` | 2 | Cameras |
| 9 | Live View (WebRTC) | `LiveView` | 2 | Cameras |
| 10 | Recording Playback | `RecordingPlayback` | 2 | Cameras |
| 11 | Share Camera | `ShareCamera` | 2 | Cameras |
| 12 | SOS Trigger (modal) | `SOSTrigger` | 3 | SOS |
| 13 | SOS History | `SOSHistory` | 3 | SOS |
| 14 | SOS Detail | `SOSDetail` | 3 | SOS |
| 15 | Incident List | `IncidentList` | 4 | Incidents |
| 16 | Incident Detail | `IncidentDetail` | 4 | Incidents |
| 17 | Report Incident | `ReportIncident` | 4 | Incidents |
| 18 | Plan Selection | `PlanSelection` | 4 | Billing |
| 19 | Payment (Razorpay) | `Payment` | 4 | Billing |
| 20 | Subscription Detail | `SubscriptionDetail` | 4 | Billing |
| 21 | Invoice List | `InvoiceList` | 4 | Billing |
| 22 | Invoice Detail | `InvoiceDetail` | 4 | Billing |
| 23 | Payment History | `PaymentHistory` | 4 | Billing |
| 24 | Ticket List | `TicketList` | 4 | Support |
| 25 | Ticket Detail | `TicketDetail` | 4 | Support |
| 26 | Create Ticket | `CreateTicket` | 4 | Support |
| 27 | Notification Centre | `Notifications` | 5 | Notifications |
| 28 | Profile | `Profile` | 5 | Profile |
| 29 | Edit Profile | `EditProfile` | 5 | Profile |
| 30 | Change Password | `ChangePassword` | 5 | Profile |
| 31 | Active Sessions | `Sessions` | 5 | Profile |
| 32 | Notification Preferences | `NotifPreferences` | 5 | Profile |

---

## Critical RBAC Rules (Must Enforce in UI)

| Rule | Source | UI Guard |
|---|---|---|
| No SOS acknowledge/resolve for customers | `sos.service.ts` | No such buttons rendered |
| Incident status is read-only | `incident.service.ts` | Status badge — no edit |
| `addIncidentNote` has no server ownership check | PRD §8.5 | Show [Add Note] only when `reportedBy._id === user._id` |
| `uploadIncidentMedia` has no server ownership check | PRD §8.5 | Same guard as notes |
| Streaming: only `"active"` subscription passes | `stream.service.ts` L197–202 | Check BEFORE opening LiveView/Playback |
| Shared viewers need their OWN subscription | PRD §8.3 | Show "Your subscription required for shared cameras" |
| Download is owner-only in v1 | PRD Decision #5 | Hide for `isOwner === false` |
| Use `POST /customer/cancel-subscription` | PRD §8.6 | Not `PATCH /subscriptions/:id/cancel` |
| Use `GET /customer/cameras/:id/live` | PRD §8.2 | Not `GET /streams/:id/token` |
| Use `GET /customer/cameras/:id/playback` | PRD §8.2 | Not `GET /recordings/:id/playback` |
| Socket event is `"notification"` not `"notification:<id>"` | PRD §9 | Correct event name in listener |

---

## Complete API Endpoint Map (55 Endpoints)

| Method | Endpoint | Phase | Screen(s) |
|---|---|---|---|
| POST | `/auth/register` | 1 | SignUp |
| POST | `/auth/login` | 1 | Login |
| POST | `/auth/forgot-password` | 1 | ForgotPassword |
| POST | `/auth/verify-otp` | 1 | OTPVerification |
| POST | `/auth/reset-password` | 1 | ResetPassword |
| POST | `/auth/refresh-token` | 0 | Axios interceptor |
| POST | `/auth/logout` | 5 | Profile |
| PUT | `/auth/change-password` | 5 | ChangePassword |
| GET | `/auth/sessions` | 5 | Sessions |
| DELETE | `/auth/sessions/:id` | 5 | Sessions |
| GET | `/customer/dashboard` | 2 | Dashboard |
| GET | `/customer/cameras` | 2 | CameraList |
| GET | `/customer/cameras/:id/live` | 2 | LiveView |
| GET | `/customer/cameras/:id/playback` | 2 | RecordingPlayback |
| POST | `/customer/cameras/:id/share` | 2 | ShareCamera |
| DELETE | `/customer/cameras/:id/share/:userId` | 2 | ShareCamera |
| GET | `/customer/subscription` | 4 | SubscriptionDetail |
| POST | `/customer/subscribe` | 4 | Payment (fallback only) |
| POST | `/customer/cancel-subscription` | 4 | SubscriptionDetail |
| GET | `/customer/invoices` | 4 | InvoiceList |
| GET | `/customer/payments` | 4 | PaymentHistory |
| GET | `/customer/profile` | 5 | Profile |
| PUT | `/customer/profile` | 5 | EditProfile |
| PUT | `/users/profile/avatar` | 5 | EditProfile |
| GET | `/plans` | 4 | PlanSelection |
| POST | `/subscriptions` | 4 | Payment |
| PATCH | `/subscriptions/:id/renew` | 4 | SubscriptionDetail |
| POST | `/payments/create-order` | 4 | Payment |
| POST | `/payments/verify` | 4 | Payment |
| GET | `/invoices/:id` | 4 | InvoiceDetail |
| GET | `/invoices/:id/download` | 4 | InvoiceDetail |
| POST | `/streams/:cameraId/webrtc/offer` | 2 | LiveView |
| POST | `/streams/stop` | 2 | LiveView |
| POST | `/sos` | 3 | SOSTrigger |
| GET | `/sos` | 3 | SOSHistory |
| GET | `/sos/active` | 3 | Dashboard |
| GET | `/sos/:id` | 3 | SOSDetail |
| GET | `/sos/:id/timeline` | 3 | SOSDetail |
| GET | `/incidents` | 4 | IncidentList |
| POST | `/incidents` | 4 | ReportIncident |
| GET | `/incidents/:id` | 4 | IncidentDetail |
| POST | `/incidents/:id/notes` | 4 | IncidentDetail |
| POST | `/incidents/:id/media` | 4 | IncidentDetail |
| GET | `/incidents/:id/timeline` | 4 | IncidentDetail |
| GET | `/tickets` | 4 | TicketList |
| POST | `/tickets` | 4 | CreateTicket |
| GET | `/tickets/:id` | 4 | TicketDetail |
| POST | `/tickets/:id/comments` | 4 | TicketDetail |
| GET | `/notifications` | 5 | Notifications |
| PATCH | `/notifications/:id/read` | 5 | Notifications |
| PATCH | `/notifications/read-all` | 5 | Notifications |
| DELETE | `/notifications/:id` | 5 | Notifications |
| POST | `/notifications/register-device` | 1 | (on login) |
| GET | `/notifications/preferences` | 5 | NotifPreferences |
| PUT | `/notifications/preferences` | 5 | NotifPreferences |

---

## Socket.IO Event Matrix

| Event | Scope | Phase | Customer App Action |
|---|---|---|---|
| `notification` | User's private room | 5 | Prepend to Notification Centre, show toast |
| `sos_acknowledged` | Global | 3 | Update Dashboard SOS banner + SOSDetail (check `triggeredBy`) |
| `sos_resolved` | Global | 3 | Dismiss active banner, show resolved status (check `triggeredBy`) |
| `incident_updated` | User's private room | 4 | Update status badge on IncidentList + Detail |
| `incident_closed` | User's private room | 4 | Show "Resolved" banner on IncidentDetail |

---

## Open Questions

> [!IMPORTANT]
> **Q1 — Backend URL:** All Postman collections use `http://localhost:5000/api/v1`. For physical device testing this needs to be the LAN IP or an ngrok tunnel. What is the target dev environment?

> [!IMPORTANT]
> **Q2 — Razorpay Keys:** Do you have `rzp_test_...` key ID and `RAZORPAY_KEY_SECRET`? Needed for Phase 4. The billing guide shows `rzp_test_mockKey123` as a placeholder.

> [!IMPORTANT]
> **Q3 — Firebase Project:** Is there an existing Firebase project? We need `FIREBASE_SERVICE_ACCOUNT_BASE64` on the backend and `google-services.json` / `GoogleService-Info.plist` for the app.

> [!IMPORTANT]
> **Q4 — MediaMTX:** Is MediaMTX running with camera paths configured? The stream guide says API returns 200 without it, but video won't render until MediaMTX is up.

> [!NOTE]
> **Q5 — Mono-repo:** Is this in a mono-repo with the Operator app? If yes, shared Axios instance and utilities can be extracted to a `packages/shared` workspace.

> [!NOTE]
> **Q6 — Cloudinary:** Is Cloudinary configured on the backend for avatar uploads? PRD notes a local `/uploads` disk fallback if not.

---

## Verification Plan

### Phase-by-Phase Test Coverage

| Phase | Backend API Tests | On-Device Verification |
|---|---|---|
| 0 | `npx react-native run-android/ios` — no crash | App renders Login screen |
| 1 | `auth_testing_guide.md` bash script §2–9 | Login/register/OTP on physical device, FCM token registered |
| 2 | `customer_testing_guide.md` §2–6, `stream_testing_guide.md` §1–8 | Live video renders, timeline playback, share/revoke flow |
| 3 | `sos_testing_guide.md` §1–4 (customer token) | SOS hold animation, emergency dial prompt, socket updates |
| 4 | `incident_testing_guide.md` §1–9, `billing_testing_guide.md` §1–17, `ticket_testing_guide.md` §1–6 | Razorpay SDK, payment, subscription activated, invoice PDF |
| 5 | `notification_testing_guide.md` §1–4 | FCM push arrives, deep link routes to correct screen |

### Performance Validation
- Cold start: Android Profiler / Flipper
- Dashboard: RTK Query devtools — confirm < 1s
- Streaming memory: Flipper Memory Inspector — must stay < 200MB

### Security Validation
- `react-native-prevent-screenshot` blocks recording on LiveView
- Role guard rejects non-customer JWT at Login
- Axios interceptor retries after refresh, logs out on refresh failure
- Self-session revoke redirects to Login
