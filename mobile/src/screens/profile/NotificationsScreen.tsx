import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Button, Card } from '../../components/common';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const NOTIFICATION_GROUPS = [
  {
    title: 'GLUCOSE ALERTS',
    items: [
      {
        key: 'hypo_alert',
        icon: 'warning-outline' as const,
        iconColor: Colors.veryLow,
        label: 'Hypoglycaemia Alert',
        sub: 'Notify when glucose drops below your low target',
      },
      {
        key: 'hyper_alert',
        icon: 'trending-up-outline' as const,
        iconColor: Colors.high,
        label: 'Hyperglycaemia Alert',
        sub: 'Notify when glucose exceeds your high target',
      },
      {
        key: 'rapid_drop_alert',
        icon: 'arrow-down-outline' as const,
        iconColor: Colors.warning,
        label: 'Rapid Drop Alert',
        sub: 'Notify on fast-falling glucose trend',
      },
      {
        key: 'rapid_rise_alert',
        icon: 'arrow-up-outline' as const,
        iconColor: Colors.warning,
        label: 'Rapid Rise Alert',
        sub: 'Notify on fast-rising glucose trend',
      },
    ],
  },
  {
    title: 'LOGGING REMINDERS',
    items: [
      {
        key: 'meal_reminder',
        icon: 'restaurant-outline' as const,
        iconColor: Colors.chartMeal,
        label: 'Meal Logging Reminder',
        sub: 'Remind me to log meals at set times',
      },
      {
        key: 'glucose_reminder',
        icon: 'water-outline' as const,
        iconColor: Colors.primary,
        label: 'Glucose Check Reminder',
        sub: 'Remind me to check and log glucose',
      },
      {
        key: 'medication_reminder',
        icon: 'medkit-outline' as const,
        iconColor: Colors.accent,
        label: 'Medication Reminder',
        sub: 'Remind me to take my medications',
      },
    ],
  },
  {
    title: 'INSIGHTS & REPORTS',
    items: [
      {
        key: 'weekly_report',
        icon: 'bar-chart-outline' as const,
        iconColor: Colors.primary,
        label: 'Weekly Report',
        sub: 'Receive your weekly glucose summary',
      },
      {
        key: 'insight_alerts',
        icon: 'bulb-outline' as const,
        iconColor: Colors.accentTeal,
        label: 'AI Insights',
        sub: 'Get notified when new insights are available',
      },
    ],
  },
];

const DEFAULT_SETTINGS: Record<string, boolean> = {
  hypo_alert:        true,
  hyper_alert:       true,
  rapid_drop_alert:  true,
  rapid_rise_alert:  false,
  meal_reminder:     false,
  glucose_reminder:  false,
  medication_reminder: true,
  weekly_report:     true,
  insight_alerts:    true,
};

export default function NotificationsScreen() {
  const { user, loadUser } = useAuthStore();

  const saved = user?.profile?.notification_settings ?? {};
  const [settings, setSettings] = useState<Record<string, boolean>>({
    ...DEFAULT_SETTINGS,
    ...saved,
  });

  const [isLoading, setIsLoading] = useState(false);

  const toggle = (key: string) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await userApi.updateProfile({ notification_settings: settings });
      await loadUser();
      Alert.alert('Saved', 'Your notification preferences have been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.intro}>
          Control which alerts and reminders GlucoSense sends you.
          Critical glucose alerts are always recommended.
        </Text>

        {NOTIFICATION_GROUPS.map((group) => (
          <View key={group.title}>
            <Text style={styles.sectionLabel}>{group.title}</Text>
            <Card style={styles.groupCard}>
              {group.items.map((item, index) => (
                <View key={item.key}>
                  <View style={styles.row}>
                    <View style={[styles.iconWrap, { backgroundColor: item.iconColor + '18' }]}>
                      <Ionicons name={item.icon} size={18} color={item.iconColor} />
                    </View>
                    <View style={styles.labelWrap}>
                      <Text style={styles.label}>{item.label}</Text>
                      <Text style={styles.sub}>{item.sub}</Text>
                    </View>
                    <Switch
                      value={!!settings[item.key]}
                      onValueChange={() => toggle(item.key)}
                      trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
                      thumbColor={Colors.textInverse}
                    />
                  </View>

                  {index < group.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </Card>
          </View>
        ))}

        <Button
          label="Save Preferences"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  scroll:      { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  intro:       { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 20 },
  sectionLabel:{ color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.sm },

  groupCard:   { padding: 0, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconWrap:    { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  labelWrap:   { flex: 1 },
  label:       { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '500' },
  sub:         { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2, lineHeight: 16 },
  divider:     { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 68 },
});