import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card, SectionHeader, Pill } from '../../components/common';
import { glucoseApi } from '../../services/api';
import { Icon, IconName } from '../../components/Icon';
import { getGlucoseColor, getGlucoseLabel } from '../../theme/theme';
import { format, formatDistanceToNow } from 'date-fns';

interface GlucoseReading {
  id: number;
  value_mmol: number;
  trend_arrow?: string;
  notes?: string;
  recorded_at: string;
}

interface GlucoseStats {
  totalReadings: number;
  average: number;
  highest: number;
  lowest: number;
  inRange: number;
  aboveRange: number;
  belowRange: number;
}

export default function GlucoseDashboardScreen() {
  const navigation = useNavigation<any>();
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [stats, setStats] = useState<GlucoseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await glucoseApi.list(7);
      setReadings(response.data);
      
      if (response.data.length > 0) {
        const values = response.data.map((r: GlucoseReading) => r.value_mmol);
        const totalReadings = response.data.length;
        const average = values.reduce((sum: number, val: number) => sum + val, 0) / totalReadings;
        const highest = Math.max(...values);
        const lowest = Math.min(...values);
        
        // Count ranges (assuming standard ranges: <3.9 low, 3.9-10 in range, >10 high)
        const inRange = values.filter((v: number) => v >= 3.9 && v <= 10).length;
        const aboveRange = values.filter((v: number) => v > 10).length;
        const belowRange = values.filter((v: number) => v < 3.9).length;

        setStats({
          totalReadings,
          average: Math.round(average * 10) / 10,
          highest: Math.round(highest * 10) / 10,
          lowest: Math.round(lowest * 10) / 10,
          inRange,
          aboveRange,
          belowRange,
        });
      }
    } catch (error) {
      console.error('Failed to load glucose readings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const getTrendIcon = (trend?: string): IconName | null => {
    switch (trend) {
      case 'rising': return 'target';
      case 'falling': return 'target';
      case 'stable': return 'check';
      default: return null;
    }
  };

  const renderReadingItem = ({ item }: { item: GlucoseReading }) => {
    const glucoseColor = getGlucoseColor(item.value_mmol);
    const glucoseLabel = getGlucoseLabel(item.value_mmol);

    return (
      <Card style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <View style={styles.readingValueRow}>
            <Text style={[styles.readingValue, { color: glucoseColor }]}>
              {item.value_mmol.toFixed(1)}
            </Text>
            <Text style={[styles.readingUnit, { color: glucoseColor }]}>mmol/L</Text>
          </View>
          <Pill label={glucoseLabel} color={glucoseColor} />
        </View>
        
        <View style={styles.readingDetails}>
          {item.trend_arrow && getTrendIcon(item.trend_arrow) && (
            <View style={styles.trendRow}>
              <Icon name={getTrendIcon(item.trend_arrow)!} size={16} color={glucoseColor} />
              <Text style={[styles.trendText, { color: glucoseColor }]}>
                {item.trend_arrow.charAt(0).toUpperCase() + item.trend_arrow.slice(1)}
              </Text>
            </View>
          )}
          
          <Text style={styles.readingTime}>
            {formatDistanceToNow(new Date(item.recorded_at), { addSuffix: true })}
          </Text>
        </View>
        
        {item.notes && (
          <Text style={styles.readingNotes}>{item.notes}</Text>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Glucose Dashboard</Text>
          <TouchableOpacity
            style={styles.logBtn}
            onPress={() => navigation.navigate('Log', { screen: 'LogGlucose' })}
          >
            <Icon name="add" size={16} color={Colors.textInverse} />
            <Text style={styles.logBtnText}>Log Reading</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <>
            <Card style={styles.statsCard}>
              <SectionHeader title="7-Day Overview" />
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalReadings}</Text>
                  <Text style={styles.statDescription}>Total Readings</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.average}</Text>
                  <Text style={styles.statDescription}>Average (mmol/L)</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Range Analysis" />
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: Colors.success }]}>
                    {stats.highest}
                  </Text>
                  <Text style={styles.statDescription}>Highest</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: Colors.error }]}>
                    {stats.lowest}
                  </Text>
                  <Text style={styles.statDescription}>Lowest</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Time In Range" />
              <View style={styles.rangeStats}>
                <View style={styles.rangeRow}>
                  <View style={[styles.rangeDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.rangeLabel}>In Range (3.9-10)</Text>
                  <Text style={styles.rangeValue}>{stats.inRange} ({Math.round(stats.inRange / stats.totalReadings * 100)}%)</Text>
                </View>
                <View style={styles.rangeRow}>
                  <View style={[styles.rangeDot, { backgroundColor: Colors.error }]} />
                  <Text style={styles.rangeLabel}>Above Range (&gt;10)</Text>
                  <Text style={styles.rangeValue}>{stats.aboveRange} ({Math.round(stats.aboveRange / stats.totalReadings * 100)}%)</Text>
                </View>
                <View style={styles.rangeRow}>
                  <View style={[styles.rangeDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.rangeLabel}>Below Range (&lt;3.9)</Text>
                  <Text style={styles.rangeValue}>{stats.belowRange} ({Math.round(stats.belowRange / stats.totalReadings * 100)}%)</Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Recent Readings */}
        <SectionHeader title="Recent Readings" />
        <FlatList
          data={readings}
          renderItem={renderReadingItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.readingsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="glucose" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No glucose readings</Text>
              <Text style={styles.emptySubtitle}>Start logging your glucose to see insights</Text>
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.md },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: '800' },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  logBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: Typography.size.sm },

  statsCard: { padding: Spacing.lg },
  statsGrid: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.sm },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: '800' },
  statDescription: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: 2 },

  rangeStats: { marginTop: Spacing.md, gap: Spacing.sm },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  rangeDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  rangeLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, flex: 1, marginLeft: Spacing.sm },
  rangeValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '600' },

  readingsList: { gap: Spacing.sm },
  readingCard: { padding: Spacing.md },
  readingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  readingValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  readingValue: { fontSize: Typography.size.xl, fontWeight: '800' },
  readingUnit: { fontSize: Typography.size.sm, fontWeight: '500' },
  
  readingDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.xs },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: Typography.size.sm, fontWeight: '600' },
  readingTime: { color: Colors.textMuted, fontSize: Typography.size.xs },
  
  readingNotes: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: Spacing.xs, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { color: Colors.textSecondary, fontSize: Typography.size.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.size.sm, textAlign: 'center' },
});
