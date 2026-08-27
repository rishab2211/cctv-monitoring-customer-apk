import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import { HugeIcon } from './HugeIcon';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <HugeIcon
              icon={AlertCircleIcon}
              size={52}
              color={COLORS.sosRed}
              style={{ marginBottom: SPACING.lg }}
            />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred. Please try again or restart the application.
            </Text>
            {__DEV__ && this.state.error ? (
              <View style={styles.debugBox}>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.button}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.sosRed,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  debugBox: {
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  debugText: {
    color: COLORS.warningAmber,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
  },
  buttonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 15,
  },
});
