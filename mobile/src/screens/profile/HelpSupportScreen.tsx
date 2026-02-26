import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card } from '../../components/common';

const FAQS = [
  {
    q: 'How do I log a glucose reading?',
    a: 'Tap the Log tab at the bottom of the screen, then select "Glucose". Enter your reading value and tap Save.',
  },
  {
    q: 'What is Time in Range (TIR)?',
    a: 'Time in Range is the percentage of time your glucose stays within your target range. A TIR of 70% or more is the general clinical recommendation.',
  },
  {
    q: 'How is estimated HbA1c calculated?',
    a: 'GlucoSense estimates your HbA1c from your average glucose using the formula: HbA1c = (average mmol/L + 2.59) / 1.59. This is an estimate — always confirm with a lab test.',
  },
  {
    q: 'Can I sync a CGM device?',
    a: 'CGM sync is available on the Premium plan. Once subscribed, go to Diabetes Profile and enable CGM, then follow the device pairing instructions.',
  },
  {
    q: 'How do I share my data with my doctor?',
    a: 'Go to the Care tab and tap "Portal Links" to generate a secure read-only link you can share with your healthcare provider. You can also export a PDF report from Profile → Export Data.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Yes. All data is encrypted at rest and in transit. We never sell your data or share it with advertisers. See our Privacy Policy for full details.',
  },
  {
    q: 'How do I cancel my Premium subscription?',
    a: 'Subscriptions are managed through the App Store (iOS) or Google Play (Android). Go to your device subscription settings to cancel at any time.',
  },
];

// ─── Contact options ──────────────────────────────────────────────────────────
const CONTACT_OPTIONS = [
  {
    icon: 'mail-outline'     as const,
    color: Colors.primary,
    label: 'Email Support',
    sub: 'support@glucosense.health',
    onPress: () => Linking.openURL('mailto:support@glucosense.health'),
  },
  {
    icon: 'logo-github'      as const,
    color: Colors.textPrimary,
    label: 'Report a Bug',
    sub: 'github.com/GiftMothusi/glucosense',
    onPress: () => Linking.openURL('https://github.com/GiftMothusi/glucosense/issues'),
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.7}
    >
      <View style={faqStyles.header}>
        <Text style={faqStyles.question}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textMuted}
        />
      </View>
      {expanded && (
        <Text style={faqStyles.answer}>{answer}</Text>
      )}
    </TouchableOpacity>
  );
}

const faqStyles = StyleSheet.create({
  header:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.base },
  question: { flex: 1, color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600', lineHeight: 22 },
  answer:   { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 22, paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
});

export default function HelpSupportScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <Card style={styles.groupCard}>
          {CONTACT_OPTIONS.map((item, index, arr) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.row}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.labelWrap}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.sub}>{item.sub}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {index < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <Card style={styles.groupCard}>
          {FAQS.map((faq, index) => (
            <View key={faq.q}>
              <FAQItem question={faq.q} answer={faq.a} />
              {index < FAQS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <Card style={styles.groupCard}>
          {[
            { label: 'App Version',  value: '1.0.0' },
            { label: 'Build',        value: '1' },
            { label: 'Environment',  value: __DEV__ ? 'Development' : 'Production' },
          ].map((item, index, arr) => (
            <View key={item.label}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
              {index < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <Text style={styles.footer}>
          GlucoSense · Made with ❤️ for people living with diabetes.{'\n'}
          © {new Date().getFullYear()} GlucoSense. All rights reserved.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  sectionLabel: { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xs },

  groupCard:    { padding: 0, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconWrap:     { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  labelWrap:    { flex: 1 },
  label:        { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '500' },
  sub:          { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2 },
  divider:      { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: Spacing.base },

  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  infoLabel:    { color: Colors.textSecondary, fontSize: Typography.size.base },
  infoValue:    { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '600' },

  footer:       { color: Colors.textMuted, fontSize: Typography.size.xs, textAlign: 'center', lineHeight: 20, marginTop: Spacing.md },
});