import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ViewStyle } from 'react-native';
import { Folder01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon, IconSvgElement } from './HugeIcon';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface EmptyStateProps {
  icon?: IconSvgElement;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = Folder01Icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <HugeIcon
        icon={icon}
        size={48}
        color={COLORS.textMuted}
        style={{ marginBottom: SPACING.md }}
      />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.button}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h3,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.bodyMedium,
    textAlign: 'center',
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.button,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
});
