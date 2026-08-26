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
  useFCMToken();
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
