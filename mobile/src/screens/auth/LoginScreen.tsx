import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/theme';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    await login(email.trim(), password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <Image
              source={require('../../../assets/glucosense_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.errorDismiss}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.showHide}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email || !password}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.sm }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerCTA}>Create one free</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing['3xl'] },

  brand: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logo: { width: 220, height: 220 },

  form: { gap: Spacing.md },
  title: { color: Colors.textPrimary, fontSize: Typography.size['2xl'], fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.size.base, marginTop: -4 },

  errorBanner: {
    backgroundColor: Colors.errorAlpha10,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: Colors.error, flex: 1, fontSize: Typography.size.sm },
  errorDismiss: { color: Colors.error, fontWeight: '700', marginLeft: Spacing.sm },

  showHide: { fontSize: 18 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.surfaceBorder },
  dividerText: { color: Colors.textMuted, fontSize: Typography.size.sm },

  registerLink: { alignItems: 'center' },
  registerText: { color: Colors.textSecondary, fontSize: Typography.size.base },
  registerCTA: { color: Colors.accent, fontWeight: '700' },
});
