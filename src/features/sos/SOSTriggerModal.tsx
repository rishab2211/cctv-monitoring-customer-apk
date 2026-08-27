import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SirenIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../../components/HugeIcon';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SOSTrigger'>;

export const SOSTriggerModal: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <HugeIcon icon={Cancel01Icon} size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.sosIconContainer}>
          <HugeIcon icon={SirenIcon} size={48} color={COLORS.sosRed} strokeWidth={2} />
        </View>

        <Text style={styles.title}>EMERGENCY SOS</Text>
        <Text style={styles.description}>
          Hold the SOS button for 3 seconds to immediately alert the monitoring centre
          and emergency contacts.
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.sosTriggerBtn}
          onPress={() => {
            Alert.alert('SOS Triggered', 'Phase 3 Full Hold Gesture triggered.');
            navigation.goBack();
          }}
        >
          <Text style={styles.sosBtnText}>PRESS TO TEST SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0606',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: SPACING.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  sosIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.sosRedMuted,
    borderWidth: 2,
    borderColor: COLORS.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.sosRed,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.bodyMedium,
    color: '#FFCDD2',
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
    lineHeight: 22,
  },
  sosTriggerBtn: {
    backgroundColor: COLORS.sosRed,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.button,
    width: '100%',
    alignItems: 'center',
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
