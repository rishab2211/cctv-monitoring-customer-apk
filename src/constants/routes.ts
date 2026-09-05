export const ROUTES = {
  // Auth Stack
  AUTH_STACK: 'AuthStack',
  LOGIN: 'Login',
  SIGN_UP: 'SignUp',
  FORGOT_PASSWORD: 'ForgotPassword',
  OTP_VERIFICATION: 'OTPVerification',
  RESET_PASSWORD: 'ResetPassword',

  // Main Bottom Tabs
  MAIN_TABS: 'MainTabs',
  TAB_HOME: 'TabHome',
  TAB_CAMERAS: 'TabCameras',
  TAB_BILLING: 'TabBilling',
  TAB_PROFILE: 'TabProfile',

  // Cameras Module
  CAMERA_LIST: 'CameraList',
  CAMERA_DETAIL: 'CameraDetail',
  LIVE_VIEW: 'LiveView',
  RECORDING_PLAYBACK: 'RecordingPlayback',
  SHARE_CAMERA: 'ShareCamera',

  // SOS Module
  SOS_TRIGGER: 'SOSTrigger',
  SOS_HISTORY: 'SOSHistory',
  SOS_DETAIL: 'SOSDetail',

  // Incidents Module
  INCIDENT_LIST: 'IncidentList',
  REPORT_INCIDENT: 'ReportIncident',
  INCIDENT_DETAIL: 'IncidentDetail',

  // Billing Module
  PLAN_SELECTION: 'PlanSelection',
  PAYMENT: 'Payment',
  INVOICE_LIST: 'InvoiceList',
  INVOICE_DETAIL: 'InvoiceDetail',
  PAYMENT_HISTORY: 'PaymentHistory',

  // Support Tickets Module
  TICKET_LIST: 'TicketList',
  CREATE_TICKET: 'CreateTicket',
  TICKET_DETAIL: 'TicketDetail',

  // Notifications Module
  NOTIFICATIONS: 'Notifications',

  // Profile & Settings Module
  PROFILE: 'Profile',
  EDIT_PROFILE: 'EditProfile',
  CHANGE_PASSWORD: 'ChangePassword',
  SESSIONS: 'Sessions',
  NOTIF_PREFERENCES: 'NotifPreferences',
  ABOUT: 'About',
} as const;
