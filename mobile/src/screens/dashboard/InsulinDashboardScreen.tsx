import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card, SectionHeader, Pill } from '../../components/common';
import { insulinApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { format, formatDistanceToNow } from 'date-fns';

interface InsulinDose {
  id: number;
  dose_type: string;
  units: number;
  notes?: string;
  administered_at: string;
  glucose_before?: number;
  glucose_after?: number;
  meal_id?: number;
  meal_name?: string;
}

interface InsulinStats {
  totalDoses: number;
  totalUnits: number;
  avgUnits: number;
  dosesByType: Record<string, number>;
  dosesWithGlucose: number;
}

export default function InsulinDashboardScreen() {
  const navigation = useNavigation<any>();
  const [doses, setDoses] = useState<InsulinDose[]>([]);
  const [stats, setStats] = useState<InsulinStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await insulinApi.list(7);
      setDoses(response.data);
      
      // Calculate stats
      const totalDoses = response.data.length;
      const totalUnits = response.data.reduce((sum: number, dose: InsulinDose) => sum + dose.units, 0);
      const avgUnits = totalDoses > 0 ? totalUnits / totalDoses : 0;
      
      const dosesByType = response.data.reduce((acc: Record<string, number>, dose: InsulinDose) => {
        acc[dose.dose_type] = (acc[dose.dose_type] || 0) + 1;
        return acc;
      }, {});

      const dosesWithGlucose = response.data.filter((dose: InsulinDose) => dose.glucose_before).length;

      setStats({
        totalDoses,
        totalUnits: Math.round(totalUnits * 10) / 10,
        avgUnits: Math.round(avgUnits * 10) / 10,
        dosesByType,
        dosesWithGlucose,
      });
    } catch (error) {
      console.error('Failed to load insulin doses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const getDoseTypeIcon = (type: string) => {
    if (!type) return 'care';
    switch (type) {
      case 'basal': return 'pre-meal';
      case 'bolus': return 'fasting';
      case 'correction': return 'target';
      default: return 'care';
    }
  };

  const getDoseTypeLabel = (type: string) => {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getDoseTypeColor = (type: string) => {
    if (!type) return Colors.textSecondary;
    switch (type) {
      case 'basal': return Colors.chartInsulin;
      case 'bolus': return Colors.chartMeal;
      case 'correction': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const renderDoseItem = ({ item }: { item: InsulinDose }) => (
    <Card style={styles.doseCard}>
      <View style={styles.doseHeader}>
        <View style={styles.doseTitleRow}>
          <Icon name={getDoseTypeIcon(item.dose_type)} size={20} color={getDoseTypeColor(item.dose_type)} />
          <Text style={styles.doseName}>{getDoseTypeLabel(item.dose_type)} Dose</Text>
        </View>
        <Pill label={`${item.units} units`} color={getDoseTypeColor(item.dose_type)} />
      </View>
      
      {item.meal_name && (
        <View style={styles.mealInfo}>
          <Icon name="meal" size={16} color={Colors.textMuted} />
          <Text style={styles.mealName}>{item.meal_name}</Text>
        </View>
      )}

      {(item.glucose_before || item.glucose_after) && (
        <View style={styles.glucoseInfo}>
          {item.glucose_before && (
            <View style={styles.glucoseReading}>
              <Text style={styles.glucoseLabel}>Before:</Text>
              <Text style={styles.glucoseValue}>{item.glucose_before} mmol/L</Text>
            </View>
          )}
          {item.glucose_after && (
            <View style={styles.glucoseReading}>
              <Text style={styles.glucoseLabel}>After:</Text>
              <Text style={styles.glucoseValue}>{item.glucose_after} mmol/L</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.doseTime}>
        {formatDistanceToNow(new Date(item.administered_at), { addSuffix: true })}
      </Text>
      
      {item.notes && (
        <Text style={styles.doseNotes}>{item.notes}</Text>
      )}
    </Card>
  );

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
          <Text style={styles.title}>Insulin Dashboard</Text>
          <TouchableOpacity
            style={styles.logBtn}
            onPress={() => navigation.navigate('Log', { screen: 'LogInsulin' })}
          >
            <Icon name="add" size={16} color={Colors.textInverse} />
            <Text style={styles.logBtnText}>Log Dose</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <>
            <Card style={styles.statsCard}>
              <SectionHeader title="7-Day Overview" />
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalDoses}</Text>
                  <Text style={styles.statDescription}>Total Doses</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalUnits}</Text>
                  <Text style={styles.statDescription}>Total Units</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Averages" />
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.avgUnits}</Text>
                  <Text style={styles.statDescription}>Avg Units/Dose</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.dosesWithGlucose}</Text>
                  <Text style={styles.statDescription}>With Glucose</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Doses by Type" />
              <View style={styles.typeStats}>
                {Object.entries(stats.dosesByType).map(([type, count]) => (
                  <View key={type} style={styles.typeStatRow}>
                    <Icon name={getDoseTypeIcon(type)} size={16} color={getDoseTypeColor(type)} />
                    <Text style={styles.typeStatLabel}>{getDoseTypeLabel(type)}</Text>
                    <Text style={styles.typeStatValue}>{count}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Recent Doses */}
        <SectionHeader title="Recent Doses" />
        <FlatList
          data={doses}
          renderItem={renderDoseItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.dosesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="care" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No insulin doses logged</Text>
              <Text style={styles.emptySubtitle}>Start logging your insulin to see insights</Text>
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

  typeStats: { marginTop: Spacing.md, gap: Spacing.sm },
  typeStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  typeStatLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, flex: 1, marginLeft: Spacing.sm },
  typeStatValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '600' },

  dosesList: { gap: Spacing.sm },
  doseCard: { padding: Spacing.md },
  doseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  doseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  doseName: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600', flex: 1 },
  
  mealInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs },
  mealName: { color: Colors.textSecondary, fontSize: Typography.size.sm },

  glucoseInfo: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.xs },
  glucoseReading: { alignItems: 'center' },
  glucoseLabel: { color: Colors.textMuted, fontSize: Typography.size.xs },
  glucoseValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '600' },
  
  doseTime: { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: Spacing.sm },
  doseNotes: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: Spacing.xs, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { color: Colors.textSecondary, fontSize: Typography.size.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.size.sm, textAlign: 'center' },
});
