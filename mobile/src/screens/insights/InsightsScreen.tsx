import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card, SectionHeader, EmptyState, Pill } from '../../components/common';
import { TIRRing } from '../../components/charts/TIRRing';
import { analyticsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useGlucoseStore } from '../../store/glucoseStore';

export default function InsightsScreen() {
  const { user } = useAuthStore();
  const { stats7, stats30, fetchStats } = useGlucoseStore();
  const [insights, setInsights] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<7 | 14 | 30>(14);

  const loadData = async () => {
    setIsLoading(true);
    await fetchStats(period);
    if (user?.is_premium) {
      try {
        const { data } = await analyticsApi.insights();
        setInsights(data.insights || []);
      } catch {}
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [period]);

  const stats = period === 7 ? stats7 : stats30;

  const SEVERITY_COLORS: Record<string, string> = {
    warning: Colors.warning,
    critical: Colors.error,
    info: Colors.accent,
    pattern: Colors.chartMeal,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={Colors.accent} />}
      >
        <Text style={styles.title}>Insights</Text>

        <View style={styles.periodRow}>
          {([7, 14, 30] as const).map((p) => (
            <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodLabel, period === p && styles.periodLabelActive]}>{p} days</Text>
            </TouchableOpacity>
          ))}
        </View>

        {stats ? (
          <Card style={styles.tirCard}>
            <SectionHeader title={`Time In Range — ${period} days`} />
            <TIRRing
              inRange={stats.tir.in_range_pct}
              low={stats.tir.below_pct}
              veryLow={stats.tir.very_low_pct}
              high={stats.tir.above_pct}
              veryHigh={stats.tir.very_high_pct}
              size={150}
              strokeWidth={18}
              showLegend
            />

            <View style={styles.statsGrid}>
              {[
                { label: 'Average', value: `${stats.average_mmol.toFixed(1)} mmol/L` },
                { label: 'Est. HbA1c', value: `${stats.estimated_hba1c}%` },
                { label: 'Std Dev', value: `${stats.std_dev.toFixed(1)}` },
                { label: 'CV', value: `${stats.coefficient_of_variation.toFixed(0)}%` },
              ].map((s) => (
                <View key={s.label} style={styles.statBox}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <EmptyState emoji="📊" title="Not enough data" subtitle="Log a few glucose readings to see your stats." />
        )}

        {user?.is_premium ? (
          <>
            <SectionHeader title="Patterns & Insights" style={{ marginTop: Spacing.lg }} />
            {insights.length > 0 ? (
              insights.map((insight, i) => (
                <Card key={i} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Pill label={insight.category} color={SEVERITY_COLORS[insight.category] || Colors.accent} />
                  </View>
                  <Text style={styles.insightBody}>{insight.body}</Text>
                  {insight.confidence && (
                    <Text style={styles.insightConfidence}>Confidence: {Math.round(insight.confidence * 100)}%</Text>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState emoji="🔍" title="No patterns yet" subtitle="Keep logging for 2+ weeks to unlock pattern detection." />
            )}
          </>
        ) : (
          <Card style={styles.premiumBanner}>
            <Text style={styles.premiumEmoji}>✨</Text>
            <Text style={styles.premiumTitle}>Unlock AI Insights</Text>
            <Text style={styles.premiumSub}>Upgrade to Premium to see pattern detection, predictions, meal impact scores, and weekly reports.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  title: { color: Colors.textPrimary, fontSize: Typography.size['2xl'], fontWeight: '800', paddingTop: Spacing.md },
  periodRow: { flexDirection: 'row', gap: Spacing.sm },
  periodBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  periodBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentAlpha10 },
  periodLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600' },
  periodLabelActive: { color: Colors.accent },
  tirCard: { gap: Spacing.lg, alignItems: 'center', padding: Spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, width: '100%' },
  statBox: { width: '47%', backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.md, gap: 4 },
  statLabel: { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '500' },
  statValue: { color: Colors.textPrimary, fontSize: Typography.size.md, fontWeight: '700' },
  insightCard: { gap: Spacing.sm },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  insightTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: Typography.size.base, flex: 1, marginRight: Spacing.sm },
  insightBody: { color: Colors.textSecondary, fontSize: Typography.size.sm, lineHeight: 20 },
  insightConfidence: { color: Colors.textMuted, fontSize: Typography.size.xs },
  premiumBanner: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.md, borderWidth: 1, borderColor: Colors.accent + '40', backgroundColor: Colors.primaryLight },
  premiumEmoji: { fontSize: 40 },
  premiumTitle: { color: Colors.textPrimary, fontWeight: '800', fontSize: Typography.size.lg },
  premiumSub: { color: Colors.textSecondary, fontSize: Typography.size.sm, textAlign: 'center', lineHeight: 20 },
});
