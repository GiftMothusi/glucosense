import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Switch, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Card, Input, Button } from '../../components/common';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const BIOMETRIC_KEY = 'biometric_enabled';

export default function PrivacySecurityScreen() {
  const { logout } = useAuthStore();

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType,      setBiometricType]      = useState('Biometrics');
  const [biometricEnabled,   setBiometricEnabled]   = useState(false);
  const [isCheckingBio,      setIsCheckingBio]      = useState(true);

  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [passwordErrors,   setPasswordErrors]   = useState<Record<string, string>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const init = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled   = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);

      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        }
      }

      const saved = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      setBiometricEnabled(saved === 'true');
      setIsCheckingBio(false);
    };
    init();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType} for GlucoSense`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (!result.success) return;
    }
    await SecureStore.setItemAsync(BIOMETRIC_KEY, value ? 'true' : 'false');
    setBiometricEnabled(value);
    Alert.alert(
      value ? `${biometricType} Enabled` : `${biometricType} Disabled`,
      value
        ? `GlucoSense will require ${biometricType} when you return to the app.`
        : 'Biometric lock has been turned off.',
    );
  };

  const validatePassword = () => {
    const e: Record<string, string> = {};
    if (!currentPassword) e.current = 'Enter your current password';
    if (!newPassword)      e.new     = 'Enter a new password';
    else if (newPassword.length < 8) e.new = 'Password must be at least 8 characters';
    if (!confirmPassword)  e.confirm = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) e.confirm = 'Passwords do not match';
    if (currentPassword && newPassword && currentPassword === newPassword) {
      e.new = 'New password must be different from your current password';
    }
    setPasswordErrors(e);
    return Object.keys(e).length === 0;
  };

  const getPasswordStrength = (pwd: string): { label: string; color: string; bars: number } => {
    if (!pwd) return { label: '', color: Colors.surfaceBorder, bars: 0 };
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak',   color: Colors.veryLow, bars: 1 };
    if (score <= 3) return { label: 'Fair',   color: Colors.warning,  bars: 2 };
    if (score === 4) return { label: 'Good',  color: Colors.inRange,  bars: 3 };
    return              { label: 'Strong', color: Colors.primary,   bars: 4 };
  };

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setIsSavingPassword(true);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      Alert.alert(
        'Password Changed',
        'Your password has been updated. Please use your new password next time you sign in.',
      );
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail === 'Current password is incorrect') {
        setPasswordErrors({ current: 'Current password is incorrect' });
      } else {
        Alert.alert('Error', detail ?? 'Failed to change password. Please try again.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your health data. This cannot be undone.\n\nPlease email support@glucosense.health to request account deletion.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: () => {
          Alert.alert(
            'Contact Support',
            'Please email support@glucosense.health to request account deletion.'
          );
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>BIOMETRIC LOCK</Text>
        <Card style={styles.groupCard}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.primaryAlpha10 }]}>
              <Ionicons
                name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.labelWrap}>
              <Text style={styles.label}>{biometricType}</Text>
              <Text style={styles.sub}>
                {!biometricSupported
                  ? 'Not available on this device'
                  : biometricEnabled
                  ? 'App locked when you leave'
                  : 'Require authentication on app resume'}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!biometricSupported || isCheckingBio}
              trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
              thumbColor={Colors.textInverse}
            />
          </View>
        </Card>
        {!biometricSupported && !isCheckingBio && (
          <Text style={styles.hint}>
            No biometrics enrolled on this device. Enable fingerprint or Face ID in your device settings first.
          </Text>
        )}

        <Text style={styles.sectionLabel}>CHANGE PASSWORD</Text>
        <Card style={styles.passwordCard}>

          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            autoCapitalize="none"
            error={passwordErrors.current}
            rightElement={
              <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            autoCapitalize="none"
            error={passwordErrors.new}
            rightElement={
              <TouchableOpacity onPress={() => setShowNew((v) => !v)}>
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          {newPassword.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((bar) => (
                  <View
                    key={bar}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: bar <= strength.bars ? strength.color : Colors.surfaceBorder },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            error={passwordErrors.confirm}
            rightElement={
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          <Button
            label="Update Password"
            onPress={handleChangePassword}
            loading={isSavingPassword}
            fullWidth
          />
        </Card>

        <Text style={styles.sectionLabel}>DATA & PRIVACY</Text>
        <Card style={styles.groupCard}>
          {[
            {
              icon: 'shield-checkmark-outline' as const,
              color: Colors.inRange,
              label: 'Data Encryption',
              sub: 'All your data is encrypted at rest and in transit',
              arrow: false,
              onPress: undefined,
            },
            {
              icon: 'ban-outline' as const,
              color: Colors.inRange,
              label: 'No Ads. No Data Selling.',
              sub: 'Your health data is never sold or shared with advertisers',
              arrow: false,
              onPress: undefined,
            },
            {
              icon: 'document-text-outline' as const,
              color: Colors.primary,
              label: 'Privacy Policy',
              sub: 'View our full privacy policy',
              arrow: true,
              onPress: () => Alert.alert('Privacy Policy', 'Opens in browser — coming soon.'),
            },
            {
              icon: 'reader-outline' as const,
              color: Colors.primary,
              label: 'Terms of Service',
              sub: 'View our terms and conditions',
              arrow: true,
              onPress: () => Alert.alert('Terms of Service', 'Opens in browser — coming soon.'),
            },
          ].map((item, index, arr) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={item.arrow ? 0.7 : 1}
                onPress={item.onPress}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.labelWrap}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.sub}>{item.sub}</Text>
                </View>
                {item.arrow && (
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
              {index < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <Card style={{...styles.groupCard, ...styles.dangerCard}}>
          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <View style={[styles.iconWrap, { backgroundColor: Colors.errorAlpha10 }]}>
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </View>
            <View style={styles.labelWrap}>
              <Text style={[styles.label, { color: Colors.error }]}>Delete Account</Text>
              <Text style={styles.sub}>Permanently delete your account and all data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.error} />
          </TouchableOpacity>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  scroll:         { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
  sectionLabel:   { color: Colors.textMuted, fontSize: Typography.size.xs, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.sm },
  hint:           { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: -Spacing.xs, lineHeight: 18 },

  groupCard:      { padding: 0, overflow: 'hidden' },
  passwordCard:   { gap: Spacing.md },
  dangerCard:     { borderWidth: 1, borderColor: Colors.errorAlpha10 },

  row:            { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base },
  iconWrap:       { width: 36, height: 36, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  labelWrap:      { flex: 1 },
  label:          { color: Colors.textPrimary, fontSize: Typography.size.base, fontWeight: '500' },
  sub:            { color: Colors.textMuted, fontSize: Typography.size.xs, marginTop: 2, lineHeight: 16 },
  divider:        { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 68 },

  strengthWrap:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: -Spacing.xs },
  strengthBars:   { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar:    { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:  { fontSize: Typography.size.xs, fontWeight: '700', width: 44, textAlign: 'right' },
});