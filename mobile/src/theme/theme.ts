/**
 * GlucoSense Design System
 * Medical-grade premium light theme with blue-to-teal gradient branding
 */

export const Colors = {
  // Brand gradient colors
  primaryBlue: '#1E6FD9',
  accentTeal: '#00C2A8',
  softGreen: '#3ED598',
  midBlue: '#2E8BFF',
  
  // Primary palette
  primary: '#1E6FD9',
  primaryLight: '#4A8EE6',
  primaryDark: '#1557B8',

  // Accent
  accent: '#00C2A8',
  accentLight: '#33D4B2',
  accentDark: '#00A08C',

  // Glucose status (softer, medical-grade)
  inRange: '#3ED598',     // soft green
  low: '#F59E0B',         // amber
  veryLow: '#EF4444',     // red
  high: '#F97316',        // orange
  veryHigh: '#DC2626',    // deep red

  // UI - Light mode
  background: '#FFFFFF',
  backgroundTint: '#F4F9FF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceBorder: '#E5E7EB',
  surfaceTint: '#F4F9FF',

  // Text - Light mode
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  textHeading: '#1E6FD9',

  // Status
  success: '#3ED598',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#1E6FD9',

  // Chart colours
  chartGlucose: '#00C2A8',
  chartTarget: '#E5E7EB',
  chartTargetRange: '#E6F9F3',
  chartMeal: '#8B5CF6',
  chartInsulin: '#1E6FD9',
  chartActivity: '#F59E0B',

  // Transparent variants
  accentAlpha10: 'rgba(0, 194, 168, 0.10)',
  accentAlpha20: 'rgba(0, 194, 168, 0.20)',
  primaryAlpha10: 'rgba(30, 111, 217, 0.10)',
  primaryAlpha20: 'rgba(30, 111, 217, 0.20)',
  errorAlpha10: 'rgba(239, 68, 68, 0.10)',
  warningAlpha10: 'rgba(245, 158, 11, 0.10)',
  successAlpha10: 'rgba(62, 213, 152, 0.10)',
  black10: 'rgba(0, 0, 0, 0.10)',
  black20: 'rgba(0, 0, 0, 0.20)',
  black50: 'rgba(0, 0, 0, 0.50)',
};

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 40,
    '5xl': 48,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#1E6FD9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E6FD9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E6FD9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#1E6FD9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  glow: {
    shadowColor: '#00C2A8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Gradient definitions
export const Gradients = {
  primary: ['#1E6FD9', '#2E8BFF', '#00C2A8'] as const,
  primaryAngle: 135,
  subtle: ['#F4F9FF', '#FFFFFF'] as const,
  card: ['#FFFFFF', '#F4F9FF'] as const,
};

// Glucose value → display color
export function getGlucoseColor(mmol: number, low = 3.9, high = 10.0): string {
  if (mmol < 3.0) return Colors.veryLow;
  if (mmol < low) return Colors.low;
  if (mmol <= high) return Colors.inRange;
  if (mmol <= 13.9) return Colors.high;
  return Colors.veryHigh;
}

// Glucose value → label
export function getGlucoseLabel(mmol: number, low = 3.9, high = 10.0): string {
  if (mmol < 3.0) return 'Very Low';
  if (mmol < low) return 'Low';
  if (mmol <= high) return 'In Range';
  if (mmol <= 13.9) return 'High';
  return 'Very High';
}

// TIR ring arc colours (in order)
export const TIR_COLORS = {
  veryLow: Colors.veryLow,
  low: Colors.low,
  inRange: Colors.inRange,
  high: Colors.high,
  veryHigh: Colors.veryHigh,
};

export const Theme = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};
