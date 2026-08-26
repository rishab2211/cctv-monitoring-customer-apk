import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export type StatusType =
  | 'online'
  | 'offline'
  | 'maintenance'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'pending_payment'
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'closed'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  style?: ViewStyle;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  style,
  size = 'medium',
}) => {
  const normalizedStatus = (status || '').toLowerCase();

  let backgroundColor = 'rgba(255, 255, 255, 0.08)';
  let textColor = COLORS.textSecondary;
  let dotColor = COLORS.textMuted;

  switch (normalizedStatus) {
    case 'online':
    case 'active':
    case 'resolved':
    case 'low':
      backgroundColor = COLORS.successGreenMuted;
      textColor = COLORS.successGreen;
      dotColor = COLORS.successGreen;
      break;

    case 'past_due':
    case 'investigating':
    case 'medium':
    case 'in_progress':
      backgroundColor = COLORS.warningAmberMuted;
      textColor = COLORS.warningAmber;
      dotColor = COLORS.warningAmber;
      break;

    case 'offline':
    case 'canceled':
    case 'critical':
    case 'high':
      backgroundColor = COLORS.sosRedMuted;
      textColor = COLORS.sosRed;
      dotColor = COLORS.sosRed;
      break;

    case 'maintenance':
    case 'open':
    case 'pending_payment':
      backgroundColor = COLORS.infoBlueMuted;
      textColor = COLORS.infoBlue;
      dotColor = COLORS.infoBlue;
      break;

    default:
      backgroundColor = 'rgba(255, 255, 255, 0.08)';
      textColor = COLORS.textSecondary;
      dotColor = COLORS.textMuted;
      break;
  }

  const displayText =
    label || normalizedStatus.replace(/_/g, ' ').toUpperCase();

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        isSmall && styles.containerSmall,
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }, isSmall && styles.dotSmall]} />
      <Text
        style={[
          styles.text,
          { color: textColor },
          isSmall && styles.textSmall,
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
});
