import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Card, EmptyState } from '../../components/common';
import { mealApi } from '../../services/api';
import { format } from 'date-fns';
import type { InsightsStackParamList } from '../../navigation/AppNavigator';

type MealsHistoryRouteProp = RouteProp<InsightsStackParamList, 'MealsHistory'>;

export default function MealsHistoryScreen() {
  const route = useRoute<MealsHistoryRouteProp>();
  const { period } = route.params;
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await mealApi.list(period);
      setMeals(data);
    } catch (error) {
      console.error('Error loading meals history:', error);
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
        <Text style={styles.title}>Meals History - {period} days</Text>

        {meals.length > 0 ? (
          <View style={styles.mealsList}>
            {meals.map((meal) => (
              <Card key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealType}>{meal.meal_type}</Text>
                </View>
                <View style={styles.mealDetails}>
                  <Text style={styles.mealDate}>
                    {format(new Date(meal.eaten_at), 'MMM dd, yyyy - HH:mm')}
                  </Text>
                  <View style={styles.nutritionRow}>
                    <Text style={styles.nutritionText}>Carbs: {meal.total_carbs_g}g</Text>
                    <Text style={styles.nutritionText}>Protein: {meal.total_protein_g}g</Text>
                    <Text style={styles.nutritionText}>Fat: {meal.total_fat_g}g</Text>
                    <Text style={styles.nutritionText}>Calories: {meal.total_calories}</Text>
                  </View>
                  {meal.notes && (
                    <Text style={styles.mealNotes}>Notes: {meal.notes}</Text>
                  )}
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState 
            icon="meal" 
            title="No meals logged" 
            subtitle={`No meals found in the last ${period} days.`} 
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
  mealsList: { gap: Spacing.md },
  mealCard: { padding: Spacing.md, gap: Spacing.sm },
  mealHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  mealName: { 
    color: Colors.textPrimary, 
    fontSize: Typography.size.lg, 
    fontWeight: '700' 
  },
  mealType: { 
    color: Colors.textMuted, 
    fontSize: Typography.size.sm,
    textTransform: 'capitalize'
  },
  mealDetails: { 
    gap: 4 
  },
  mealDate: { 
    color: Colors.textMuted, 
    fontSize: Typography.size.sm 
  },
  nutritionRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: Spacing.sm 
  },
  nutritionText: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
  mealNotes: { 
    color: Colors.textSecondary, 
    fontSize: Typography.size.sm 
  },
});
