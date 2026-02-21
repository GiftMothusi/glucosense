import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Button, Input, Card } from '../../components/common';
import { mealApi } from '../../services/api';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
  { key: 'snack', label: 'Snack', emoji: '🍎' },
];

export default function LogMealScreen() {
  const navigation = useNavigation();
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLog = async () => {
    if (!mealName || !mealType) return;
    setIsLoading(true);
    try {
      await mealApi.log({
        name: mealName.trim(),
        meal_type: mealType,
        notes: notes.trim() || undefined,
        items: carbs || protein || fat ? [{
          food_name: mealName,
          quantity_g: 100,
          carbs_g: parseFloat(carbs) || 0,
          protein_g: parseFloat(protein) || 0,
          fat_g: parseFloat(fat) || 0,
          calories: parseFloat(calories) || 0,
        }] : [],
      });
      navigation.goBack();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Input label="Meal name" value={mealName} onChangeText={setMealName} placeholder="e.g. Chicken salad" />

          <View>
            <Text style={styles.sectionLabel}>Meal type</Text>
            <View style={styles.typeGrid}>
              {MEAL_TYPES.map((t) => (
                <TouchableOpacity key={t.key} style={[styles.typeBtn, mealType === t.key && styles.typeBtnActive]} onPress={() => setMealType(t.key)}>
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text style={[styles.typeLabel, mealType === t.key && styles.typeLabelActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Card style={styles.macroCard}>
            <Text style={styles.macroTitle}>Macronutrients (optional)</Text>
            <View style={styles.macroGrid}>
              <Input label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1 }} />
              <Input label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1 }} />
              <Input label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1 }} />
              <Input label="Calories" value={calories} onChangeText={setCalories} keyboardType="decimal-pad" placeholder="0" style={{ flex: 1 }} />
            </View>
          </Card>

          <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Anything else..." multiline numberOfLines={2} />
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Log Meal" onPress={handleLog} loading={isLoading} disabled={!mealName || !mealType} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['2xl'] },
  sectionLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '500', marginBottom: Spacing.sm },
  typeGrid: { flexDirection: 'row', gap: Spacing.sm },
  typeBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'transparent' },
  typeBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  typeEmoji: { fontSize: 24 },
  typeLabel: { color: Colors.textSecondary, fontSize: Typography.size.xs, fontWeight: '600' },
  typeLabelActive: { color: Colors.accent },
  macroCard: { gap: Spacing.md },
  macroTitle: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600' },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  footer: { padding: Spacing.base },
});
