import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Card, EmptyState } from '../../components/common';
import { insulinApi } from '../../services/api';
import { format } from 'date-fns';
import type { InsightsStackParamList } from '../../navigation/AppNavigator';

type InsulinHistoryRouteProp = RouteProp<InsightsStackParamList, 'InsulinHistory'>;

export default function InsulinHistoryScreen() {
  const route = useRoute<InsulinHistoryRouteProp>();
  const { period } = route.params;
  const [doses, setDoses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await insulinApi.list(period);
      setDoses(data);
    } catch (error) {
      console.error('Error loading insulin history:', error);
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
        <Text style={styles.title}>Insulin History - {period} days</Text>

        {doses.length > 0 ? (
          <View style={styles.dosesList}>
            {doses.map((dose) => (
              <Card key={dose.id} style={styles.doseCard}>
                <View style={styles.doseHeader}>
                  <Text style={styles.doseName}>{dose.insulin_name}</Text>
                  <Text style={styles.doseUnits}>{dose.units} units</Text>
                </View>
                <View style={styles.doseDetails}>
                  <Text style={styles.doseDate}>
                    {format(new Date(dose.administered_at), 'MMM dd, yyyy - HH:mm')}
                  </Text>
                  <View style={styles.doseInfo}>
                    <Text style={styles.doseType}>Type: {dose.insulin_type}</Text>
                    <Text style={styles.doseDelivery}>Method: {dose.delivery_method}</Text>
                    {dose.is_correction && (
                      <Text style={styles.doseFlag}>Correction dose</Text>
                    )}
                    {dose.is_basal && (
                      <Text style={styles.doseFlag}>Basal dose</Text>
                    )}
                    {dose.glucose_at_dose && (
                      <Text style={styles.doseGlucose}>Glucose at dose: {dose.glucose_at_dose} mmol/L</Text>
                    )}
                  </View>
                  {dose.notes && (
                    <Text style={styles.doseNotes}>Notes: {dose.notes}</Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState 
            icon="medication" 
            title="No insulin doses logged" 
            subtitle={`No insulin doses found in the last ${period} days.`} 
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
  dosesList: { gap: Spacing.md },
  doseCard: { padding: Spacing.md, gap: Spacing.sm },
  doseHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  doseName: { 
    color: Colors.textPrimary, 
    fontSize: Typography.size.lg, 
    fontWeight: '700' 
  },
  doseUnits: { 
    color: Colors.accent, 
    fontSize: Typography.size.md, 
    fontWeight: '600' 
  },
  doseDetails: { 
    gap: 4 
  },
  doseDate: { 
    color: Colors.textMuted, 
    fontSize: Typography.size.sm 
  },
  doseInfo: { 
    gap: 2 
  },
  doseType: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  doseDelivery: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  doseFlag: { 
    color: Colors.chartInsulin, 
    fontSize: Typography.size.sm,
    fontWeight: '600'
  },
  doseGlucose: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  doseNotes: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
});
