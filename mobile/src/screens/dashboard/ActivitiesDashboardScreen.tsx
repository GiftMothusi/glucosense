import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card, SectionHeader, Pill } from '../../components/common';
import { activityApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { format, formatDistanceToNow } from 'date-fns';

interface Activity {
  id: number;
  activity_type: string;
  duration_minutes: number;
  intensity: string;
  notes?: string;
  started_at: string;
}

interface ActivityStats {
  totalActivities: number;
  totalDuration: number;
  avgDuration: number;
  activitiesByType: Record<string, number>;
  activitiesByIntensity: Record<string, number>;
}

export default function ActivitiesDashboardScreen() {
  const navigation = useNavigation<any>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await activityApi.list(7);
      setActivities(response.data);
      
      // Calculate stats
      const totalActivities = response.data.length;
      const totalDuration = response.data.reduce((sum: number, activity: Activity) => sum + activity.duration_minutes, 0);
      const avgDuration = totalActivities > 0 ? totalDuration / totalActivities : 0;
      
      const activitiesByType = response.data.reduce((acc: Record<string, number>, activity: Activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {});

      const activitiesByIntensity = response.data.reduce((acc: Record<string, number>, activity: Activity) => {
        acc[activity.intensity] = (acc[activity.intensity] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalActivities,
        totalDuration,
        avgDuration: Math.round(avgDuration),
        activitiesByType,
        activitiesByIntensity,
      });
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'walking': return 'activity';
      case 'running': return 'activity';
      case 'cycling': return 'activity';
      case 'swimming': return 'glucose';
      case 'gym': return 'exercise';
      case 'yoga': return 'person';
      case 'sports': return 'activity';
      default: return 'activity';
    }
  };

  const getActivityLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return Colors.success;
      case 'moderate': return Colors.warning;
      case 'high': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <Card style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityTitleRow}>
          <Icon name={getActivityIcon(item.activity_type)} size={20} color={Colors.chartActivity} />
          <Text style={styles.activityName}>{getActivityLabel(item.activity_type)}</Text>
        </View>
        <Pill label={item.intensity} color={getIntensityColor(item.intensity)} />
      </View>
      
      <View style={styles.activityStats}>
        <View style={styles.statItem}>
          <Icon name="pre-meal" size={16} color={Colors.textMuted} />
          <Text style={styles.statValue}>{formatDuration(item.duration_minutes)}</Text>
        </View>
      </View>

      <Text style={styles.activityTime}>
        {formatDistanceToNow(new Date(item.started_at), { addSuffix: true })}
      </Text>
      
      {item.notes && (
        <Text style={styles.activityNotes}>{item.notes}</Text>
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
          <Text style={styles.title}>Activities Dashboard</Text>
          <TouchableOpacity
            style={styles.logBtn}
            onPress={() => navigation.navigate('Log', { screen: 'LogActivity' })}
          >
            <Icon name="add" size={16} color={Colors.textInverse} />
            <Text style={styles.logBtnText}>Log Activity</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <>
            <Card style={styles.statsCard}>
              <SectionHeader title="7-Day Overview" />
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalActivities}</Text>
                  <Text style={styles.statDescription}>Activities</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{formatDuration(stats.totalDuration)}</Text>
                  <Text style={styles.statDescription}>Total Time</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Activity Types" />
              <View style={styles.typeStats}>
                {Object.entries(stats.activitiesByType).map(([type, count]) => (
                  <View key={type} style={styles.typeStatRow}>
                    <Icon name={getActivityIcon(type)} size={16} color={Colors.chartActivity} />
                    <Text style={styles.typeStatLabel}>{getActivityLabel(type)}</Text>
                    <Text style={styles.typeStatValue}>{count}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Intensity Distribution" />
              <View style={styles.typeStats}>
                {Object.entries(stats.activitiesByIntensity).map(([intensity, count]) => (
                  <View key={intensity} style={styles.typeStatRow}>
                    <View style={[styles.intensityDot, { backgroundColor: getIntensityColor(intensity) }]} />
                    <Text style={styles.typeStatLabel}>{intensity.charAt(0).toUpperCase() + intensity.slice(1)}</Text>
                    <Text style={styles.typeStatValue}>{count}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Recent Activities */}
        <SectionHeader title="Recent Activities" />
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.activitiesList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="activity" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No activities logged</Text>
              <Text style={styles.emptySubtitle}>Start logging your activities to see insights</Text>
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
  intensityDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },

  activitiesList: { gap: Spacing.sm },
  activityCard: { padding: Spacing.md },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  activityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  activityName: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600', flex: 1 },
  
  activityStats: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.sm },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '600' },
  
  activityTime: { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: Spacing.sm },
  activityNotes: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: Spacing.xs, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { color: Colors.textSecondary, fontSize: Typography.size.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.size.sm, textAlign: 'center' },
});
