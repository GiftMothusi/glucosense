import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, getGlucoseColor, getGlucoseLabel } from '../../theme/theme';
import { Card, EmptyState } from '../../components/common';
import { glucoseApi } from '../../services/api';
import { format } from 'date-fns';
import type { InsightsStackParamList } from '../../navigation/AppNavigator';

type GlucoseHistoryRouteProp = RouteProp<InsightsStackParamList, 'GlucoseHistory'>;

export default function GlucoseHistoryScreen() {
  const route = useRoute<GlucoseHistoryRouteProp>();
  const navigation = useNavigation();
  const { period } = route.params;
  const [readings, setReadings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await glucoseApi.list(period);
      setReadings(data);
    } catch (error) {
      console.error('Error loading glucose history:', error);
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
        <Text style={styles.title}>Glucose History - {period} days</Text>

        {readings.length > 0 ? (
          <View style={styles.readingsList}>
            {readings.map((reading) => (
              <Card key={reading.id} style={styles.readingCard}>
                <View style={styles.readingHeader}>
                  <Text style={styles.readingValue}>
                    {reading.value_mmol.toFixed(1)} mmol/L
                  </Text>
                  <Text style={[styles.readingLabel, { color: getGlucoseColor(reading.value_mmol) }]}>
                    {getGlucoseLabel(reading.value_mmol)}
                  </Text>
                </View>
                <View style={styles.readingDetails}>
                  <Text style={styles.readingDate}>
                    {format(new Date(reading.recorded_at), 'MMM dd, yyyy - HH:mm')}
                  </Text>
                  {reading.tag && (
                    <Text style={styles.readingTag}>Tag: {reading.tag}</Text>
                  )}
                  {reading.notes && (
                    <Text style={styles.readingNotes}>Notes: {reading.notes}</Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState 
            icon="glucose" 
            title="No glucose readings" 
            subtitle={`No glucose readings found in the last ${period} days.`} 
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
  readingsList: { gap: Spacing.md },
  readingCard: { padding: Spacing.md, gap: Spacing.sm },
  readingHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  readingValue: { 
    color: Colors.textPrimary, 
    fontSize: Typography.size.lg, 
    fontWeight: '700' 
  },
  readingLabel: { 
    fontSize: Typography.size.sm, 
    fontWeight: '600' 
  },
  readingDetails: { 
    gap: 4 
  },
  readingDate: { 
    color: Colors.textMuted, 
    fontSize: Typography.size.sm 
  },
  readingTag: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  readingNotes: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
});
