import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Input, Button, Card } from '../../components/common';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const GENDER_OPTIONS = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  non_binary: 'Non-binary',
  prefer_not_to_say: 'Prefer not to say',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function parseDobFromProfile(dateStr: string | null | undefined): { month: string; day: string; year: string } {
  if (!dateStr) return { month: '', day: '', year: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { month: '', day: '', year: '' };
  return {
    month: MONTHS[d.getMonth()],
    day: String(d.getDate()),
    year: String(d.getFullYear()),
  };
}

function MonthPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (m: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select Month</Text>
          <FlatList
            data={MONTHS}
            keyExtractor={(m) => m}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalOption, item === selected && styles.modalOptionSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[styles.modalOptionText, item === selected && styles.modalOptionTextSelected]}>
                  {item}
                </Text>
                {item === selected && (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function PersonalInfoScreen() {
  const { user, loadUser } = useAuthStore();
  const profile = user?.profile;

  const [fullName] = useState(user?.full_name ?? '');
  const [email]    = useState(user?.email ?? '');

  const initial = parseDobFromProfile(profile?.date_of_birth);
  const [dobMonth, setDobMonth] = useState(initial.month);
  const [dobDay,   setDobDay]   = useState(initial.day);
  const [dobYear,  setDobYear]  = useState(initial.year);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [gender,   setGender]   = useState(profile?.gender ?? '');
  const [heightCm, setHeightCm] = useState(profile?.height_cm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(profile?.weight_kg?.toString() ?? '');
  const [country,  setCountry]  = useState(profile?.country ?? '');
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC');
  const [isMmol,   setIsMmol]   = useState((profile?.glucose_unit ?? 'mmol') === 'mmol');

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (heightCm && (isNaN(h) || h < 50 || h > 300)) e.height = 'Enter a valid height (50–300 cm)';
    if (weightKg && (isNaN(w) || w < 10 || w > 500)) e.weight = 'Enter a valid weight (10–500 kg)';

    if (dobDay || dobMonth || dobYear) {
      const dayNum  = parseInt(dobDay, 10);
      const yearNum = parseInt(dobYear, 10);
      const now     = new Date().getFullYear();
      if (!dobMonth)                               e.dob = 'Select a month';
      else if (!dobDay || isNaN(dayNum) || dayNum < 1 || dayNum > 31) e.dob = 'Enter a valid day (1–31)';
      else if (!dobYear || isNaN(yearNum) || yearNum < 1900 || yearNum > now) e.dob = `Enter a valid year (1900–${now})`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildDobIso = (): string | undefined => {
    if (!dobMonth || !dobDay || !dobYear) return undefined;
    const monthIndex = MONTHS.indexOf(dobMonth);
    const d = new Date(parseInt(dobYear, 10), monthIndex, parseInt(dobDay, 10));
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await userApi.updateProfile({
        gender:        gender || undefined,
        height_cm:     heightCm ? parseFloat(heightCm) : undefined,
        weight_kg:     weightKg ? parseFloat(weightKg) : undefined,
        country:       country || undefined,
        timezone:      timezone || undefined,
        glucose_unit:  isMmol ? 'mmol' : 'mgdl',
        date_of_birth: buildDobIso(),
      });
      await loadUser();
      Alert.alert('Saved', 'Your personal info has been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail ?? 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <Card style={styles.readOnlyCard}>
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Full Name</Text>
            <Text style={styles.readOnlyValue}>{fullName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{email}</Text>
          </View>
        </Card>
        <Text style={styles.hint}>To change your name or email, contact support.</Text>

        <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>

        <Text style={styles.dobQuestion}>What's your date of birth?</Text>
        <View style={styles.dobRow}>
          <TouchableOpacity
            style={[styles.dobBox, styles.dobBoxMonth, errors.dob && styles.dobBoxError]}
            onPress={() => setShowMonthPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dobBoxText, !dobMonth && styles.dobBoxPlaceholder]}>
              {dobMonth || 'Month'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          <TextInput
            style={[styles.dobBox, errors.dob && styles.dobBoxError]}
            placeholder="Date"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
            value={dobDay}
            onChangeText={setDobDay}
          />

          <TextInput
            style={[styles.dobBox, errors.dob && styles.dobBoxError]}
            placeholder="Year"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            value={dobYear}
            onChangeText={setDobYear}
          />
        </View>
        {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.pillRow}>
          {GENDER_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.pill, gender === g && styles.pillSelected]}
              onPress={() => setGender(gender === g ? '' : g)}
            >
              <Text style={[styles.pillText, gender === g && styles.pillTextSelected]}>
                {GENDER_LABELS[g]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Input
              label="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              placeholder="e.g. 175"
              error={errors.height}
            />
          </View>
          <View style={styles.halfField}>
            <Input
              label="Weight (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              placeholder="e.g. 72"
              error={errors.weight}
            />
          </View>
        </View>

        <Input
          label="Country"
          value={country}
          onChangeText={setCountry}
          placeholder="e.g. South Africa"
          autoCapitalize="words"
        />

        <Input
          label="Timezone"
          value={timezone}
          onChangeText={setTimezone}
          placeholder="e.g. Africa/Johannesburg"
          autoCapitalize="none"
        />

        <Text style={styles.sectionLabel}>GLUCOSE UNIT</Text>
        <Card style={styles.toggleCard}>
          <Text style={styles.toggleLabel}>
            {isMmol ? 'mmol/L (millimoles per litre)' : 'mg/dL (milligrams per decilitre)'}
          </Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.unitLabel, !isMmol && styles.unitActive]}>mg/dL</Text>
            <Switch
              value={isMmol}
              onValueChange={setIsMmol}
              trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
              thumbColor={Colors.textInverse}
            />
            <Text style={[styles.unitLabel, isMmol && styles.unitActive]}>mmol/L</Text>
          </View>
        </Card>

        <Button
          label="Save Changes"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>

      <MonthPickerModal
        visible={showMonthPicker}
        selected={dobMonth}
        onSelect={setDobMonth}
        onClose={() => setShowMonthPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: Colors.background },
  scroll:                { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },

  sectionLabel:          { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.sm },
  hint:                  { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: -Spacing.xs },

  readOnlyCard:          { padding: 0, overflow: 'hidden' },
  readOnlyRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  readOnlyLabel:         { color: Colors.textSecondary, fontSize: Typography.size.base },
  readOnlyValue:         { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '500' },
  divider:               { height: 1, backgroundColor: Colors.surfaceBorder },

  // DOB
  dobQuestion:           { color: Colors.textPrimary, fontSize: Typography.size.md, fontWeight: '600', marginBottom: Spacing.sm },
  dobRow:                { flexDirection: 'row', gap: Spacing.sm },
  dobBox:                {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontSize: Typography.size.base,
    ...Shadows.sm,
  },
  dobBoxMonth:           { flex: 1.2 },
  dobBoxText:            { color: Colors.textPrimary, fontSize: Typography.size.base },
  dobBoxPlaceholder:     { color: Colors.textMuted },
  dobBoxError:           { borderColor: Colors.error },
  errorText:             { color: Colors.error, fontSize: Typography.size.xs, marginTop: -Spacing.xs },

  fieldLabel:            { color: Colors.textSecondary, fontSize: Typography.size.base, marginBottom: Spacing.xs },
  pillRow:               { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  pill:                  { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.surface },
  pillSelected:          { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText:              { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '500' },
  pillTextSelected:      { color: Colors.textInverse },

  row:                   { flexDirection: 'row', gap: Spacing.md },
  halfField:             { flex: 1 },

  toggleCard:            { gap: Spacing.sm },
  toggleLabel:           { color: Colors.textSecondary, fontSize: Typography.size.sm },
  toggleRow:             { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  unitLabel:             { color: Colors.textMuted, fontSize: Typography.size.base, fontWeight: '600' },
  unitActive:            { color: Colors.primary },

  // Modal
  modalOverlay:          { flex: 1, backgroundColor: Colors.black50, justifyContent: 'flex-end' },
  modalSheet:            { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'], maxHeight: '60%' },
  modalTitle:            { color: Colors.textPrimary, fontSize: Typography.size.md, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.md, paddingHorizontal: Spacing.base },
  modalOption:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  modalOptionSelected:   { backgroundColor: Colors.primaryAlpha10 },
  modalOptionText:       { color: Colors.textPrimary, fontSize: Typography.size.base },
  modalOptionTextSelected: { color: Colors.primary, fontWeight: '600' },
});