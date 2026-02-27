import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, getGlucoseColor, getGlucoseLabel } from '../../theme/theme';
import { Card, EmptyState } from '../../components/common';
import { glucoseApi } from '../../services/api';
import { format, isToday, isYesterday } from 'date-fns';
import type { InsightsStackParamList } from '../../navigation/AppNavigator';

type GlucoseHistoryRouteProp = RouteProp<InsightsStackParamList, 'GlucoseHistory'>;

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM dd');
}

const TAG_LABELS: Record<string, string> = {
  fasting: 'Fasting',
  pre_meal: 'Pre-meal',
  post_meal: 'Post-meal',
  bedtime: 'Bedtime',
  exercise: 'Exercise',
  sick: 'Sick',
};

export default function GlucoseHistoryScreen() {
  const route = useRoute<GlucoseHistoryRouteProp>();
  const { period } = route.params;
  const [readings, setReadings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await glucoseApi.list(period);
      setReadings(data.readings ?? data);
    } catch (error) {
      console.error('Error loading glucose history:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [period]);

  const sections = useMemo(() => {
    const map = new Map<string, any[]>();
    readings.forEach((r) => {
      const day = format(new Date(r.recorded_at), 'yyyy-MM-dd');
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(r);
    });
    return Array.from(map.entries()).map(([day, items]) => {
      const avg = items.reduce((s, r) => s + r.value_mmol, 0) / items.length;
      return {
        title: formatDayHeader(day + 'T00:00:00'),
        subtitle: `${items.length} reading${items.length !== 1 ? 's' : ''} · Avg ${avg.toFixed(1)} mmol/L`,
        data: items,
      };
    });
  }, [readings]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SectionList
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={Colors.accent} />}
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="glucose"
              title="No glucose readings"
              subtitle={`No readings found in the last ${period} days.`}
            />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
          </View>
        )}
        renderItem={({ item: reading }) => (
          <Card style={styles.readingCard}>
            <View style={styles.readingRow}>
              <View style={styles.readingLeft}>
                <Text style={[styles.readingValue, { color: getGlucoseColor(reading.value_mmol) }]}>
                  {reading.value_mmol.toFixed(1)}
                  <Text style={styles.readingUnit}> mmol/L</Text>
                </Text>
                <Text style={styles.readingTime}>
                  {format(new Date(reading.recorded_at), 'HH:mm')}
                </Text>
              </View>
              <View style={styles.readingRight}>
                <View style={[styles.labelBadge, { backgroundColor: getGlucoseColor(reading.value_mmol) + '20' }]}>
                  <Text style={[styles.labelText, { color: getGlucoseColor(reading.value_mmol) }]}>
                    {getGlucoseLabel(reading.value_mmol)}
                  </Text>
                </View>
                {reading.tag && (
                  <Text style={styles.tagText}>{TAG_LABELS[reading.tag] ?? reading.tag}</Text>
                )}
              </View>
            </View>
            {reading.notes ? (
              <Text style={styles.readingNotes}>{reading.notes}</Text>
            ) : null}
          </Card>
        )}
        stickySectionHeadersEnabled
        ListHeaderComponent={<Text style={styles.title}>Glucose — {period} days</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.size['2xl'],
    fontWeight: '800',
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    marginTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  readingCard: { padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.xs },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readingLeft: { gap: 2 },
  readingRight: { alignItems: 'flex-end', gap: 4 },
  readingValue: { fontSize: Typography.size.xl, fontWeight: '800' },
  readingUnit: { fontSize: Typography.size.sm, fontWeight: '400', color: Colors.textMuted },
  readingTime: { color: Colors.textMuted, fontSize: Typography.size.sm },
  labelBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  labelText: { fontSize: Typography.size.xs, fontWeight: '700' },
  tagText: { color: Colors.textMuted, fontSize: Typography.size.xs },
  readingNotes: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontStyle: 'italic', marginTop: 2 },
});
