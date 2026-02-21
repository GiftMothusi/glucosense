import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Button, Input, Card } from '../../components/common';
import { activityApi } from '../../services/api';

const ACTIVITY_TYPES = [
  { key: 'walking', emoji: '🚶', label: 'Walking' },
  { key: 'running', emoji: '🏃', label: 'Running' },
  { key: 'cycling', emoji: '🚴', label: 'Cycling' },
  { key: 'swimming', emoji: '🏊', label: 'Swimming' },
  { key: 'gym', emoji: '🏋️', label: 'Gym' },
  { key: 'yoga', emoji: '🧘', label: 'Yoga' },
  { key: 'sport', emoji: '⚽', label: 'Sport' },
  { key: 'other', emoji: '🏅', label: 'Other' },
];

const INTENSITIES = ['low', 'moderate', 'high'];

export default function LogActivityScreen() {
  const navigation = useNavigation();
  const [activityType, setActivityType] = useState('');
  const [intensity, setIntensity] = useState('moderate');
  const [duration, setDuration] = useState('');
  const [glucoseBefore, setGlucoseBefore] = useState('');
  const [glucoseAfter, setGlucoseAfter] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLog = async () => {
    if (!activityType || !duration) return;
    setIsLoading(true);
    try {
      await activityApi.log({
        activity_type: activityType,
        intensity,
        duration_minutes: parseInt(duration),
        glucose_before: glucoseBefore ? parseFloat(glucoseBefore) : undefined,
        glucose_after: glucoseAfter ? parseFloat(glucoseAfter) : undefined,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch { setIsLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.label}>Activity type</Text>
          <View style={styles.activityGrid}>
            {ACTIVITY_TYPES.map((a) => (
              <TouchableOpacity key={a.key} style={[styles.activityBtn, activityType === a.key && styles.activityBtnActive]} onPress={() => setActivityType(a.key)}>
                <Text style={styles.activityEmoji}>{a.emoji}</Text>
                <Text style={[styles.activityLabel, activityType === a.key && styles.activityLabelActive]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.label}>Intensity</Text>
          <View style={styles.intensityRow}>
            {INTENSITIES.map((i) => (
              <TouchableOpacity key={i} style={[styles.intensityBtn, intensity === i && styles.intensityBtnActive]} onPress={() => setIntensity(i)}>
                <Text style={[styles.intensityLabel, intensity === i && styles.intensityLabelActive]}>{i.charAt(0).toUpperCase() + i.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="30" />

        <View style={styles.glucoseRow}>
          <Input label="Glucose before" value={glucoseBefore} onChangeText={setGlucoseBefore} keyboardType="decimal-pad" placeholder="mmol/L" style={{ flex: 1 }} />
          <Input label="Glucose after" value={glucoseAfter} onChangeText={setGlucoseAfter} keyboardType="decimal-pad" placeholder="mmol/L" style={{ flex: 1 }} />
        </View>

        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="How did it go?" multiline numberOfLines={2} />
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Log Activity" onPress={handleLog} loading={isLoading} disabled={!activityType || !duration} fullWidth size="lg" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['2xl'] },
  label: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '500', marginBottom: Spacing.sm },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  activityBtn: { width: '22%', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.sm, alignItems: 'center', gap: 2, borderWidth: 2, borderColor: 'transparent' },
  activityBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  activityEmoji: { fontSize: 24 },
  activityLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  activityLabelActive: { color: Colors.accent },
  intensityRow: { flexDirection: 'row', gap: Spacing.sm },
  intensityBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  intensityBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  intensityLabel: { color: Colors.textSecondary, fontWeight: '600', fontSize: Typography.size.sm },
  intensityLabelActive: { color: Colors.accent },
  glucoseRow: { flexDirection: 'row', gap: Spacing.sm },
  footer: { padding: Spacing.base },
});
