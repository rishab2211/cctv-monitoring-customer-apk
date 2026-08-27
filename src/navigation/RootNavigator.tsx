import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { CameraListScreen } from '../features/cameras/CameraListScreen';
import { CameraDetailScreen } from '../features/cameras/CameraDetailScreen';
import { LiveViewScreen } from '../features/cameras/LiveViewScreen';
import { RecordingPlaybackScreen } from '../features/cameras/RecordingPlaybackScreen';
import { ShareCameraScreen } from '../features/cameras/ShareCameraScreen';
import { SOSTriggerModal } from '../features/sos/SOSTriggerModal';
import { SOSHistoryScreen } from '../features/sos/SOSHistoryScreen';
import { SOSDetailScreen } from '../features/sos/SOSDetailScreen';
import { IncidentListScreen } from '../features/incidents/IncidentListScreen';
import { IncidentDetailScreen } from '../features/incidents/IncidentDetailScreen';
import { ReportIncidentScreen } from '../features/incidents/ReportIncidentScreen';
import { PlanSelectionScreen } from '../features/billing/PlanSelectionScreen';
import { PaymentScreen } from '../features/billing/PaymentScreen';
import { InvoiceListScreen } from '../features/billing/InvoiceListScreen';
import { InvoiceDetailScreen } from '../features/billing/InvoiceDetailScreen';
import { PaymentHistoryScreen } from '../features/billing/PaymentHistoryScreen';
import { TicketListScreen } from '../features/tickets/TicketListScreen';
import { TicketDetailScreen } from '../features/tickets/TicketDetailScreen';
import { CreateTicketScreen } from '../features/tickets/CreateTicketScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { NotificationPreferencesScreen } from '../features/notifications/NotificationPreferencesScreen';
import { EditProfileScreen } from '../features/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../features/profile/ChangePasswordScreen';
import { SessionsScreen } from '../features/profile/SessionsScreen';
import { AboutScreen } from '../features/profile/AboutScreen';
import { linking } from './linking';
import { useAppSelector } from '../hooks/redux';
import { SOSFab } from '../components/SOSFab';
import { useSocket } from '../hooks/useSocket';
import { useFCMToken } from '../hooks/useFCMToken';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Background services on authenticated session
  useSocket();
  useFCMToken(navigationRef);
  useInactivityTimer();

  const handleSOSPress = () => {
    navigationRef.current?.navigate('SOSTrigger');
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="AuthStack"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />

            {/* Cameras Module Screens */}
            <Stack.Screen
              name="CameraList"
              component={CameraListScreen}
              options={{ title: 'Camera Feeds' }}
            />
            <Stack.Screen
              name="CameraDetail"
              component={CameraDetailScreen}
              options={{ title: 'Camera Details' }}
            />
            <Stack.Screen
              name="LiveView"
              component={LiveViewScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RecordingPlayback"
              component={RecordingPlaybackScreen}
              options={{ title: 'Cloud Playback' }}
            />
            <Stack.Screen
              name="ShareCamera"
              component={ShareCameraScreen}
              options={{ title: 'Share Camera' }}
            />

            {/* SOS Module Screens */}
            <Stack.Screen
              name="SOSHistory"
              component={SOSHistoryScreen}
              options={{ title: 'Emergency History' }}
            />
            <Stack.Screen
              name="SOSDetail"
              component={SOSDetailScreen}
              options={{ title: 'SOS Incident Details' }}
            />

            {/* Incident Module Screens */}
            <Stack.Screen
              name="IncidentList"
              component={IncidentListScreen}
              options={{ title: 'Incident Reports' }}
            />
            <Stack.Screen
              name="ReportIncident"
              component={ReportIncidentScreen}
              options={{ title: 'Report Incident' }}
            />
            <Stack.Screen
              name="IncidentDetail"
              component={IncidentDetailScreen}
              options={{ title: 'Incident Details' }}
            />

            {/* Billing Module Screens */}
            <Stack.Screen
              name="PlanSelection"
              component={PlanSelectionScreen}
              options={{ title: 'Select Plan' }}
            />
            <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ title: 'Checkout & Payment' }}
            />
            <Stack.Screen
              name="InvoiceList"
              component={InvoiceListScreen}
              options={{ title: 'Invoices' }}
            />
            <Stack.Screen
              name="InvoiceDetail"
              component={InvoiceDetailScreen}
              options={{ title: 'Invoice Details' }}
            />
            <Stack.Screen
              name="PaymentHistory"
              component={PaymentHistoryScreen}
              options={{ title: 'Payment History' }}
            />

            {/* Support Tickets Module Screens */}
            <Stack.Screen
              name="TicketList"
              component={TicketListScreen}
              options={{ title: 'Support Tickets' }}
            />
            <Stack.Screen
              name="CreateTicket"
              component={CreateTicketScreen}
              options={{ title: 'Open Ticket' }}
            />
            <Stack.Screen
              name="TicketDetail"
              component={TicketDetailScreen}
              options={{ title: 'Ticket Conversation' }}
            />

            {/* Notifications Module Screens */}
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notification Centre' }}
            />
            <Stack.Screen
              name="NotifPreferences"
              component={NotificationPreferencesScreen}
              options={{ title: 'Notification Preferences' }}
            />

            {/* Profile & Settings Screens */}
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ title: 'Change Password' }}
            />
            <Stack.Screen
              name="Sessions"
              component={SessionsScreen}
              options={{ title: 'Active Sessions' }}
            />
            <Stack.Screen
              name="About"
              component={AboutScreen}
              options={{ title: 'About & Legal' }}
            />

            {/* Full-Screen Modals */}
            <Stack.Group screenOptions={{ presentation: 'fullScreenModal', headerShown: false }}>
              <Stack.Screen name="SOSTrigger" component={SOSTriggerModal} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>

      {/* Persistent SOS Floating Button for authenticated users */}
      {isAuthenticated && <SOSFab onPress={handleSOSPress} />}
    </NavigationContainer>
  );
};
