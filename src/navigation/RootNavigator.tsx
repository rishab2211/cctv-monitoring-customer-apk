import React, { useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { SOSTriggerModal } from '../features/sos/SOSTriggerModal';
import { linking } from './linking';
import { useAppSelector } from '../hooks/redux';
import { SOSFab } from '../components/SOSFab';
import { useSocket } from '../hooks/useSocket';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Initialize background real-time socket events when authenticated
  useSocket();

  const handleSOSPress = () => {
    navigationRef.current?.navigate('SOSTrigger');
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="AuthStack" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Group screenOptions={{ presentation: 'fullScreenModal' }}>
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
