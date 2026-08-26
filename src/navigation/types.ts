import { NavigatorScreenParams } from '@react-navigation/native';
import { Camera, Incident, SOSAlert, Ticket } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: { email?: string } | undefined;
  OTPVerification: { email: string; reason?: string };
  ResetPassword: { resetToken: string; email: string };
};

export type MainTabParamList = {
  TabHome: undefined;
  TabCameras: undefined;
  TabBilling: undefined;
  TabProfile: undefined;
};

export type RootStackParamList = {
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;

  // Cameras
  CameraList: { filter?: 'all' | 'online' | 'offline' | 'mine' | 'shared' } | undefined;
  CameraDetail: { camera?: Camera; cameraId?: string };
  LiveView: { cameraId: string; cameraName?: string; isOwner?: boolean };
  RecordingPlayback: { cameraId: string; cameraName?: string; isOwner?: boolean };
  ShareCamera: { camera?: Camera; cameraId?: string };

  // SOS
  SOSTrigger: { preselectedCameraId?: string } | undefined;
  SOSHistory: undefined;
  SOSDetail: { sosId: string; alert?: SOSAlert };

  // Incidents
  IncidentList: { filter?: string } | undefined;
  ReportIncident: { preselectedCameraId?: string } | undefined;
  IncidentDetail: { incidentId: string; incident?: Incident };

  // Billing
  PlanSelection: undefined;
  Payment: { planId: string; amount: number; subscriptionId?: string };
  SubscriptionDetail: undefined;
  InvoiceList: undefined;
  InvoiceDetail: { invoiceId: string };
  PaymentHistory: undefined;

  // Tickets
  TicketList: undefined;
  CreateTicket: undefined;
  TicketDetail: { ticketId: string; ticket?: Ticket };

  // Notifications
  Notifications: undefined;

  // Profile & Settings
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Sessions: undefined;
  NotifPreferences: undefined;
};
