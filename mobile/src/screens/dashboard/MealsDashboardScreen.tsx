import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card, SectionHeader, Pill } from '../../components/common';
import { mealApi } from '../../services/api';
import { Icon } from '../../components/Icon';
import { format, formatDistanceToNow, startOfDay, endOfDay, subDays } from 'date-fns';

interface Meal {
  id: number;
  name: string;
  meal_type: string;
  total_carbs_g: number;
  total_protein_g: number;
  total_fat_g: number;
  total_calories: number;
  eaten_at: string;
  notes?: string;
  items: Array<{
    food_name: string;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    calories: number;
  }>;
}

interface MealStats {
  totalMeals: number;
  totalCalories: number;
  avgCarbs: number;
  avgProtein: number;
  avgFat: number;
  mealsByType: Record<string, number>;
}

export default function MealsDashboardScreen() {
  const navigation = useNavigation<any>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [stats, setStats] = useState<MealStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await mealApi.list(7);
      setMeals(response.data);
      
      // Calculate stats
      const totalMeals = response.data.length;
      const totalCalories = response.data.reduce((sum: number, meal: Meal) => sum + meal.total_calories, 0);
      const avgCarbs = totalMeals > 0 ? response.data.reduce((sum: number, meal: Meal) => sum + meal.total_carbs_g, 0) / totalMeals : 0;
      const avgProtein = totalMeals > 0 ? response.data.reduce((sum: number, meal: Meal) => sum + meal.total_protein_g, 0) / totalMeals : 0;
      const avgFat = totalMeals > 0 ? response.data.reduce((sum: number, meal: Meal) => sum + meal.total_fat_g, 0) / totalMeals : 0;
      
      const mealsByType = response.data.reduce((acc: Record<string, number>, meal: Meal) => {
        acc[meal.meal_type] = (acc[meal.meal_type] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalMeals,
        totalCalories: Math.round(totalCalories),
        avgCarbs: Math.round(avgCarbs * 10) / 10,
        avgProtein: Math.round(avgProtein * 10) / 10,
        avgFat: Math.round(avgFat * 10) / 10,
        mealsByType,
      });
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const getMealTypeIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'fasting';
      case 'lunch': return 'meal';
      case 'dinner': return 'bedtime';
      case 'snack': return 'meal';
      default: return 'meal';
    }
  };

  const getMealTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderMealItem = ({ item }: { item: Meal }) => (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleRow}>
          <Icon name={getMealTypeIcon(item.meal_type)} size={20} color={Colors.chartMeal} />
          <Text style={styles.mealName}>{item.name}</Text>
        </View>
        <Pill label={getMealTypeLabel(item.meal_type)} color={Colors.chartMeal} />
      </View>
      
      <View style={styles.mealStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_calories}</Text>
          <Text style={styles.statLabel}>cal</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_carbs_g}g</Text>
          <Text style={styles.statLabel}>carbs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_protein_g}g</Text>
          <Text style={styles.statLabel}>protein</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_fat_g}g</Text>
          <Text style={styles.statLabel}>fat</Text>
        </View>
      </View>

      <Text style={styles.mealTime}>
        {formatDistanceToNow(new Date(item.eaten_at), { addSuffix: true })}
      </Text>
      
      {item.notes && (
        <Text style={styles.mealNotes}>{item.notes}</Text>
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
          <Text style={styles.title}>Meals Dashboard</Text>
          <TouchableOpacity
            style={styles.logBtn}
            onPress={() => navigation.navigate('Log', { screen: 'LogMeal' })}
          >
            <Icon name="add" size={16} color={Colors.textInverse} />
            <Text style={styles.logBtnText}>Log Meal</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <>
            <Card style={styles.statsCard}>
              <SectionHeader title="7-Day Overview" />
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalMeals}</Text>
                  <Text style={styles.statDescription}>Total Meals</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.totalCalories}</Text>
                  <Text style={styles.statDescription}>Total Calories</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Daily Averages" />
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.avgCarbs}g</Text>
                  <Text style={styles.statDescription}>Carbs</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.avgProtein}g</Text>
                  <Text style={styles.statDescription}>Protein</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{stats.avgFat}g</Text>
                  <Text style={styles.statDescription}>Fat</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <SectionHeader title="Meals by Type" />
              <View style={styles.typeStats}>
                {Object.entries(stats.mealsByType).map(([type, count]) => (
                  <View key={type} style={styles.typeStatRow}>
                    <Icon name={getMealTypeIcon(type)} size={16} color={Colors.chartMeal} />
                    <Text style={styles.typeStatLabel}>{getMealTypeLabel(type)}</Text>
                    <Text style={styles.typeStatValue}>{count}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Recent Meals */}
        <SectionHeader title="Recent Meals" />
        <FlatList
          data={meals}
          renderItem={renderMealItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.mealsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="meal" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No meals logged</Text>
              <Text style={styles.emptySubtitle}>Start logging your meals to see insights</Text>
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

  mealsList: { gap: Spacing.sm },
  mealCard: { padding: Spacing.md },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  mealName: { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600', flex: 1 },
  
  mealStats: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.sm },
  statItem: { alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '700' },
  statLabel: { color: Colors.textSecondary, fontSize: Typography.size.xs },
  
  mealTime: { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: Spacing.sm },
  mealNotes: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: Spacing.xs, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  emptyTitle: { color: Colors.textSecondary, fontSize: Typography.size.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.size.sm, textAlign: 'center' },
});
