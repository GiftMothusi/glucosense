import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Input, Button, Card } from '../../components/common';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const PRESETS = [
  {
    label: 'Standard',
    sub: 'ADA / EASD guideline',
    low: '3.9',
    high: '10.0',
    tir: '70',
  },
  {
    label: 'Strict',
    sub: 'Tighter control',
    low: '3.9',
    high: '7.8',
    tir: '80',
  },
  {
    label: 'Relaxed',
    sub: 'Older adults / hypoglycaemia risk',
    low: '5.0',
    high: '13.9',
    tir: '50',
  },
];

export default function GlucoseTargetsScreen() {
  const { user, loadUser } = useAuthStore();
  const dp      = user?.diabetes_profile;
  const isMmol  = (user?.profile?.glucose_unit ?? 'mmol') === 'mmol';
  const unit    = isMmol ? 'mmol/L' : 'mg/dL';

  const toDisplay = (mmol: number) =>
    isMmol ? mmol.toString() : Math.round(mmol * 18.0182).toString();

  const [targetLow,  setTargetLow]  = useState(
    dp?.target_glucose_low  ? toDisplay(dp.target_glucose_low)  : '3.9'
  );
  const [targetHigh, setTargetHigh] = useState(
    dp?.target_glucose_high ? toDisplay(dp.target_glucose_high) : '10.0'
  );
  const [targetTir,  setTargetTir]  = useState(
    dp?.target_tir_percentage?.toString() ?? '70'
  );
  const [targetHba1c, setTargetHba1c] = useState(
    dp?.target_hba1c?.toString() ?? ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const toMmol = (val: string) => {
    const n = parseFloat(val);
    return isMmol ? n : parseFloat((n / 18.0182).toFixed(2));
  };

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTargetLow(isMmol  ? p.low  : String(Math.round(parseFloat(p.low)  * 18.0182)));
    setTargetHigh(isMmol ? p.high : String(Math.round(parseFloat(p.high) * 18.0182)));
    setTargetTir(p.tir);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const lo   = parseFloat(targetLow);
    const hi   = parseFloat(targetHigh);
    const tir  = parseFloat(targetTir);
    const hba1c = parseFloat(targetHba1c);

    if (isNaN(lo) || lo < (isMmol ? 2.0 : 36) || lo > (isMmol ? 6.0 : 108)) {
      e.low = isMmol ? 'Enter a value between 2.0 – 6.0 mmol/L' : 'Enter a value between 36 – 108 mg/dL';
    }
    if (isNaN(hi) || hi < (isMmol ? 7.0 : 126) || hi > (isMmol ? 20.0 : 360)) {
      e.high = isMmol ? 'Enter a value between 7.0 – 20.0 mmol/L' : 'Enter a value between 126 – 360 mg/dL';
    }
    if (!isNaN(lo) && !isNaN(hi) && lo >= hi) {
      e.high = 'Upper target must be higher than lower target';
    }
    if (isNaN(tir) || tir < 0 || tir > 100) {
      e.tir = 'Enter a percentage between 0 – 100';
    }
    if (targetHba1c && (isNaN(hba1c) || hba1c < 3 || hba1c > 20)) {
      e.hba1c = 'Enter a valid HbA1c between 3 – 20%';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!dp?.diabetes_type) {
      Alert.alert(
        'Diabetes Type Required',
        'Please set your Diabetes Profile before updating targets.',
      );
      return;
    }
    setIsLoading(true);
    try {
      await userApi.setDiabetesProfile({
        diabetes_type:          dp.diabetes_type,
        target_glucose_low:     toMmol(targetLow),
        target_glucose_high:    toMmol(targetHigh),
        target_tir_percentage:  parseFloat(targetTir),
        target_hba1c:           targetHba1c ? parseFloat(targetHba1c) : undefined,
      });
      await loadUser();
      Alert.alert('Saved', 'Your glucose targets have been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>QUICK PRESETS</Text>
        <View style={styles.presetRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={styles.presetCard}
              onPress={() => applyPreset(p)}
              activeOpacity={0.7}
            >
              <Text style={styles.presetLabel}>{p.label}</Text>
              <Text style={styles.presetSub}>{p.sub}</Text>
              <Text style={styles.presetValues}>
                {isMmol ? p.low : Math.round(parseFloat(p.low) * 18.0182)}
                {' – '}
                {isMmol ? p.high : Math.round(parseFloat(p.high) * 18.0182)}
                {' '}
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>TARGET RANGE ({unit})</Text>
        <Text style={styles.rationaleText}>
          Readings within this range count towards your Time in Range (TIR).
        </Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Input
              label={`Lower target (${unit})`}
              value={targetLow}
              onChangeText={setTargetLow}
              keyboardType="decimal-pad"
              placeholder={isMmol ? '3.9' : '70'}
              error={errors.low}
            />
          </View>
          <View style={styles.halfField}>
            <Input
              label={`Upper target (${unit})`}
              value={targetHigh}
              onChangeText={setTargetHigh}
              keyboardType="decimal-pad"
              placeholder={isMmol ? '10.0' : '180'}
              error={errors.high}
            />
          </View>
        </View>

        <Card style={styles.rangeBar}>
          <View style={styles.rangeTrack}>
            <View style={[styles.rangeZone, { flex: 1, backgroundColor: Colors.veryLow + '40' }]} />
            <View style={[styles.rangeZone, { flex: 2, backgroundColor: Colors.inRange + '40' }]} />
            <View style={[styles.rangeZone, { flex: 1, backgroundColor: Colors.high + '40' }]} />
          </View>
          <View style={styles.rangeLegend}>
            <Text style={[styles.rangeLegendText, { color: Colors.veryLow }]}>Low</Text>
            <Text style={[styles.rangeLegendText, { color: Colors.inRange }]}>
              {targetLow} – {targetHigh} {unit}
            </Text>
            <Text style={[styles.rangeLegendText, { color: Colors.high }]}>High</Text>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>TIME IN RANGE TARGET (%)</Text>
        <Input
          label="Target TIR %"
          value={targetTir}
          onChangeText={setTargetTir}
          keyboardType="decimal-pad"
          placeholder="70"
          error={errors.tir}
        />

        <View style={styles.tirReference}>
          {[
            { label: 'Minimum', value: '50%', color: Colors.warning },
            { label: 'Recommended', value: '70%', color: Colors.inRange },
            { label: 'Optimal', value: '80%+', color: Colors.primary },
          ].map((r) => (
            <TouchableOpacity
              key={r.label}
              style={[styles.tirPill, { borderColor: r.color }]}
              onPress={() => setTargetTir(r.value.replace('%', '').replace('+', ''))}
            >
              <Text style={[styles.tirPillValue, { color: r.color }]}>{r.value}</Text>
              <Text style={styles.tirPillLabel}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>HBA1C TARGET (%)</Text>
        <Text style={styles.rationaleText}>Optional. Used to compare against lab results.</Text>
        <Input
          label="Target HbA1c %"
          value={targetHba1c}
          onChangeText={setTargetHba1c}
          keyboardType="decimal-pad"
          placeholder="e.g. 7.0"
          error={errors.hba1c}
        />

        <Button
          label="Save Targets"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  scroll:           { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  sectionLabel:     { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.sm },
  rationaleText:    { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 20, marginTop: -Spacing.xs },
  row:              { flexDirection: 'row', gap: Spacing.md },
  halfField:        { flex: 1 },

  presetRow:        { flexDirection: 'row', gap: Spacing.sm },
  presetCard:       { flex: 1, borderWidth: 1.5, borderColor: Colors.surfaceBorder, borderRadius: BorderRadius.lg, padding: Spacing.md, backgroundColor: Colors.surface, gap: 2, ...Shadows.sm },
  presetLabel:      { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '700' },
  presetSub:        { color: Colors.textMuted, fontSize: 10, lineHeight: 14 },
  presetValues:     { color: Colors.primary, fontSize: Typography.size.xs, fontWeight: '600', marginTop: Spacing.xs },

  rangeBar:         { gap: Spacing.sm, paddingVertical: Spacing.md },
  rangeTrack:       { flexDirection: 'row', height: 12, borderRadius: BorderRadius.full, overflow: 'hidden', gap: 2 },
  rangeZone:        { borderRadius: BorderRadius.sm },
  rangeLegend:      { flexDirection: 'row', justifyContent: 'space-between' },
  rangeLegendText:  { fontSize: Typography.size.xs, fontWeight: '600' },

  tirReference:     { flexDirection: 'row', gap: Spacing.sm },
  tirPill:          { flex: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: BorderRadius.lg, paddingVertical: Spacing.sm },
  tirPillValue:     { fontSize: Typography.size.base, fontWeight: '800' },
  tirPillLabel:     { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },
});