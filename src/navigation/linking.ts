import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { CONFIG } from '../constants/config';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${CONFIG.APP_SCHEME}://`, 'https://app.cctvcustomer.com'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: 'login',
          SignUp: 'signup',
          ForgotPassword: 'forgot-password',
          OTPVerification: 'verify-otp',
          ResetPassword: 'reset-password/:resetToken',
        },
      },
      MainTabs: {
        screens: {
          TabHome: 'dashboard',
          TabCameras: 'cameras-tab',
          TabBilling: 'billing/subscription',
          TabProfile: 'profile-tab',
        },
      },
      CameraList: 'cameras',
      CameraDetail: 'cameras/:cameraId',
      LiveView: 'cameras/:cameraId/live',
      RecordingPlayback: 'cameras/:cameraId/playback',
      ShareCamera: 'cameras/:cameraId/share',
      PlanSelection: 'billing/plans',
      Payment: 'billing/payment',
      InvoiceList: 'billing/invoices',
      InvoiceDetail: 'billing/invoices/:invoiceId',
      PaymentHistory: 'billing/payments',
      SOSDetail: 'sos/:sosId',
      SOSHistory: 'sos/history',
      SOSTrigger: 'sos/trigger',
      IncidentList: 'incidents',
      IncidentDetail: 'incidents/:incidentId',
      ReportIncident: 'incidents/report',
      TicketList: 'tickets',
      TicketDetail: 'tickets/:ticketId',
      CreateTicket: 'tickets/create',
      Notifications: 'notifications',
      NotifPreferences: 'settings/preferences',
      EditProfile: 'profile/edit',
      ChangePassword: 'profile/change-password',
      Sessions: 'profile/sessions',
      About: 'about',
    },
  },
};
