import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';

const LOG_OPTIONS = [
  { icon: 'water-outline', title: 'Blood Glucose', sub: 'Log a glucose reading', screen: 'LogGlucose', color: Colors.inRange },
  { icon: 'restaurant-outline', title: 'Meal', sub: 'Log food & carbs', screen: 'LogMeal', color: Colors.chartMeal },
  { icon: 'medical-outline', title: 'Insulin', sub: 'Log a dose', screen: 'LogInsulin', color: Colors.chartInsulin },
  { icon: 'walk-outline', title: 'Activity', sub: 'Log exercise', screen: 'LogActivity', color: Colors.chartActivity },
];

export default function LogHubScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Entry</Text>
        <Text style={styles.subtitle}>What would you like to record?</Text>
      </View>
      <ScrollView contentContainerStyle={styles.options}>
        {LOG_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.screen}
            style={styles.option}
            onPress={() => navigation.navigate(opt.screen, {})}
            activeOpacity={0.85}
          >
            <View style={[styles.optionIcon, { backgroundColor: opt.color + '20' }]}>
              <Ionicons name={opt.icon as any} size={26} color={opt.color} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionSub}>{opt.sub}</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.base, paddingTop: Spacing.lg, gap: Spacing.xs },
  title: { color: Colors.textPrimary, fontSize: Typography.size['2xl'], fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.size.base },
  options: { padding: Spacing.base, gap: Spacing.sm },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, ...Shadows.sm,
  },
  optionIcon: { width: 52, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  optionTitle: { color: Colors.textPrimary, fontSize: Typography.size.md, fontWeight: '700' },
  optionSub: { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: 2 },
  optionArrow: { color: Colors.textMuted, fontSize: 24, fontWeight: '300' },
});
