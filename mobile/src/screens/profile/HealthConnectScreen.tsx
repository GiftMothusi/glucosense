import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Button, Card } from '../../components/common';
import { useGlucoseStore } from '../../store/glucoseStore';
import {
  checkHealthConnectAvailability,
  requestHealthConnectPermissions,
} from '../../services/healthConnectService';

const SUPPORTED_METERS = [
  { icon: 'fitness-outline' as const, label: 'Accu-Chek Connect' },
  { icon: 'fitness-outline' as const, label: 'OneTouch Reveal' },
  { icon: 'fitness-outline' as const, label: 'Contour Diabetes' },
  { icon: 'phone-portrait-outline' as const, label: 'Samsung Health' },
  { icon: 'pulse-outline' as const, label: 'Dexcom' },
  { icon: 'medical-outline' as const, label: 'FreeStyle LibreLink' },
];

export default function HealthConnectScreen() {
  const {
    syncStatus,
    lastSyncedAt,
    healthConnectEnabled,
    setHealthConnectEnabled,
    triggerHealthConnectSync,
  } = useGlucoseStore();

  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (value: boolean) => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      if (value) {
        const available = await checkHealthConnectAvailability();
        if (!available) {
          Alert.alert(
            'Not Available',
            'Health Connect is not available on this device. Please install the Health Connect app from the Play Store.',
          );
          return;
        }
        const permitted = await requestHealthConnectPermissions();
        if (!permitted) {
          Alert.alert(
            'Permission Denied',
            'Blood glucose read permission was not granted. Please allow it in Health Connect settings.',
          );
          return;
        }
        setHealthConnectEnabled(true);
        await triggerHealthConnectSync(30);
      } else {
        setHealthConnectEnabled(false);
      }
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusDotColor = () => {
    if (syncStatus === 'error') return Colors.error;
    if (healthConnectEnabled && syncStatus !== 'unavailable') return Colors.inRange;
    return Colors.textMuted;
  };

  const getStatusText = () => {
    if (syncStatus === 'unavailable') return 'Not Available on this device';
    if (syncStatus === 'error') return 'Sync error — tap Sync Now to retry';
    if (healthConnectEnabled) return 'Connected';
    return 'Not Connected';
  };

  const isSyncing = syncStatus === 'syncing';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.intro}>
          Health Connect lets GlucoSense automatically import glucose readings
          from your meter companion apps.
        </Text>

        {/* Status card */}
        <Text style={styles.sectionLabel}>STATUS</Text>
        <Card style={styles.statusCard}>
          <View style={[styles.statusDot, { backgroundColor: getStatusDotColor() }]} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
            {lastSyncedAt && (
              <Text style={styles.lastSynced}>
                Last synced{' '}
                {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
              </Text>
            )}
          </View>
        </Card>

        {/* Main toggle */}
        <Text style={styles.sectionLabel}>SYNC SETTINGS</Text>
        <Card style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Auto-sync from Health Connect</Text>
            <Text style={styles.toggleSub}>
              Automatically imports glucose readings from Accu-Chek, OneTouch,
              Contour and other meter apps
            </Text>
          </View>
          <Switch
            value={healthConnectEnabled}
            onValueChange={handleToggle}
            disabled={isToggling || isSyncing}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
            thumbColor={Colors.textInverse}
          />
        </Card>

        {/* Error notice */}
        {syncStatus === 'error' && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>
              Last sync failed. Check your permissions in Health Connect settings.
            </Text>
          </View>
        )}

        {/* Sync Now button */}
        <Button
          label={isSyncing ? 'Syncing…' : 'Sync Now'}
          onPress={() => triggerHealthConnectSync(7)}
          loading={isSyncing}
          disabled={!healthConnectEnabled || isSyncing}
          fullWidth
          style={{ marginTop: Spacing.sm }}
        />

        {/* Supported meters */}
        <Text style={styles.sectionLabel}>SUPPORTED APPS</Text>
        <Card style={styles.metersCard}>
          {SUPPORTED_METERS.map((meter, index) => (
            <View key={meter.label}>
              <View style={styles.meterRow}>
                <View style={styles.meterIconWrap}>
                  <Ionicons name={meter.icon} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.meterLabel}>{meter.label}</Text>
              </View>
              {index < SUPPORTED_METERS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.meterNote}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.meterNoteText}>
              Any app that syncs to Health Connect is supported
            </Text>
          </View>
        </Card>

        {/* What is Health Connect */}
        <TouchableOpacity
          style={styles.learnMore}
          onPress={() =>
            Alert.alert(
              'What is Health Connect?',
              "Health Connect is Google's health data platform for Android. It acts as a secure hub where compatible apps — including glucose meter apps — store and share health data. GlucoSense reads your blood glucose records from Health Connect so you don't have to log them manually.\n\nYour data never leaves your device without your permission.",
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.learnMoreText}>What is Health Connect?</Text>
          <Text style={styles.learnMoreArrow}>›</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  intro:         { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 20 },

  sectionLabel:  { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.sm },

  statusCard:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusDot:     { width: 12, height: 12, borderRadius: 6 },
  statusInfo:    { flex: 1 },
  statusText:    { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600' },
  lastSynced:    { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },

  toggleCard:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  toggleInfo:    { flex: 1 },
  toggleLabel:   { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600' },
  toggleSub:     { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 4, lineHeight: 16 },

  errorBanner:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.errorAlpha10, borderRadius: BorderRadius.md, padding: Spacing.md },
  errorText:     { flex: 1, color: Colors.error, fontSize: Typography.size.sm, lineHeight: 18 },

  metersCard:    { padding: 0, overflow: 'hidden' },
  meterRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  meterIconWrap: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryAlpha10, alignItems: 'center', justifyContent: 'center' },
  meterLabel:    { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '500' },
  divider:       { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: Spacing.base },
  meterNote:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base },
  meterNoteText: { flex: 1, color: Colors.textMuted, fontSize: Typography.size.xs, lineHeight: 16 },

  learnMore:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.base, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.surfaceBorder, ...Shadows.sm },
  learnMoreText: { flex: 1, color: Colors.primary, fontSize: Typography.size.base, fontWeight: '500' },
  learnMoreArrow:{ color: Colors.textMuted, fontSize: 20 },
});
