import React from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../theme/theme';

export type IconName =
  | 'home'
  | 'add'
  | 'insights'
  | 'care'
  | 'profile'
  | 'glucose'
  | 'meal'
  | 'insulin'
  | 'activity'
  | 'medication'
  | 'contact'
  | 'supplies'
  | 'premium'
  | 'chart'
  | 'search'
  | 'fasting'
  | 'pre-meal'
  | 'post-meal'
  | 'bedtime'
  | 'exercise'
  | 'sick'
  | 'person'
  | 'diabetes'
  | 'target'
  | 'notification'
  | 'security'
  | 'export'
  | 'help'
  | 'star'
  | 'sparkles'
  | 'arrow-right'
  | 'wave'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'check'
  | 'flag';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

const iconMap: Record<IconName, { library: 'ionicons' | 'material' | 'feather'; icon: string }> = {
  home: { library: 'ionicons', icon: 'home' },
  add: { library: 'ionicons', icon: 'add-circle' },
  insights: { library: 'ionicons', icon: 'analytics' },
  care: { library: 'ionicons', icon: 'medical' },
  profile: { library: 'ionicons', icon: 'person' },
  glucose: { library: 'ionicons', icon: 'water' },
  meal: { library: 'ionicons', icon: 'restaurant' },
  insulin: { library: 'material', icon: 'needle' },
  activity: { library: 'ionicons', icon: 'fitness' },
  medication: { library: 'ionicons', icon: 'medical' },
  contact: { library: 'ionicons', icon: 'people' },
  supplies: { library: 'ionicons', icon: 'cube' },
  premium: { library: 'ionicons', icon: 'sparkles' },
  chart: { library: 'ionicons', icon: 'bar-chart' },
  search: { library: 'ionicons', icon: 'search' },
  fasting: { library: 'ionicons', icon: 'moon' },
  'pre-meal': { library: 'ionicons', icon: 'time' },
  'post-meal': { library: 'ionicons', icon: 'checkmark-circle' },
  bedtime: { library: 'ionicons', icon: 'bed' },
  exercise: { library: 'ionicons', icon: 'barbell' },
  sick: { library: 'material', icon: 'thermometer' },
  person: { library: 'ionicons', icon: 'person-circle' },
  diabetes: { library: 'material', icon: 'diabetes' },
  target: { library: 'ionicons', icon: 'flag' },
  notification: { library: 'ionicons', icon: 'notifications' },
  security: { library: 'ionicons', icon: 'lock-closed' },
  export: { library: 'ionicons', icon: 'share' },
  help: { library: 'ionicons', icon: 'help-circle' },
  star: { library: 'ionicons', icon: 'star' },
  sparkles: { library: 'ionicons', icon: 'sparkles' },
  'arrow-right': { library: 'ionicons', icon: 'chevron-forward' },
  wave: { library: 'ionicons', icon: 'hand-right' },
  close: { library: 'ionicons', icon: 'close' },
  eye: { library: 'ionicons', icon: 'eye' },
  'eye-off': { library: 'ionicons', icon: 'eye-off' },
  check: { library: 'ionicons', icon: 'checkmark' },
  flag: { library: 'ionicons', icon: 'flag' },
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = Colors.textPrimary, style }) => {
  const config = iconMap[name];
  
  if (!config) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  switch (config.library) {
    case 'ionicons':
      return <Ionicons name={config.icon as any} size={size} color={color} style={style} />;
    case 'material':
      return <MaterialCommunityIcons name={config.icon as any} size={size} color={color} style={style} />;
    case 'feather':
      return <Feather name={config.icon as any} size={size} color={color} style={style} />;
    default:
      return null;
  }
};
