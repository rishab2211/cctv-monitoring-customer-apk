import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home01Icon,
  CctvCameraIcon,
  CreditCardIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../components/HugeIcon';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { CameraListScreen } from '../features/cameras/CameraListScreen';
import { BillingScreen } from '../features/billing/BillingScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeTabBarIcon = ({ color }: { color: string }) => (
  <HugeIcon icon={Home01Icon} size={22} color={color} strokeWidth={1.8} />
);

const CamerasTabBarIcon = ({ color }: { color: string }) => (
  <HugeIcon icon={CctvCameraIcon} size={22} color={color} strokeWidth={1.8} />
);

const BillingTabBarIcon = ({ color }: { color: string }) => (
  <HugeIcon icon={CreditCardIcon} size={22} color={color} strokeWidth={1.8} />
);

const ProfileTabBarIcon = ({ color }: { color: string }) => (
  <HugeIcon icon={UserIcon} size={22} color={color} strokeWidth={1.8} />
);

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: COLORS.surfaceCard,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="TabHome"
        component={DashboardScreen}
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: HomeTabBarIcon,
        }}
      />
      <Tab.Screen
        name="TabCameras"
        component={CameraListScreen}
        options={{
          title: 'Cameras',
          headerShown: false,
          tabBarIcon: CamerasTabBarIcon,
        }}
      />
      <Tab.Screen
        name="TabBilling"
        component={BillingScreen}
        options={{
          title: 'Billing',
          headerShown: false,
          tabBarIcon: BillingTabBarIcon,
        }}
      />
      <Tab.Screen
        name="TabProfile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ProfileTabBarIcon,
        }}
      />
    </Tab.Navigator>
  );
};

