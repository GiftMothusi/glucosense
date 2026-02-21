import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme/theme';
import { Card, Button } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const MENU_ITEMS = [
    { emoji: '👤', label: 'Personal Info', onPress: () => Alert.alert('Personal Info', 'Coming soon') },
    { emoji: '🩺', label: 'Diabetes Profile', onPress: () => Alert.alert('Diabetes Profile', 'Coming soon') },
    { emoji: '🎯', label: 'Glucose Targets', onPress: () => Alert.alert('Targets', 'Coming soon') },
    { emoji: '🔔', label: 'Notifications', onPress: () => Alert.alert('Notifications', 'Coming soon') },
    { emoji: '🔒', label: 'Privacy & Security', onPress: () => Alert.alert('Privacy', 'Coming soon') },
    { emoji: '📤', label: 'Export Data', onPress: () => Alert.alert('Export', 'Coming soon') },
    { emoji: '❓', label: 'Help & Support', onPress: () => Alert.alert('Help', 'Coming soon') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + name */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.diabetes_profile && (
            <Text style={styles.diabetesType}>
              {user.diabetes_profile.diabetes_type.replace('_', ' ').toUpperCase()}
            </Text>
          )}
        </View>

        {/* Subscription banner */}
        {!user?.is_premium ? (
          <Card style={styles.premiumCard} onPress={() => Alert.alert('Upgrade', 'Payment flow coming soon')}>
            <Text style={styles.premiumEmoji}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumSub}>$7.99/month · AI insights, CGM sync, doctor reports</Text>
            </View>
            <Text style={{ color: Colors.accent, fontSize: 20 }}>›</Text>
          </Card>
        ) : (
          <Card style={[styles.premiumCard, styles.premiumActive]}>
            <Text style={styles.premiumEmoji}>⭐</Text>
            <Text style={styles.premiumTitle}>Premium Active</Text>
          </Card>
        )}

        {/* Menu */}
        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
              {i < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </Card>

        <Button
          label="Sign Out"
          onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
          ])}
          variant="ghost"
          fullWidth
          style={{ marginTop: Spacing.sm }}
        />

        <Text style={styles.version}>GlucoSense v1.0.0 · Your data is encrypted and never sold.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  profileHeader: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.textInverse, fontSize: Typography.size['2xl'], fontWeight: '800' },
  name: { color: Colors.textPrimary, fontSize: Typography.size.xl, fontWeight: '800' },
  email: { color: Colors.textSecondary, fontSize: Typography.size.base },
  diabetesType: { color: Colors.accent, fontSize: Typography.size.sm, fontWeight: '700', backgroundColor: Colors.accentAlpha10, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  premiumCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.accent + '40', backgroundColor: Colors.primaryLight },
  premiumActive: { backgroundColor: Colors.accentAlpha10, borderColor: Colors.accent },
  premiumEmoji: { fontSize: 24 },
  premiumTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: Typography.size.base },
  premiumSub: { color: Colors.textSecondary, fontSize: Typography.size.xs },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  menuEmoji: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '500' },
  menuArrow: { color: Colors.textMuted, fontSize: 20 },
  menuDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 60 },
  version: { color: Colors.textMuted, fontSize: Typography.size.xs, textAlign: 'center', lineHeight: 18 },
});
