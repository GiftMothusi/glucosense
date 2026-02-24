import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, ViewStyle, TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients } from '../../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, variant = 'default' }) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.cardElevated,
    variant === 'outlined' && styles.cardOutlined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md',
  loading, disabled, style, fullWidth,
}) => {
  const btnStyle: ViewStyle[] = [
    styles.btn,
    styles[`btn_${size}`] as ViewStyle,
    variant !== 'primary' ? (styles[`btn_${variant}`] as ViewStyle) : {},
  ];
  
  if (disabled || loading) btnStyle.push(styles.btnDisabled);
  if (fullWidth) btnStyle.push({ width: '100%' as const });
  if (style) btnStyle.push(style as ViewStyle);
  
  const textStyle: TextStyle[] = [
    styles.btnText,
    styles[`btnText_${variant}`] as TextStyle,
    styles[`btnText_${size}`] as TextStyle,
  ];

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[...btnStyle, { overflow: 'hidden' }]}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBtn}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <Text style={textStyle}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'danger' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  editable?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label, value, onChangeText, placeholder, error,
  secureTextEntry, keyboardType, autoCapitalize, multiline,
  numberOfLines, style, rightElement, leftElement, editable = true,
}) => {
  const inputStyle: TextStyle[] = [styles.input];
  if (leftElement) inputStyle.push({ paddingLeft: 0 });
  if (rightElement) inputStyle.push({ paddingRight: 0 });
  
  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError, !editable && styles.inputDisabled]}>
        {leftElement && <View style={styles.inputAdornment}>{leftElement}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          style={inputStyle}
        />
        {rightElement && <View style={styles.inputAdornment}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.inputErrorText}>{error}</Text>}
    </View>
  );
};

interface GlucoseBadgeProps {
  value: number;
  unit?: 'mmol' | 'mgdl';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  targetLow?: number;
  targetHigh?: number;
}

export const GlucoseBadge: React.FC<GlucoseBadgeProps> = ({
  value, unit = 'mmol', size = 'md', showLabel = false,
  targetLow = 3.9, targetHigh = 10.0,
}) => {
  const { getGlucoseColor, getGlucoseLabel } = require('../../theme/theme');
  const color = getGlucoseColor(unit === 'mgdl' ? value / 18.0182 : value, targetLow, targetHigh);
  const label = getGlucoseLabel(unit === 'mgdl' ? value / 18.0182 : value, targetLow, targetHigh);
  const displayValue = unit === 'mmol' ? value.toFixed(1) : Math.round(value).toString();

  const sizes = {
    sm: { value: 20, unit: 11, label: 10 },
    md: { value: 28, unit: 13, label: 11 },
    lg: { value: 40, unit: 16, label: 13 },
    xl: { value: 56, unit: 20, label: 15 },
  };

  return (
    <View style={styles.glucoseBadge}>
      <Text style={[styles.glucoseValue, { color, fontSize: sizes[size].value }]}>
        {displayValue}
      </Text>
      <Text style={[styles.glucoseUnit, { color, fontSize: sizes[size].unit }]}>
        {unit === 'mmol' ? 'mmol/L' : 'mg/dL'}
      </Text>
      {showLabel && (
        <Text style={[styles.glucoseLabel, { color, fontSize: sizes[size].label }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

interface SectionHeaderProps {
  title: string;
  rightAction?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, rightAction, style }) => (
  <View style={[styles.sectionHeader, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {rightAction && (
      <TouchableOpacity onPress={rightAction.onPress}>
        <Text style={styles.sectionAction}>{rightAction.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

import { Icon, IconName } from '../Icon';

interface EmptyStateProps {
  icon?: IconName;
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, emoji, title, subtitle, action }) => (
  <View style={styles.emptyState}>
    {icon ? <Icon name={icon} size={48} color={Colors.textMuted} /> : <Text style={styles.emptyEmoji}>{emoji}</Text>}
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && (
      <Button label={action.label} onPress={action.onPress} style={{ marginTop: Spacing.lg }} />
    )}
  </View>
);

interface PillProps {
  label: string;
  color?: string;
  style?: ViewStyle;
}

export const Pill: React.FC<PillProps> = ({ label, color = Colors.accent, style }) => (
  <View style={[styles.pill, { backgroundColor: color + '20', borderColor: color + '40' }, style]}>
    <Text style={[styles.pillText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardElevated: {
    backgroundColor: Colors.surface,
    ...Shadows.md,
  },
  cardOutlined: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowOpacity: 0,
    elevation: 0,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  gradientBtn: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  btn_secondary: { 
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  btn_ghost: { 
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  btn_danger: { backgroundColor: Colors.error },
  btn_sm: { height: 36 },
  btn_md: { height: 48 },
  btn_lg: { height: 56 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontWeight: '600', letterSpacing: 0.3 },
  btnText_primary: { color: Colors.textInverse },
  btnText_secondary: { color: Colors.primary },
  btnText_ghost: { color: Colors.primary },
  btnText_danger: { color: Colors.textInverse },
  btnText_sm: { fontSize: Typography.size.sm },
  btnText_md: { fontSize: Typography.size.base },
  btnText_lg: { fontSize: Typography.size.md },

  inputWrapper: { gap: Spacing.xs },
  inputLabel: { color: Colors.textSecondary, fontSize: Typography.size.sm, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    minHeight: 54,
    paddingHorizontal: Spacing.base,
    ...Shadows.sm,
  },
  inputError: { borderColor: Colors.error, borderWidth: 2 },
  inputDisabled: { opacity: 0.6, backgroundColor: Colors.backgroundTint },
  input: { 
    flex: 1, 
    color: Colors.textPrimary, 
    fontSize: Typography.size.base,
    paddingVertical: Spacing.sm,
  },
  inputAdornment: { paddingHorizontal: Spacing.xs },
  inputErrorText: { color: Colors.error, fontSize: Typography.size.xs, fontWeight: '500' },

  glucoseBadge: { alignItems: 'center' },
  glucoseValue: { fontWeight: '700', letterSpacing: -1 },
  glucoseUnit: { fontWeight: '500', opacity: 0.8, marginTop: -2 },
  glucoseLabel: { fontWeight: '600', marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { color: Colors.textHeading, fontSize: Typography.size.md, fontWeight: '700' },
  sectionAction: { color: Colors.primary, fontSize: Typography.size.sm, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing['2xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.base },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.size.lg, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: Typography.size.base, textAlign: 'center', marginTop: Spacing.sm },

  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  pillText: { fontSize: Typography.size.xs, fontWeight: '600' },
});
