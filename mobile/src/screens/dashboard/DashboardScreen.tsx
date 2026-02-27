import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { useGlucoseStore } from '../../store/glucoseStore';
import { useAuthStore } from '../../store/authStore';
import { Card, SectionHeader, Pill } from '../../components/common';
import { TIRRing, Sparkline } from '../../components/charts/TIRRing';
import { getGlucoseColor, getGlucoseLabel } from '../../theme/theme';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { Icon } from '../../components/Icon';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    latestReading, stats7, dailyAverages, readings,
    fetchLatest, fetchStats, fetchDailyAverages, fetchReadings, isLoading,
  } = useGlucoseStore();

  const loadData = useCallback(async () => {
    await Promise.all([
      fetchLatest(),
      fetchStats(7),
      fetchDailyAverages(14),
      fetchReadings(1),
    ]);
  }, []);

  useEffect(() => { loadData(); }, []);

  const glucoseColor = latestReading
    ? getGlucoseColor(latestReading.value_mmol)
    : Colors.textMuted;
  const glucoseLabel = latestReading
    ? getGlucoseLabel(latestReading.value_mmol)
    : 'No data';

  const sparklineData = dailyAverages.map((d: any) => d.avg).slice(-10);
  const readingsToday = readings.filter((r) => isToday(new Date(r.recorded_at))).length;

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.name}>{firstName}</Text>
              <Icon name="wave" size={20} color={Colors.textPrimary} style={{ marginLeft: 4 }} />
            </View>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('Log')}
          >
            <Text style={styles.addBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {/* Current Glucose Card */}
        <Card style={styles.glucoseCard} onPress={() => navigation.navigate('LogGlucose', {})}>
          <View style={styles.glucoseCardHeader}>
            <View>
              <Text style={styles.glucoseCardTitle}>Current Glucose</Text>
              {latestReading && (
                <Text style={styles.glucoseTime}>
                  Last checked {formatDistanceToNow(new Date(latestReading.recorded_at), { addSuffix: true })}
                </Text>
              )}
            </View>
            <View style={styles.todayBadge}>
              <Text style={styles.todayCount}>{readingsToday}</Text>
              <Text style={styles.todayLabel}>today</Text>
            </View>
          </View>

          <View style={styles.glucoseMain}>
            {latestReading ? (
              <>
                <View>
                  <Text style={[styles.glucoseValue, { color: glucoseColor }]}>
                    {latestReading.value_mmol.toFixed(1)}
                  </Text>
                  <Text style={[styles.glucoseUnit, { color: glucoseColor }]}>mmol/L</Text>
                </View>
                <View style={styles.glucoseRight}>
                  <Pill label={glucoseLabel} color={glucoseColor} />
                  {latestReading.trend_arrow && (
                    <Text style={[styles.trendArrow, { color: glucoseColor }]}>
                      {latestReading.trend_arrow === 'rising' ? '↗' :
                       latestReading.trend_arrow === 'falling' ? '↘' : '→'}
                    </Text>
                  )}
                  {sparklineData.length > 1 && (
                    <Sparkline data={sparklineData} color={glucoseColor} width={80} height={30} />
                  )}
                </View>
              </>
            ) : (
              <View style={styles.noReadingContainer}>
                <Text style={styles.noReading}>No readings yet</Text>
                <Text style={styles.noReadingHint}>Tap to log your first glucose reading</Text>
              </View>
            )}
          </View>
        </Card>

        {/* TIR Card */}
        {stats7 && (
          <Card style={styles.tirCard}>
            <SectionHeader
              title="Time In Range — 7 days"
              rightAction={{ label: 'Details', onPress: () => navigation.navigate('Insights') }}
            />
            <View style={styles.tirContent}>
              <TIRRing
                inRange={stats7.tir.in_range_pct}
                low={stats7.tir.below_pct}
                veryLow={stats7.tir.very_low_pct}
                high={stats7.tir.above_pct}
                veryHigh={stats7.tir.very_high_pct}
                size={120}
                strokeWidth={14}
                showLegend={false}
              />
              <View style={styles.tirStats}>
                <StatRow label="Average" value={`${stats7.average_mmol.toFixed(1)} mmol/L`} />
                <StatRow label="Est. HbA1c" value={`${stats7.estimated_hba1c}%`} />
                <StatRow label="Variability (CV)" value={`${stats7.coefficient_of_variation.toFixed(0)}%`} />
                <StatRow label="Readings" value={`${stats7.tir.reading_count}`} />
              </View>
            </View>
          </Card>
        )}

        <SectionHeader title="Quick Log" style={{ marginTop: Spacing.lg }} />
        <View style={styles.quickLogRow}>
          {[
            { icon: 'water-outline', label: 'Glucose', screen: 'Log', params: { screen: 'LogGlucose' }, color: Colors.inRange },
            { icon: 'restaurant-outline', label: 'Meals', screen: 'Log', params: { screen: 'LogMeal' }, color: Colors.chartMeal },
            { icon: 'medical-outline', label: 'Insulin', screen: 'Log', params: { screen: 'LogInsulin' }, color: Colors.chartInsulin },
            { icon: 'walk-outline', label: 'Activities', screen: 'Log', params: { screen: 'LogActivity' }, color: Colors.chartActivity },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickLogBtn}
              onPress={() => {
                // Navigate to the Log tab first, then to the specific logging screen
                navigation.getParent()?.navigate('Log');
                // Small delay to ensure the Log stack is ready
                setTimeout(() => {
                  navigation.navigate('Log', { screen: item.params.screen });
                }, 150);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name={item.icon as any} size={28} color={item.color} style={styles.quickLogIcon} />
              <Text style={styles.quickLogLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!user?.is_premium && (
          <Card style={styles.premiumCard} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.premiumContent}>
              <Icon name="sparkles" size={24} color={Colors.accent} />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Unlock AI Insights</Text>
                <Text style={styles.premiumSub}>Pattern detection, predictions, weekly reports & more</Text>
              </View>
              <Text style={styles.premiumArrow}>›</Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md },
  greeting: { color: Colors.textSecondary, fontSize: Typography.size.base },
  name: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: '800' },
  addBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: Typography.size.sm },

  glucoseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  glucoseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  glucoseCardTitle: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600' },
  glucoseTime: { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },
  todayBadge: { alignItems: 'center', backgroundColor: Colors.accentAlpha10, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 4, minWidth: 40 },
  todayCount: { color: Colors.accent, fontSize: Typography.size.lg, fontWeight: '800', lineHeight: 22 },
  todayLabel: { color: Colors.accent, fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  glucoseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  glucoseValue: { fontSize: 64, fontWeight: '800', lineHeight: 70, letterSpacing: -2 },
  glucoseUnit: { fontSize: Typography.size.md, fontWeight: '500', marginTop: -4, opacity: 0.8 },
  glucoseRight: { alignItems: 'flex-end', gap: 8 },
  trendArrow: { fontSize: 28 },
  noReadingContainer: { flex: 1 },
  noReading: { color: Colors.textSecondary, fontSize: Typography.size.lg, fontWeight: '600' },
  noReadingHint: { color: Colors.textMuted, fontSize: Typography.size.sm, marginTop: 4 },

  tirCard: { padding: Spacing.lg },
  tirContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl, marginTop: Spacing.md },
  tirStats: { flex: 1, gap: Spacing.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm },
  statValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '600' },

  quickLogRow: { flexDirection: 'row', gap: Spacing.sm },
  quickLogBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  quickLogIcon: { marginBottom: 4 },
  quickLogLabel: { color: Colors.textSecondary, fontSize: Typography.size.xs, fontWeight: '600' },

  premiumCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  premiumContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  premiumEmoji: { fontSize: 24 },
  premiumText: { flex: 1 },
  premiumTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: Typography.size.base },
  premiumSub: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: 2 },
  premiumArrow: { color: Colors.accent, fontSize: 24, fontWeight: '300' },
});
