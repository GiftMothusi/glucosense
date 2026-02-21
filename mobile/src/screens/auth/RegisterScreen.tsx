import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setPasswordError('');
    try {
      console.log('Attempting registration...');
      await register(email.trim(), password, fullName.trim());
      console.log('Registration completed');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>← Back</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Free forever — upgrade when ready</Text>

          <View style={styles.form}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Smith" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min. 8 characters" secureTextEntry />
            <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry error={passwordError} />

            <Button label="Create Account" onPress={handleRegister} loading={isLoading} disabled={!email || !password || !fullName} fullWidth size="lg" />

            <Text style={styles.terms}>
              By creating an account you agree to our{' '}
              <Text style={styles.link}>Terms of Service</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>. Your health data is encrypted and never sold.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.xl, gap: Spacing.md },
  header: { marginBottom: Spacing.sm },
  back: { color: Colors.accent, fontSize: Typography.size.base },
  title: { color: Colors.textPrimary, fontSize: Typography.size['2xl'], fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.size.base },
  form: { gap: Spacing.md },
  errorBanner: {
    backgroundColor: Colors.errorAlpha10, borderWidth: 1, borderColor: Colors.error + '40',
    borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: Typography.size.sm },
  terms: { color: Colors.textMuted, fontSize: Typography.size.xs, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.accent },
});
