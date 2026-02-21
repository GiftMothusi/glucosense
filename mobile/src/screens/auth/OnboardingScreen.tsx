import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Button } from '../../components/common';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const DIABETES_TYPES = [
  { key: 'type_1', label: 'Type 1', emoji: '🩺' },
  { key: 'type_2', label: 'Type 2', emoji: '💊' },
  { key: 'gestational', label: 'Gestational', emoji: '🤰' },
  { key: 'prediabetes', label: 'Prediabetes', emoji: '⚠️' },
];

export default function OnboardingScreen() {
  const { loadUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [diabetesType, setDiabetesType] = useState('');
  const [targetLow, setTargetLow] = useState('3.9');
  const [targetHigh, setTargetHigh] = useState('10.0');
  const [usesCGM, setUsesCGM] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      title: 'What type of diabetes do you have?',
      subtitle: 'This helps us personalise your experience.',
    },
    {
      title: 'Set your glucose targets',
      subtitle: 'You can change these anytime in settings.',
    },
    {
      title: 'Do you use a CGM?',
      subtitle: 'Continuous Glucose Monitors can sync directly with GlucoSense.',
    },
  ];

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await userApi.setDiabetesProfile({
        diabetes_type: diabetesType,
        target_glucose_low: parseFloat(targetLow),
        target_glucose_high: parseFloat(targetHigh),
        uses_cgm: usesCGM,
      });
      await loadUser();
    } catch (e) {
      await loadUser();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{steps[step].title}</Text>
        <Text style={styles.subtitle}>{steps[step].subtitle}</Text>

        {step === 0 && (
          <View style={styles.optionGrid}>
            {DIABETES_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.option, diabetesType === t.key && styles.optionSelected]}
                onPress={() => setDiabetesType(t.key)}
              >
                <Text style={styles.optionEmoji}>{t.emoji}</Text>
                <Text style={[styles.optionLabel, diabetesType === t.key && styles.optionLabelSelected]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={styles.targetContainer}>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>Low target</Text>
              <View style={styles.targetInput}>
                <TouchableOpacity onPress={() => setTargetLow((v) => String(Math.max(2.0, parseFloat(v) - 0.1).toFixed(1)))}>
                  <Text style={styles.targetBtn}>−</Text>
                </TouchableOpacity>
                <Text style={styles.targetValue}>{targetLow}</Text>
                <TouchableOpacity onPress={() => setTargetLow((v) => String(Math.min(6.0, parseFloat(v) + 0.1).toFixed(1)))}>
                  <Text style={styles.targetBtn}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.targetUnit}>mmol/L</Text>
            </View>
            <View style={styles.targetRow}>
              <Text style={styles.targetLabel}>High target</Text>
              <View style={styles.targetInput}>
                <TouchableOpacity onPress={() => setTargetHigh((v) => String(Math.max(7.0, parseFloat(v) - 0.5).toFixed(1)))}>
                  <Text style={styles.targetBtn}>−</Text>
                </TouchableOpacity>
                <Text style={styles.targetValue}>{targetHigh}</Text>
                <TouchableOpacity onPress={() => setTargetHigh((v) => String(Math.min(20.0, parseFloat(v) + 0.5).toFixed(1)))}>
                  <Text style={styles.targetBtn}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.targetUnit}>mmol/L</Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.optionGrid}>
            {[{ key: true, label: 'Yes, I use a CGM', emoji: '📡' }, { key: false, label: 'No, I use a finger prick meter', emoji: '🩸' }].map((o) => (
              <TouchableOpacity
                key={String(o.key)}
                style={[styles.option, usesCGM === o.key && styles.optionSelected, { width: '100%' }]}
                onPress={() => setUsesCGM(o.key)}
              >
                <Text style={styles.optionEmoji}>{o.emoji}</Text>
                <Text style={[styles.optionLabel, usesCGM === o.key && styles.optionLabelSelected]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < steps.length - 1 ? (
          <Button
            label="Continue →"
            onPress={() => setStep((s) => s + 1)}
            disabled={step === 0 && !diabetesType}
            fullWidth size="lg"
          />
        ) : (
          <Button
            label="Get Started 🎉"
            onPress={handleComplete}
            loading={isLoading}
            fullWidth size="lg"
          />
        )}
        <TouchableOpacity onPress={handleComplete} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: { flexDirection: 'row', gap: 8, padding: Spacing.base },
  progressDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.surfaceBorder },
  progressDotActive: { backgroundColor: Colors.accent },
  content: { flex: 1, padding: Spacing['2xl'], gap: Spacing.xl },
  title: { color: Colors.textPrimary, fontSize: Typography.size['2xl'], fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.size.base },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  option: {
    width: '47%', padding: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center', gap: Spacing.sm,
  },
  optionSelected: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  optionEmoji: { fontSize: 32 },
  optionLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600', textAlign: 'center' },
  optionLabelSelected: { color: Colors.accent },
  targetContainer: { gap: Spacing.xl },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.base },
  targetLabel: { flex: 1, color: Colors.textPrimary, fontWeight: '600' },
  targetInput: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  targetBtn: { color: Colors.accent, fontSize: 28, fontWeight: '300', paddingHorizontal: Spacing.sm },
  targetValue: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: '700', minWidth: 50, textAlign: 'center' },
  targetUnit: { color: Colors.textMuted, fontSize: Typography.size.sm, minWidth: 60, textAlign: 'right' },
  footer: { padding: Spacing.base, gap: Spacing.md },
  skipBtn: { alignItems: 'center' },
  skipText: { color: Colors.textMuted, fontSize: Typography.size.sm },
});
