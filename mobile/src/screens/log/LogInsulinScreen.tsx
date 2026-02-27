import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LogStackParamList } from '../../navigation/AppNavigator';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Button, Input, Card } from '../../components/common';
import { insulinApi } from '../../services/api';
import { Icon } from '../../components/Icon';

const INSULIN_TYPES = [
  { key: 'rapid', label: 'Rapid', sub: 'Novorapid, Humalog' },
  { key: 'long', label: 'Long-acting', sub: 'Lantus, Levemir' },
  { key: 'ultra_long', label: 'Ultra-long', sub: 'Toujeo, Tresiba' },
  { key: 'premixed', label: 'Premixed', sub: 'NovoMix, Humulin' },
];

type LogInsulinScreenNavigationProp = NativeStackNavigationProp<LogStackParamList, 'LogInsulin'>;

export default function LogInsulinScreen() {
  const navigation = useNavigation<LogInsulinScreenNavigationProp>();
  const [insulinName, setInsulinName] = useState('');
  const [insulinType, setInsulinType] = useState('');
  const [units, setUnits] = useState('');
  const [isCorrection, setIsCorrection] = useState(false);
  const [isBasal, setIsBasal] = useState(false);
  const [currentGlucose, setCurrentGlucose] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLog = async () => {
    if (!insulinType || !units) return;
    setIsLoading(true);
    try {
      await insulinApi.log({
        insulin_name: insulinName.trim() || insulinType,
        insulin_type: insulinType,
        delivery_method: 'pen',
        units: parseFloat(units),
        is_correction: isCorrection,
        is_basal: isBasal,
        glucose_at_dose: currentGlucose ? parseFloat(currentGlucose) : undefined,
        notes: notes.trim() || undefined,
      });
      Alert.alert(
        'Success!',
        'Insulin dose logged successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('LogHub') }]
      );
    } catch { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.sectionLabel}>Insulin type</Text>
            <View style={styles.typeList}>
              {INSULIN_TYPES.map((t) => (
                <TouchableOpacity key={t.key} style={[styles.typeRow, insulinType === t.key && styles.typeRowActive]} onPress={() => setInsulinType(t.key)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeLabel, insulinType === t.key && styles.typeLabelActive]}>{t.label}</Text>
                    <Text style={styles.typeSub}>{t.sub}</Text>
                  </View>
                  {insulinType === t.key && <Icon name="check" size={20} color={Colors.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input label="Insulin name (optional)" value={insulinName} onChangeText={setInsulinName} placeholder="e.g. NovoRapid" />

          <Card style={styles.unitsCard}>
            <Text style={styles.unitsLabel}>Units</Text>
            <View style={styles.unitsStepper}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setUnits((v) => String(Math.max(0, (parseFloat(v) || 0) - 0.5)))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.unitsValue}>{units || '0'}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setUnits((v) => String((parseFloat(v) || 0) + 0.5))}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unitsUnit}>units</Text>
          </Card>

          <View style={styles.checkRow}>
            {[{ label: 'Correction dose', state: isCorrection, set: setIsCorrection }, { label: 'Basal dose', state: isBasal, set: setIsBasal }].map((c) => (
              <TouchableOpacity key={c.label} style={[styles.check, c.state && styles.checkActive]} onPress={() => c.set(!c.state)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {c.state && <Icon name="check" size={16} color={Colors.accent} style={{ marginRight: 4 }} />}
                  <Text style={[styles.checkText, c.state && styles.checkTextActive]}>{c.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Current glucose (optional)" value={currentGlucose} onChangeText={setCurrentGlucose} keyboardType="decimal-pad" placeholder="mmol/L" />
          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Any notes..." multiline numberOfLines={2} />
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Log Dose" onPress={handleLog} loading={isLoading} disabled={!insulinType || !units} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['2xl'] },
  sectionLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '500', marginBottom: Spacing.sm },
  typeList: { gap: Spacing.sm },
  typeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 2, borderColor: 'transparent' },
  typeRowActive: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  typeLabel: { color: Colors.textPrimary, fontWeight: '600', fontSize: Typography.size.base },
  typeLabelActive: { color: Colors.accent },
  typeSub: { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },
  unitsCard: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.sm },
  unitsLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '500' },
  unitsStepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  stepperBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { color: Colors.accent, fontSize: 28, fontWeight: '300' },
  unitsValue: { color: Colors.textPrimary, fontSize: Typography.size['4xl'], fontWeight: '800', minWidth: 80, textAlign: 'center' },
  unitsUnit: { color: Colors.textMuted, fontSize: Typography.size.sm },
  checkRow: { flexDirection: 'row', gap: Spacing.sm },
  check: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center' },
  checkActive: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  checkText: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600' },
  checkTextActive: { color: Colors.accent },
  footer: { padding: Spacing.base },
});
