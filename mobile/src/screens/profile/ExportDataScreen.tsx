import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card, Button } from '../../components/common';
import { analyticsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const PERIODS = [
  { label: '7 days',  value: 7  },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function ExportDataScreen() {
  const { user } = useAuthStore();
  const [selectedDays, setSelectedDays] = useState(30);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExportPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await analyticsApi.downloadReport(selectedDays);

      const bytes    = new Uint8Array(response.data as ArrayBuffer);
      let binary     = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const filename  = `GlucoSense_Report_${selectedDays}days_${Date.now()}.pdf`;
      const fileUri   = `${FileSystem.Paths.cache}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: 'base64',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert(
          'Sharing Not Available',
          `Report saved to:\n${fileUri}`,
        );
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: `GlucoSense Report — Last ${selectedDays} Days`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e: any) {
      console.error('Export error:', e);
      Alert.alert(
        'Export Failed',
        e?.response?.data
          ? 'Could not generate report. Make sure you have glucose readings logged.'
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.intro}>
          Export a clinical PDF report of your glucose data to share with your
          doctor or healthcare team.
        </Text>

        <Text style={styles.sectionLabel}>WHAT'S INCLUDED</Text>
        <Card style={styles.includesCard}>
          {[
            { icon: 'water-outline',     color: Colors.primary,    text: 'Glucose summary & statistics' },
            { icon: 'time-outline',      color: Colors.accent,     text: 'Time in Range breakdown (5 zones)' },
            { icon: 'trending-up-outline', color: Colors.inRange,  text: 'Daily averages table' },
            { icon: 'analytics-outline', color: Colors.chartMeal,  text: 'Glucose patterns detected' },
            { icon: 'calculator-outline',color: Colors.warning,    text: 'Estimated HbA1c & CV%' },
          ].map((item, index, arr) => (
            <View key={item.text}>
              <View style={styles.includeRow}>
                <View style={[styles.includeIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={styles.includeText}>{item.text}</Text>
              </View>
              {index < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>REPORT PERIOD</Text>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.periodCard,
                selectedDays === p.value && styles.periodCardSelected,
              ]}
              onPress={() => setSelectedDays(p.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.periodLabel,
                selectedDays === p.value && styles.periodLabelSelected,
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIconWrap}>
              <Ionicons name="document-text" size={32} color={Colors.primary} />
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle}>Clinical Glucose Report</Text>
              <Text style={styles.previewSub}>
                {user?.full_name} · Last {selectedDays} days
              </Text>
              <Text style={styles.previewMeta}>PDF · Generated on export</Text>
            </View>
          </View>
        </Card>

        <Button
          label={isDownloading ? 'Generating Report…' : `Export ${selectedDays}-Day Report`}
          onPress={handleExportPDF}
          loading={isDownloading}
          fullWidth
          style={styles.exportButton}
        />

        <View style={styles.disclaimerWrap}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            This report is for informational purposes only. Always consult your
            healthcare provider for medical advice and treatment decisions.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  scroll:             { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },

  intro:              { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 22 },
  sectionLabel:       { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xs },

  includesCard:       { padding: 0, overflow: 'hidden' },
  includeRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  includeIcon:        { width: 34, height: 34, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  includeText:        { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '500', flex: 1 },
  divider:            { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 62 },

  periodRow:          { flexDirection: 'row', gap: Spacing.sm },
  periodCard:         {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
    borderColor: Colors.surfaceBorder, backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  periodCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryAlpha10 },
  periodLabel:        { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600' },
  periodLabelSelected:{ color: Colors.primary },

  previewCard:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  previewHeader:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  previewIconWrap:    {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryAlpha10,
    alignItems: 'center', justifyContent: 'center',
  },
  previewInfo:        { flex: 1 },
  previewTitle:       { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '700' },
  previewSub:         { color: Colors.textSecondary, fontSize: Typography.size.sm, marginTop: 2 },
  previewMeta:        { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },

  exportButton:       { marginTop: Spacing.xs },

  disclaimerWrap:     { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', paddingHorizontal: Spacing.xs },
  disclaimerText:     { color: Colors.textMuted, fontSize: Typography.size.xs, lineHeight: 18, flex: 1 },
});