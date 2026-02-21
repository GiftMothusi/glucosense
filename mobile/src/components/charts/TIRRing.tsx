import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, Typography } from '../../theme/theme';

interface TIRRingProps {
  inRange: number;
  low: number;
  veryLow: number;
  high: number;
  veryHigh: number;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

const SEGMENTS = [
  { key: 'inRange', label: 'In Range', color: Colors.inRange },
  { key: 'low', label: 'Low', color: Colors.low },
  { key: 'veryLow', label: 'Very Low', color: Colors.veryLow },
  { key: 'high', label: 'high', color: Colors.high },
  { key: 'veryHigh', label: 'Very High', color: Colors.veryHigh },
];

export const TIRRing: React.FC<TIRRingProps> = ({
  inRange, low, veryLow, high, veryHigh,
  size = 140, strokeWidth = 16, showLegend = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const values = [inRange, low, veryLow, high, veryHigh];
  const colors = [Colors.inRange, Colors.low, Colors.veryLow, Colors.high, Colors.veryHigh];

  let cumulativeOffset = 0;

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center},${center}`}>
            {/* Background ring */}
            <Circle
              cx={center} cy={center} r={radius}
              stroke={Colors.surfaceBorder} strokeWidth={strokeWidth}
              fill="none"
            />
            {values.map((value, index) => {
              if (value <= 0) { return null; }
              const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeOffset;
              cumulativeOffset += (value / 100) * circumference;

              return (
                <Circle
                  key={index}
                  cx={center} cy={center} r={radius}
                  stroke={colors[index]}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </G>
        </Svg>
        <View style={[styles.centerLabel, { width: size, height: size }]}>
          <Text style={styles.centerValue}>{Math.round(inRange)}%</Text>
          <Text style={styles.centerSubtext}>in range</Text>
        </View>
      </View>

      {showLegend && (
        <View style={styles.legend}>
          {SEGMENTS.map((seg, i) => (
            <View key={seg.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <Text style={styles.legendLabel}>{seg.label}</Text>
              <Text style={styles.legendValue}>{values[i].toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data, width = 120, height = 40, color = Colors.chartGlucose,
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Svg width={width} height={height}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  ringWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    color: Colors.textPrimary,
    fontSize: Typography.size['2xl'],
    fontWeight: '800',
  },
  centerSubtext: {
    color: Colors.textSecondary,
    fontSize: Typography.size.xs,
    fontWeight: '500',
  },
  legend: { width: '100%', gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, color: Colors.textSecondary, fontSize: Typography.size.sm },
  legendValue: { color: Colors.textPrimary, fontSize: Typography.size.sm, fontWeight: '600' },
});
