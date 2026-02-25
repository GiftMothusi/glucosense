import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Input, Button, Card } from '../../components/common';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const DIABETES_TYPES = [
  { key: 'type_1',      label: 'Type 1',      sub: 'Autoimmune, insulin dependent' },
  { key: 'type_2',      label: 'Type 2',      sub: 'Insulin resistance' },
  { key: 'gestational', label: 'Gestational', sub: 'During pregnancy' },
  { key: 'prediabetes', label: 'Prediabetes', sub: 'Elevated but not diabetic range' },
];

const CGM_DEVICES = [
  'Dexcom G6', 'Dexcom G7', 'FreeStyle Libre 2',
  'FreeStyle Libre 3', 'Medtronic Guardian', 'Eversense', 'Other',
];

const PUMP_MODELS = [
  'Medtronic 670G', 'Medtronic 780G', 'Omnipod 5',
  'Omnipod DASH', 'Tandem t:slim X2', 'Other',
];

export default function DiabetesProfileScreen() {
  const { user, loadUser } = useAuthStore();
  const dp = user?.diabetes_profile;

  const [diabetesType,   setDiabetesType]   = useState(dp?.diabetes_type ?? '');
  const [diagnosisYear,  setDiagnosisYear]  = useState(dp?.diagnosis_year?.toString() ?? '');
  const [usesCGM,        setUsesCGM]        = useState(dp?.uses_cgm ?? false);
  const [cgmDevice,      setCgmDevice]      = useState(dp?.cgm_device ?? '');
  const [usesInsulinPump,setUsesInsulinPump]= useState(dp?.uses_insulin_pump ?? false);
  const [pumpModel,      setPumpModel]      = useState(dp?.insulin_pump_model ?? '');
  const [carbRatio,      setCarbRatio]      = useState(dp?.carb_ratio?.toString() ?? '');
  const [correctionFactor, setCorrectionFactor] = useState(dp?.correction_factor?.toString() ?? '');

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!diabetesType) e.type = 'Please select your diabetes type';

    const yr = parseInt(diagnosisYear, 10);
    const now = new Date().getFullYear();
    if (diagnosisYear && (isNaN(yr) || yr < 1900 || yr > now)) {
      e.year = `Enter a valid year (1900–${now})`;
    }
    if (carbRatio && (isNaN(parseFloat(carbRatio)) || parseFloat(carbRatio) <= 0)) {
      e.carbRatio = 'Enter a valid carb ratio (e.g. 10)';
    }
    if (correctionFactor && (isNaN(parseFloat(correctionFactor)) || parseFloat(correctionFactor) <= 0)) {
      e.correctionFactor = 'Enter a valid correction factor (e.g. 2.5)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await userApi.setDiabetesProfile({
        diabetes_type:       diabetesType,
        diagnosis_year:      diagnosisYear ? parseInt(diagnosisYear, 10) : undefined,
        uses_cgm:            usesCGM,
        cgm_device:          usesCGM && cgmDevice ? cgmDevice : undefined,
        uses_insulin_pump:   usesInsulinPump,
        insulin_pump_model:  usesInsulinPump && pumpModel ? pumpModel : undefined,
        carb_ratio:          carbRatio ? parseFloat(carbRatio) : undefined,
        correction_factor:   correctionFactor ? parseFloat(correctionFactor) : undefined,
      });
      await loadUser();
      Alert.alert('Saved', 'Your diabetes profile has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>DIABETES TYPE</Text>
        {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
        <View style={styles.typeGrid}>
          {DIABETES_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeCard, diabetesType === t.key && styles.typeCardSelected]}
              onPress={() => setDiabetesType(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeLabel, diabetesType === t.key && styles.typeLabelSelected]}>
                {t.label}
              </Text>
              <Text style={[styles.typeSub, diabetesType === t.key && styles.typeSubSelected]}>
                {t.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DIAGNOSIS</Text>
        <Input
          label="Year of Diagnosis"
          value={diagnosisYear}
          onChangeText={setDiagnosisYear}
          keyboardType="numeric"
          placeholder={`e.g. ${new Date().getFullYear() - 5}`}
          error={errors.year}
        />

        <Text style={styles.sectionLabel}>DEVICES</Text>
        <Card style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>I use a CGM</Text>
            <Text style={styles.toggleSub}>Continuous Glucose Monitor</Text>
          </View>
          <Switch
            value={usesCGM}
            onValueChange={setUsesCGM}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
            thumbColor={Colors.textInverse}
          />
        </Card>

        {usesCGM && (
          <>
            <Text style={styles.fieldLabel}>CGM Device</Text>
            <View style={styles.chipRow}>
              {CGM_DEVICES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, cgmDevice === d && styles.chipSelected]}
                  onPress={() => setCgmDevice(cgmDevice === d ? '' : d)}
                >
                  <Text style={[styles.chipText, cgmDevice === d && styles.chipTextSelected]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Card style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>I use an Insulin Pump</Text>
            <Text style={styles.toggleSub}>Continuous subcutaneous insulin infusion</Text>
          </View>
          <Switch
            value={usesInsulinPump}
            onValueChange={setUsesInsulinPump}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
            thumbColor={Colors.textInverse}
          />
        </Card>

        {usesInsulinPump && (
          <>
            <Text style={styles.fieldLabel}>Pump Model</Text>
            <View style={styles.chipRow}>
              {PUMP_MODELS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, pumpModel === m && styles.chipSelected]}
                  onPress={() => setPumpModel(pumpModel === m ? '' : m)}
                >
                  <Text style={[styles.chipText, pumpModel === m && styles.chipTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>INSULIN RATIOS</Text>
        <Text style={styles.rationaleText}>
          Used by the bolus calculator. Leave blank if you're unsure — you can update these anytime.
        </Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Input
              label="Carb Ratio (g/unit)"
              value={carbRatio}
              onChangeText={setCarbRatio}
              keyboardType="decimal-pad"
              placeholder="e.g. 10"
              error={errors.carbRatio}
            />
          </View>
          <View style={styles.halfField}>
            <Input
              label="Correction Factor"
              value={correctionFactor}
              onChangeText={setCorrectionFactor}
              keyboardType="decimal-pad"
              placeholder="e.g. 2.5"
              error={errors.correctionFactor}
            />
          </View>
        </View>

        <Button
          label="Save Changes"
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
  container:           { flex: 1, backgroundColor: Colors.background },
  scroll:              { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  sectionLabel:        { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.sm },
  errorText:           { color: Colors.error, fontSize: Typography.size.xs },
  rationaleText:       { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 20, marginTop: -Spacing.xs },

  typeGrid:            { gap: Spacing.sm },
  typeCard:            { borderWidth: 1.5, borderColor: Colors.surfaceBorder, borderRadius: BorderRadius.lg, padding: Spacing.base, backgroundColor: Colors.surface, ...Shadows.sm },
  typeCardSelected:    { borderColor: Colors.primary, backgroundColor: Colors.primaryAlpha10 },
  typeLabel:           { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '700' },
  typeLabelSelected:   { color: Colors.primary },
  typeSub:             { color: Colors.textMuted, fontSize: Typography.size.sm, marginTop: 2 },
  typeSubSelected:     { color: Colors.primary },

  toggleRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleInfo:          { flex: 1, marginRight: Spacing.md },
  toggleLabel:         { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600' },
  toggleSub:           { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },

  fieldLabel:          { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600', marginTop: -Spacing.xs },
  chipRow:             { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip:                { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.surface },
  chipSelected:        { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:            { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '500' },
  chipTextSelected:    { color: Colors.textInverse },

  row:                 { flexDirection: 'row', gap: Spacing.md },
  halfField:           { flex: 1 },
});