import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Card, SectionHeader, Button, EmptyState } from '../../components/common';
import { careApi } from '../../services/api';

export default function CareScreen() {
  const [medications, setMedications] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [supplies, setSupplies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [meds, ctcs, sups] = await Promise.all([
          careApi.getMedications(),
          careApi.getContacts(),
          careApi.getSupplies(),
        ]);
        setMedications(meds.data);
        setContacts(ctcs.data);
        setSupplies(sups.data);
      } catch {} finally { setIsLoading(false); }
    };
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Care</Text>

        <SectionHeader title="Medications" rightAction={{ label: '+ Add', onPress: () => Alert.alert('Add Medication', 'Full form coming soon') }} />
        {medications.length > 0 ? medications.map((m) => (
          <Card key={m.id} style={styles.item}>
            <Text style={styles.itemTitle}>💊 {m.name}</Text>
            <Text style={styles.itemSub}>{m.dose} · {m.frequency}</Text>
          </Card>
        )) : <EmptyState emoji="💊" title="No medications" subtitle="Add your medications to track adherence" />}

        <SectionHeader title="Emergency Contacts" rightAction={{ label: '+ Add', onPress: () => Alert.alert('Add Contact', 'Full form coming soon') }} style={{ marginTop: Spacing.lg }} />
        {contacts.length > 0 ? contacts.map((c) => (
          <Card key={c.id} style={styles.item}>
            <Text style={styles.itemTitle}>👤 {c.name}</Text>
            {c.phone && <Text style={styles.itemSub}>{c.phone} · {c.relationship}</Text>}
          </Card>
        )) : <EmptyState emoji="📞" title="No emergency contacts" subtitle="Add contacts to notify in case of severe hypos" />}

        <SectionHeader title="Supplies" rightAction={{ label: '+ Add', onPress: () => Alert.alert('Add Supply', 'Full form coming soon') }} style={{ marginTop: Spacing.lg }} />
        {supplies.length > 0 ? supplies.map((s) => (
          <Card key={s.id} style={styles.item}>
            <View style={styles.supplyRow}>
              <Text style={styles.itemTitle}>📦 {s.name}</Text>
              <Text style={styles.supplyQty}>{s.quantity} {s.unit}</Text>
            </View>
            {s.estimated_depletion_date && (
              <Text style={styles.itemSub}>
                Runs out: {new Date(s.estimated_depletion_date).toLocaleDateString()}
              </Text>
            )}
          </Card>
        )) : <EmptyState emoji="📦" title="No supplies tracked" subtitle="Track test strips, sensors, and insulin supplies" />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl'] },
  title: { color: Colors.textPrimary, fontSize: Typography.size['2xl'], fontWeight: '800', paddingTop: Spacing.md, marginBottom: Spacing.sm },
  item: { gap: 4 },
  itemTitle: { color: Colors.textPrimary, fontWeight: '600', fontSize: Typography.size.base },
  itemSub: { color: Colors.textMuted, fontSize: Typography.size.sm },
  supplyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supplyQty: { color: Colors.accent, fontWeight: '700', fontSize: Typography.size.base },
});
