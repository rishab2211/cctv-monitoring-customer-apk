# CCTV Monitoring Platform — Customer Mobile Application

[![React Native](https://img.shields.io/badge/React_Native-0.87.1-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.12.0-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![WebRTC](https://img.shields.io/badge/WebRTC-Live_Streaming-333333?logo=webrtc&logoColor=white)](https://webrtc.org)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-0C2340?logo=razorpay&logoColor=white)](https://razorpay.com)
[![Firebase FCM](https://img.shields.io/badge/Firebase-Cloud_Messaging-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)

**CCTV Monitoring Platform Customer Mobile App** is a high-performance cross-platform application (Android & iOS) designed for real-time CCTV surveillance, low-latency WebRTC live streaming, instant emergency SOS dispatch, cloud playback, incident tracking, and multi-tier subscription billing with Razorpay.

---

## Table of Contents

- [Overview & Capabilities](#overview--capabilities)
- [Key Features](#key-features)
  - [1. Real-Time Surveillance & WebRTC Live Streaming](#1-real-time-surveillance--webrtc-live-streaming)
  - [2. Emergency SOS Protocol & Instant Dispatch](#2-emergency-sos-protocol--instant-dispatch)
  - [3. Incidents & Security Event Logging](#3-incidents--security-event-logging)
  - [4. Subscription Billing & Razorpay Integration](#4-subscription-billing--razorpay-integration)
  - [5. Support Ticketing & Live Communication](#5-support-ticketing--live-communication)
  - [6. Real-Time WebSockets & Push Notifications](#6-real-time-websockets--push-notifications)
  - [7. Security, Inactivity & Multi-Session Control](#7-security-inactivity--multi-session-control)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Design System & Theme Tokens](#design-system--theme-tokens)
- [Configuration & Environment](#configuration--environment)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running on Android](#running-on-android)
  - [Running on iOS](#running-on-ios)
  - [Quality & Testing Scripts](#quality--testing-scripts)
- [Deep Linking & URL Schemes](#deep-linking--url-schemes)
- [API & State Management Workflow](#api--state-management-workflow)
  - [RTK Query Tag Cache Invalidation](#rtk-query-tag-cache-invalidation)
  - [Axios Silent Token Refresh & Request Queue](#axios-silent-token-refresh--request-queue)
- [Troubleshooting & FAQs](#troubleshooting--faqs)
- [License](#license)

---

## Overview & Capabilities

The CCTV Monitoring Customer Mobile App gives property owners full visibility and instant control over their security cameras and surveillance ecosystem:

- **Ultra-Low Latency Live Feeds**: View real-time HD WebRTC video streams with bidirectional peer connection handling.
- **Cloud Playback**: Review historical 24/7 video recordings segmented into navigable chunks.
- **Instant SOS Dispatch**: 3-second hold emergency trigger with GPS location broadcasting and socket synchronization to the central monitoring station.
- **Multi-Viewer Camera Sharing**: Grant and revoke camera feed access to family members or security staff.
- **Automated Billing & Invoicing**: Upgrade security tiers, settle recurring invoices with Razorpay, and download PDF receipts.

---

## Key Features

### 1. Real-Time Surveillance & WebRTC Live Streaming
- **Live Video Player**: Hardware-accelerated WebRTC streaming (`react-native-webrtc`) with automatic SDP offer/answer negotiation.
- **Health & Metrics**: Real-time camera online/offline status, CPU/memory usage, temperature, and signal health indicators.
- **Historical Cloud Playback**: Timeline-based video playback (`react-native-video`) with chunk scrubbing.
- **Camera Sharing**: Delegate viewing permissions via email and manage active viewer lists with instant access revocation.

### 2. Emergency SOS Protocol & Instant Dispatch
- **Hold-to-Trigger Animation**: 3-second hold gesture with Reanimated SVG progress ring to prevent accidental activation.
- **Location Broadcasting**: Automatically attaches street address and GPS coordinates to emergency payloads.
- **Real-Time Status Tracking**: Live timeline updates (`active` $\rightarrow$ `acknowledged` $\rightarrow$ `resolved`) pushed over Socket.IO.
- **Quick-Dial Action**: Direct one-tap calling to local emergency services (112) or assigned franchise contacts.

### 3. Incidents & Security Event Logging
- **Incident Reporting**: Categorize events (`Theft`, `Vandalism`, `Technical Issue`, `Other`) with severity ratings (`Low`, `Medium`, `High`, `Critical`).
- **Evidence Uploads**: Multi-file attachment handling with camera snapshot previews.
- **Interactive Event Timeline**: Chronological log of responder actions and notes.

### 4. Subscription Billing & Razorpay Integration
- **Tier Selection**: Switch between Basic, Premium, and AI-Pro surveillance plans with dynamic schema parsing.
- **Razorpay Checkout SDK**: Native Razorpay checkout modal with automatic signature verification.
- **Invoices & Receipts**: List generated invoices and download PDF tax receipts directly to device storage using `react-native-blob-util`.
- **Payment History**: Detailed audit trail of past gateway transactions.

### 5. Support Ticketing & Live Communication
- **Ticket Management**: Create support tickets with automated routing to technical and billing departments.
- **Conversational Comment Threads**: Real-time bidirectional discussion thread on open tickets.

### 6. Real-Time WebSockets & Push Notifications
- **Socket.IO Event Sync**: Automatic cache invalidation on events (`sos_acknowledged`, `incident_updated`, `ticket_comment`, `subscription_updated`).
- **FCM Push Notifications**: Firebase Cloud Messaging foreground/background handlers with entity deep-linking.
- **Notification Preferences**: Granular toggle controls for push, in-app, and email notification channels.

### 7. Security, Inactivity & Multi-Session Control
- **Keychain Storage**: Secure access and refresh token storage via `react-native-keychain`.
- **Silent Token Refresh**: Automatic 401 response interception with request queuing.
- **Inactivity Timer**: Automatic session locking after 30 minutes of user inactivity.
- **Multi-Device Session Management**: Inspect active logins and revoke individual or all other remote sessions.

---

## Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **React Native 0.87.1** | Native cross-platform runtime with new architecture support |
| **Language** | **TypeScript 6.0.3** | Full type-safety across all components, navigation, and API payloads |
| **State Management** | **Redux Toolkit 2.12.0** | Slices for Auth & UI with RTK Query tag-based cache invalidation |
| **State Persistence** | **Redux Persist 6.0.0** | Encrypted local caching of authentication state via AsyncStorage |
| **Networking** | **Axios 1.20.0** | Custom instance with 401 refresh queue & 429 rate limit backoff |
| **Realtime / Sockets** | **Socket.IO Client 4.8.3** | Low-latency bidirectional events for SOS, tickets, and notifications |
| **Video Streaming** | **react-native-webrtc 124.0.8** | WebRTC video feed with SDP offer/answer exchanges |
| **Video Playback** | **react-native-video 6.19.2** | Cloud recording chunk playback with custom controls |
| **Navigation** | **React Navigation 7.x** | Native Stack + Bottom Tabs with deep-link URL mapping |
| **UI Components** | **React Native Paper 5.15.3** | MD3 dark theme components tailored for high-contrast surveillance UI |
| **Icons** | **HugeIcons React Native** | Consistent vector iconography |
| **Animations** | **Reanimated 4.6.0 & SVG** | 60 FPS gesture-driven animations and SOS hold indicator rings |
| **Payments** | **react-native-razorpay 3.0.0** | Secure checkout integration for cards, netbanking, and UPI |
| **Push Notifications** | **@react-native-firebase 26.3.2** | Cloud messaging with foreground alerts and background wakeups |
| **File Management** | **react-native-blob-util 0.24.10** | PDF invoice downloads and document sharing |

---

## Project Directory Structure

```text
customer-mobile-app/
├── android/                        # Android native project and Gradle scripts
├── ios/                            # iOS native workspace and Podfile
├── src/
│   ├── api/                        # Networking configuration
│   │   ├── axiosInstance.ts        # Axios client with silent refresh & rate limiting
│   │   └── rtk-query/
│   │       └── baseApi.ts          # Base RTK Query definition with cache tag types
│   ├── app/                        # Redux state configuration
│   │   ├── store.ts                # Store setup with redux-persist & middleware
│   │   └── slices/
│   │       ├── authSlice.ts        # Authentication state & credentials
│   │       └── uiSlice.ts          # Active SOS, rate limits & offline state
│   ├── components/                 # Reusable UI components
│   │   ├── EmptyState.tsx          # Consistent empty list fallback
│   │   ├── ErrorBoundary.tsx       # Global React component error boundary
│   │   ├── HugeIcon.tsx            # HugeIcons wrapper
│   │   ├── LoadingOverlay.tsx      # Full-screen spinner modal
│   │   ├── OfflineBanner.tsx       # Real-time network connectivity banner
│   │   ├── SOSFab.tsx              # Persistent floating SOS emergency button
│   │   ├── StatusBadge.tsx         # Color-coded status chip component
│   │   └── SubscriptionPaywallModal.tsx # Guard modal for unverified streams
│   ├── constants/                  # App constants & configuration
│   │   ├── config.ts               # API URLs, socket addresses, and timeouts
│   │   ├── routes.ts               # Navigation route name constants
│   │   └── theme.ts                # Dark surveillance design tokens (colors, typography, shadows)
│   ├── features/                   # Domain-driven feature modules
│   │   ├── auth/                   # Login, SignUp, OTP, Forgot/Reset Password
│   │   ├── billing/                # Plans, Razorpay Payment, Invoices, Receipts
│   │   ├── cameras/                # Camera List, Live WebRTC View, Cloud Playback, Sharing
│   │   ├── dashboard/              # Home screen with quick feeds, SOS status & stats
│   │   ├── incidents/              # Incident List, Detail, and Report submission
│   │   ├── notifications/          # Notification Centre & Channel Preferences
│   │   ├── profile/                # Profile, Password change, Sessions, About
│   │   ├── sos/                    # SOS Trigger Modal, History, and Detail Timeline
│   │   └── tickets/                # Ticket List, Ticket Creation, Thread Conversation
│   ├── hooks/                      # Custom React hooks
│   │   ├── redux.ts                # Typed useAppDispatch & useAppSelector
│   │   ├── useFCMToken.ts          # Firebase push notification registration & handling
│   │   ├── useInactivityTimer.ts   # Auto-logout on prolonged user inactivity
│   │   ├── useSocket.ts            # Socket.IO connection manager & cache invalidator
│   │   └── useSubscriptionGuard.ts # Paywall permission validator
│   ├── navigation/                 # Navigation setup
│   │   ├── AuthNavigator.tsx       # Public authentication stack
│   │   ├── MainTabNavigator.tsx    # Bottom tab navigator (Home, Cameras, Billing, Profile)
│   │   ├── RootNavigator.tsx       # Root stack navigator with deep-link binding
│   │   ├── linking.ts              # Deep link URL mapping configuration
│   │   └── types.ts                # React Navigation param list types
│   ├── types/                      # Global TypeScript models and API interfaces
│   │   └── index.ts                # User, Camera, SOS, Incident, Ticket & Subscription models
│   └── utils/                      # Helper utilities
│       └── keychain.ts             # Secure token read/write via react-native-keychain
├── App.tsx                         # App entry point with Redux, Theme, and ErrorBoundary
├── index.js                        # React Native app registry entry
└── package.json                    # Project dependencies and build scripts
```

---

## Design System & Theme Tokens

The application employs a curated **Cyber-Security Dark Mode** palette tailored for surveillance feeds:

```typescript
// src/constants/theme.ts
export const COLORS = {
  background: '#0A0F1E',          // Deep Obsidian Navy
  backgroundSecondary: '#0E162B', // Surface Base
  surfaceCard: '#131B2E',         // Elevated Card Surface
  surfaceElevated: '#1A243B',     // Active Input & Modal Surface
  border: '#222E48',              // Divider & Border
  borderHighlight: '#00C6AE40',   // Active Card Accent
  primary: '#00C6AE',             // Surveillance Teal
  sosRed: '#FF3B30',              // Emergency SOS Red
  warningAmber: '#FF9F0A',        // Alert Warning Amber
  successGreen: '#30D158',        // Online / Success Green
  infoBlue: '#0A84FF',            // Information Blue
  textPrimary: '#FFFFFF',         // Pure White Header
  textSecondary: '#94A3B8',       // Slate Grey Body
  textMuted: '#64748B',           // Subtext / Caption
};
```

---

## Configuration & Environment

Configuration is centralized in `src/constants/config.ts`:

```typescript
// src/constants/config.ts
export const CONFIG = {
  API_BASE_URL: 'http://<YOUR_LOCAL_IP>:5000/api/v1',
  SOCKET_URL: 'http://<YOUR_LOCAL_IP>:5000',
  APP_SCHEME: 'cctvcustomer',
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  SOS_HOLD_DURATION_MS: 3000,            // 3 seconds hold for SOS
  DEFAULT_PAGE_LIMIT: 20,
};
```

> **Testing on Physical Devices**: When running on a physical Android or iOS device over Wi-Fi, update `<YOUR_LOCAL_IP>` with your development machine's local LAN IP (e.g. `192.168.1.100`).

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `>= 22.11.0`
- **npm** or **yarn**
- **Java Development Kit (JDK)**: OpenJDK 17
- **Android Studio** (for Android): Android SDK with Platform 34+, Android Build-Tools, and configured emulator/device.
- **Xcode** (for macOS / iOS): Xcode 15+ with Command Line Tools and CocoaPods (`gem install cocoapods`).

---

### Installation

1. **Navigate to the project root**:
   ```bash
   cd apps/customer-mobile-app
   ```

2. **Install JavaScript dependencies**:
   ```bash
   npm install
   ```

3. **Install iOS CocoaPods** *(macOS only)*:
   ```bash
   cd ios && bundle exec pod install && cd ..
   ```

---

### Running on Android

1. **Start the Metro bundler**:
   ```bash
   npm start
   ```

2. **Launch the application on your Android emulator / connected device**:
   ```bash
   npm run android
   ```

3. **Reverse Android ports for local server access** *(if testing on a USB-connected device)*:
   ```bash
   adb reverse tcp:5000 tcp:5000
   adb reverse tcp:8081 tcp:8081
   ```

---

### Running on iOS

1. **Start the Metro bundler**:
   ```bash
   npm start
   ```

2. **Launch the application on iOS Simulator**:
   ```bash
   npm run ios
   ```

3. Or open `ios/CustomerApp.xcworkspace` directly in **Xcode** and click **Run**.

---

### Quality & Testing Scripts

```bash
# Run ESLint linter
npm run lint

# Run Jest unit test suite
npm test
```

---

## Deep Linking & URL Schemes

The app supports deep linking with the `cctvcustomer://` custom scheme and `https://app.cctvcustomer.com` universal links:

| Path | Destination Screen | Example URL |
| :--- | :--- | :--- |
| `dashboard` | Home Dashboard | `cctvcustomer://dashboard` |
| `cameras` | Camera List Screen | `cctvcustomer://cameras` |
| `cameras/:cameraId` | Camera Details Screen | `cctvcustomer://cameras/cam123` |
| `cameras/:cameraId/live` | WebRTC Live Feed View | `cctvcustomer://cameras/cam123/live` |
| `cameras/:cameraId/playback` | Cloud Video Playback | `cctvcustomer://cameras/cam123/playback` |
| `billing/plans` | Plan Selection Screen | `cctvcustomer://billing/plans` |
| `billing/payment` | Checkout & Payment Screen | `cctvcustomer://billing/payment` |
| `billing/invoices` | Invoices List Screen | `cctvcustomer://billing/invoices` |
| `billing/invoices/:invoiceId` | Invoice Details Screen | `cctvcustomer://billing/invoices/inv999` |
| `billing/payments` | Payment History Screen | `cctvcustomer://billing/payments` |
| `sos/trigger` | Emergency SOS Modal | `cctvcustomer://sos/trigger` |
| `sos/history` | Emergency Alert History | `cctvcustomer://sos/history` |
| `sos/:sosId` | SOS Incident Timeline | `cctvcustomer://sos/sos777` |
| `incidents` | Incident List Screen | `cctvcustomer://incidents` |
| `incidents/report` | Report Incident Screen | `cctvcustomer://incidents/report` |
| `incidents/:incidentId` | Incident Details Screen | `cctvcustomer://incidents/inc456` |
| `tickets` | Support Ticket List | `cctvcustomer://tickets` |
| `tickets/create` | Open Support Ticket | `cctvcustomer://tickets/create` |
| `tickets/:ticketId` | Support Ticket Conversation | `cctvcustomer://tickets/tk101` |
| `notifications` | Notification Centre | `cctvcustomer://notifications` |
| `settings/preferences` | Notification Preferences | `cctvcustomer://settings/preferences` |
| `profile/edit` | Edit Profile Screen | `cctvcustomer://profile/edit` |
| `profile/change-password` | Change Password Screen | `cctvcustomer://profile/change-password` |
| `profile/sessions` | Active Sessions Manager | `cctvcustomer://profile/sessions` |
| `about` | About & Legal Screen | `cctvcustomer://about` |

---

## API & State Management Workflow

### RTK Query Tag Cache Invalidation
The application uses RTK Query with tag-based caching to ensure instant UI synchronization across views without manual state refetching:

```
[Camera Mutation]      ──► Invalidates: ['Cameras', 'Dashboard']
[SOS Trigger]          ──► Invalidates: ['SOS', 'Dashboard']
[Incident Mutation]    ──► Invalidates: ['Incidents', 'Dashboard']
[Ticket Action]        ──► Invalidates: ['Tickets']
[Payment Verified]     ──► Invalidates: ['Billing', 'Dashboard']
[Notification Action]  ──► Invalidates: ['Notifications', 'Dashboard']
[Profile / Session]    ──► Invalidates: ['Profile', 'Auth', 'Dashboard']
```

### Axios Silent Token Refresh & Request Queue
```
App Request ──► Attached Bearer Token
                     │
                     ▼
             [401 Unauthorized?]
             ├── No  ──► Return API Response
             └── Yes ──► Queue Concurrent Requests
                         │
                         ▼
                 Call /auth/refresh-token
                 ├── Success: Save Tokens to Keychain & Replay Queued Requests
                 └── Failure: Clear Keychain & Trigger Redux Auth Logout
```

---

## Troubleshooting & FAQs

### 1. `react-native-webrtc` build issues on Android
Ensure that your `android/app/build.gradle` has Java 17 compatibility enabled:
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

### 2. Network request failed on Android physical device
Android blocks cleartext HTTP by default. Ensure `android:usesCleartextTraffic="true"` is declared in `android/app/src/main/AndroidManifest.xml` for local development, or test over HTTPS.

### 3. Razorpay SDK in Simulator / Sandbox Mode
The Razorpay native SDK requires a valid test key ID configured in your backend payment order response (`razorpayKeyId`). During sandbox development, the app includes fallback simulation prompts to test the complete order-to-activation flow seamlessly even without native SDK linking.

### 4. FCM Notifications not displaying on Android 13+
Android 13 (API 33+) requires runtime permission for `POST_NOTIFICATIONS`. The app requests this permission automatically on login via `useFCMToken`.

---

## License

Proprietary and Confidential. Copyright &copy; 2026 CCTV Monitoring Platform. All rights reserved.
