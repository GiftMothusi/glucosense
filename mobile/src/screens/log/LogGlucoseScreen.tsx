import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius, getGlucoseColor, getGlucoseLabel } from '../../theme/theme';
import { Button, Input, Card } from '../../components/common';
import { useGlucoseStore } from '../../store/glucoseStore';
import { Icon, IconName } from '../../components/Icon';
import type { LogStackParamList } from '../../navigation/AppNavigator';

const TAGS: Array<{ key: string; label: string; icon: IconName }> = [
  { key: 'fasting', label: 'Fasting', icon: 'fasting' },
  { key: 'pre_meal', label: 'Pre-meal', icon: 'meal' },
  { key: 'post_meal', label: 'Post-meal', icon: 'check' },
  { key: 'bedtime', label: 'Bedtime', icon: 'bedtime' },
  { key: 'exercise', label: 'Exercise', icon: 'activity' },
  { key: 'sick', label: 'Sick', icon: 'sick' },
];

type LogGlucoseScreenNavigationProp = NativeStackNavigationProp<LogStackParamList, 'LogGlucose'>;

export default function LogGlucoseScreen() {
  const navigation = useNavigation<LogGlucoseScreenNavigationProp>();
  const { logReading, isLogging } = useGlucoseStore();
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'mmol' | 'mgdl'>('mmol');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [backdated, setBackdated] = useState(false);
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    return { hour: String(d.getHours()).padStart(2, '0'), minute: String(d.getMinutes()).padStart(2, '0') };
  });

  const numericValue = parseFloat(value);
  const isValid = !isNaN(numericValue) && numericValue > 0;
  const mmolValue = unit === 'mmol' ? numericValue : numericValue / 18.0182;
  const glucoseColor = isValid ? getGlucoseColor(mmolValue) : Colors.textMuted;
  const glucoseLabel = isValid ? getGlucoseLabel(mmolValue) : '';

  const getRecordedAt = (): string | undefined => {
    if (!backdated) return undefined;
    const now = new Date();
    const h = parseInt(customDate.hour, 10);
    const m = parseInt(customDate.minute, 10);
    if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return undefined;
    now.setHours(h, m, 0, 0);
    return now.toISOString();
  };

  const handleLog = async () => {
    if (!isValid) return;
    const recorded_at = getRecordedAt();
    const result = await (logReading as any)({ value: numericValue, unit, tag: selectedTag || undefined, notes: notes.trim() || undefined, recorded_at });
    if (result) {
      Alert.alert(
        'Logged!',
        `Reading of ${numericValue} ${unit === 'mmol' ? 'mmol/L' : 'mg/dL'} saved${backdated ? ` at ${customDate.hour}:${customDate.minute}` : ''}.`,
        [{ text: 'OK', onPress: () => navigation.navigate('LogHub') }]
      );
    }
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
                  <Icon name={tag.icon} size={16} color={selectedTag === tag.key ? Colors.accent : Colors.textMuted} />
                  <Text style={[styles.tagLabel, selectedTag === tag.key && styles.tagLabelSelected]}>{tag.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any context for this reading..." multiline numberOfLines={3} />

          <View style={styles.backdateRow}>
            <View style={styles.backdateLabel}>
              <Text style={styles.sectionLabel}>Log for an earlier time</Text>
              <Text style={styles.backdateHint}>Toggle to change the recorded time</Text>
            </View>
            <Switch
              value={backdated}
              onValueChange={setBackdated}
              trackColor={{ false: Colors.surfaceBorder, true: Colors.accent }}
              thumbColor={Colors.textInverse}
            />
          </View>

          {backdated && (
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.sectionLabel}>Hour (0–23)</Text>
                <Input
                  value={customDate.hour}
                  onChangeText={(v) => v.length <= 2 && setCustomDate((p) => ({ ...p, hour: v }))}
                  keyboardType="numeric"
                  placeholder="HH"
                />
              </View>
              <Text style={styles.timeSep}>:</Text>
              <View style={styles.timeField}>
                <Text style={styles.sectionLabel}>Minute (0–59)</Text>
                <Input
                  value={customDate.minute}
                  onChangeText={(v) => v.length <= 2 && setCustomDate((p) => ({ ...p, minute: v }))}
                  keyboardType="numeric"
                  placeholder="MM"
                />
              </View>
            </View>
          )}
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
  backdateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md },
  backdateLabel: { flex: 1, marginRight: Spacing.md },
  backdateHint: { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  timeField: { flex: 1 },
  timeSep: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: '700', paddingBottom: Spacing.md },
});
