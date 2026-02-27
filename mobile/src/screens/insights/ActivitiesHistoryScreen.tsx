import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Card, EmptyState } from '../../components/common';
import { activityApi } from '../../services/api';
import { format } from 'date-fns';
import type { InsightsStackParamList } from '../../navigation/AppNavigator';

type ActivitiesHistoryRouteProp = RouteProp<InsightsStackParamList, 'ActivitiesHistory'>;

export default function ActivitiesHistoryScreen() {
  const route = useRoute<ActivitiesHistoryRouteProp>();
  const { period } = route.params;
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await activityApi.list(period);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities history:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [period]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={Colors.accent} />}
      >
        <Text style={styles.title}>Activities History - {period} days</Text>

        {activities.length > 0 ? (
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <Card key={activity.id} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityName}>{activity.activity_type}</Text>
                  <Text style={styles.activityDuration}>{activity.duration_minutes} min</Text>
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityDate}>
                    {format(new Date(activity.started_at), 'MMM dd, yyyy - HH:mm')}
                  </Text>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityIntensity}>Intensity: {activity.intensity}</Text>
                    {activity.glucose_before && (
                      <Text style={styles.glucoseText}>Before: {activity.glucose_before} mmol/L</Text>
                    )}
                    {activity.glucose_after && (
                      <Text style={styles.glucoseText}>After: {activity.glucose_after} mmol/L</Text>
                    )}
                    {activity.calories_burned && (
                      <Text style={styles.caloriesText}>Calories: {activity.calories_burned}</Text>
                    )}
                  </View>
                  {activity.notes && (
                    <Text style={styles.activityNotes}>Notes: {activity.notes}</Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState 
            icon="activity" 
            title="No activities logged" 
            subtitle={`No activities found in the last ${period} days.`} 
          />
        )}
      </ScrollView>
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
    marginBottom: Spacing.lg 
  },
  activitiesList: { gap: Spacing.md },
  activityCard: { padding: Spacing.md, gap: Spacing.sm },
  activityHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  activityName: { 
    color: Colors.textPrimary, 
    fontSize: Typography.size.lg, 
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  activityDuration: { 
    color: Colors.chartActivity, 
    fontSize: Typography.size.md, 
    fontWeight: '600' 
  },
  activityDetails: { 
    gap: 4 
  },
  activityDate: { 
    color: Colors.textMuted, 
    fontSize: Typography.size.sm 
  },
  activityInfo: { 
    gap: 2 
  },
  activityIntensity: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  glucoseText: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  caloriesText: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  activityNotes: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
});
