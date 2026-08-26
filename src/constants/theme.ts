import { MD3DarkTheme, MD3Theme } from 'react-native-paper';

export const COLORS = {
  // Backgrounds
  background: '#0A0F1E',
  backgroundSecondary: '#0E162B',
  surface: '#151D30',
  surfaceLight: '#1E2942',
  surfaceCard: '#131B2E',
  surfaceElevated: '#1A243B',
  
  // Borders & Dividers
  border: '#222E48',
  borderLight: '#2D3D60',
  borderHighlight: '#00C6AE40',

  // Primary Accent (Teal / Cyan)
  primary: '#00C6AE',
  primaryDark: '#009688',
  primaryLight: '#33D1BE',
  primaryMuted: 'rgba(0, 198, 174, 0.15)',

  // Alert & Status Colors
  sosRed: '#FF3B30',
  sosRedDark: '#D32F2F',
  sosRedMuted: 'rgba(255, 59, 48, 0.15)',
  
  warningAmber: '#FF9F0A',
  warningAmberMuted: 'rgba(255, 159, 10, 0.15)',
  
  successGreen: '#30D158',
  successGreenMuted: 'rgba(48, 209, 88, 0.15)',
  
  infoBlue: '#0A84FF',
  infoBlueMuted: 'rgba(10, 132, 255, 0.15)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  textInverse: '#0A0F1E',

  // Overlays
  overlay: 'rgba(5, 8, 18, 0.8)',
  overlayHeavy: 'rgba(5, 8, 18, 0.92)',
  ripple: 'rgba(255, 255, 255, 0.08)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
  card: 14,
  button: 24,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    color: COLORS.textPrimary,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: COLORS.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: COLORS.textPrimary,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
    color: COLORS.textMuted,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6.27,
    elevation: 4,
  },
  glowTeal: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  glowSos: {
    shadowColor: COLORS.sosRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
};

export const paperTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.textInverse,
    primaryContainer: COLORS.primaryMuted,
    onPrimaryContainer: COLORS.primaryLight,
    secondary: COLORS.infoBlue,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceCard,
    error: COLORS.sosRed,
    outline: COLORS.border,
  },
};
