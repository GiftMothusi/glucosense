import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, getGlucoseColor, getGlucoseLabel } from '../../theme/theme';
import { Button, Input, Card } from '../../components/common';
import { useGlucoseStore } from '../../store/glucoseStore';

const TAGS = [
  { key: 'fasting', label: 'Fasting', emoji: '🌙' },
  { key: 'pre_meal', label: 'Pre-meal', emoji: '🍽️' },
  { key: 'post_meal', label: 'Post-meal', emoji: '✅' },
  { key: 'bedtime', label: 'Bedtime', emoji: '😴' },
  { key: 'exercise', label: 'Exercise', emoji: '🏃' },
  { key: 'sick', label: 'Sick', emoji: '🤒' },
];

export default function LogGlucoseScreen() {
  const navigation = useNavigation();
  const { logReading, isLogging } = useGlucoseStore();
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'mmol' | 'mgdl'>('mmol');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const numericValue = parseFloat(value);
  const isValid = !isNaN(numericValue) && numericValue > 0;
  const mmolValue = unit === 'mmol' ? numericValue : numericValue / 18.0182;
  const glucoseColor = isValid ? getGlucoseColor(mmolValue) : Colors.textMuted;
  const glucoseLabel = isValid ? getGlucoseLabel(mmolValue) : '';

  const handleLog = async () => {
    if (!isValid) return;
    const result = await logReading({ value: numericValue, unit, tag: selectedTag || undefined, notes: notes.trim() || undefined });
    if (result) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card style={styles.valueCard}>
            <Text style={[styles.valueText, { color: glucoseColor }]}>{value || '—'}</Text>
            <View style={styles.unitToggle}>
              {(['mmol', 'mgdl'] as const).map((u) => (
                <TouchableOpacity key={u} style={[styles.unitBtn, unit === u && styles.unitBtnActive]} onPress={() => setUnit(u)}>
                  <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u === 'mmol' ? 'mmol/L' : 'mg/dL'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {glucoseLabel ? <Text style={[styles.glucoseLabel, { color: glucoseColor }]}>{glucoseLabel}</Text> : null}
          </Card>

          <Input label="Glucose value" value={value} onChangeText={setValue} placeholder={unit === 'mmol' ? 'e.g. 5.6' : 'e.g. 101'} keyboardType="decimal-pad" />

          <View>
            <Text style={styles.sectionLabel}>Tag (optional)</Text>
            <View style={styles.tagGrid}>
              {TAGS.map((tag) => (
                <TouchableOpacity key={tag.key} style={[styles.tag, selectedTag === tag.key && styles.tagSelected]} onPress={() => setSelectedTag(selectedTag === tag.key ? null : tag.key)}>
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text style={[styles.tagLabel, selectedTag === tag.key && styles.tagLabelSelected]}>{tag.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any context for this reading..." multiline numberOfLines={3} />
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Log Reading" onPress={handleLog} loading={isLogging} disabled={!isValid} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['2xl'] },
  valueCard: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  valueText: { fontSize: 72, fontWeight: '800', letterSpacing: -3 },
  glucoseLabel: { fontSize: Typography.size.base, fontWeight: '600' },
  unitToggle: { flexDirection: 'row', gap: Spacing.xs },
  unitBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder },
  unitBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  unitBtnText: { color: Colors.textMuted, fontSize: Typography.size.sm, fontWeight: '600' },
  unitBtnTextActive: { color: Colors.accent },
  sectionLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '500', marginBottom: Spacing.sm },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  tagSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  tagEmoji: { fontSize: 14 },
  tagLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600' },
  tagLabelSelected: { color: Colors.accent },
  footer: { padding: Spacing.base },
});
