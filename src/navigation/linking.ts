import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { CONFIG } from '../constants/config';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${CONFIG.APP_SCHEME}://`, 'https://app.cctvcustomer.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          TabHome: 'dashboard',
          TabCameras: 'cameras-tab',
          TabBilling: 'billing-tab',
          TabProfile: 'profile-tab',
        },
      },
      CameraList: 'cameras',
      CameraDetail: 'cameras/:cameraId',
      LiveView: 'cameras/:cameraId/live',
      RecordingPlayback: 'cameras/:cameraId/playback',
      SubscriptionDetail: 'billing/subscription',
      PlanSelection: 'billing/plans',
      InvoiceDetail: 'billing/invoices/:invoiceId',
      SOSDetail: 'sos/:sosId',
      SOSTrigger: 'sos/trigger',
      IncidentDetail: 'incidents/:incidentId',
      TicketDetail: 'tickets/:ticketId',
      Notifications: 'notifications',
    },
  },
};
