import { create } from 'zustand';
import { glucoseApi } from '../services/api';
import { syncHealthConnectReadings } from '../services/healthConnectService';

export interface GlucoseReading {
  id: number;
  value_mmol: number;
  value_mgdl: number;
  source: string;
  tag?: string;
  trend_arrow?: string;
  trend_rate?: number;
  notes?: string;
  recorded_at: string;
}

export interface GlucoseStats {
  average_mmol: number;
  std_dev: number;
  coefficient_of_variation: number;
  estimated_hba1c: number;
  min_mmol: number;
  max_mmol: number;
  period_days: number;
  tir: {
    in_range_pct: number;
    below_pct: number;
    above_pct: number;
    very_low_pct: number;
    very_high_pct: number;
    target_low: number;
    target_high: number;
    reading_count: number;
  };
}

interface GlucoseState {
  readings: GlucoseReading[];
  latestReading: GlucoseReading | null;
  stats7: GlucoseStats | null;
  stats30: GlucoseStats | null;
  dailyAverages: any[];
  isLoading: boolean;
  isLogging: boolean;
  error: string | null;

  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'unavailable';
  lastSyncedAt: string | null;
  healthConnectEnabled: boolean;

  fetchLatest: () => Promise<void>;
  fetchStats: (days?: number) => Promise<void>;
  fetchReadings: (days?: number) => Promise<void>;
  fetchDailyAverages: (days?: number) => Promise<void>;
  logReading: (data: {
    value: number;
    unit: 'mmol' | 'mgdl';
    tag?: string;
    notes?: string;
    meal_id?: number;
  }) => Promise<GlucoseReading | null>;
  deleteReading: (id: number) => Promise<void>;
  setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error' | 'unavailable') => void;
  setHealthConnectEnabled: (enabled: boolean) => void;
  triggerHealthConnectSync: (daysSince?: number) => Promise<void>;
}

export const useGlucoseStore = create<GlucoseState>((set, get) => ({
  readings: [],
  latestReading: null,
  stats7: null,
  stats30: null,
  dailyAverages: [],
  isLoading: false,
  isLogging: false,
  error: null,
  syncStatus: 'idle',
  lastSyncedAt: null,
  healthConnectEnabled: false,

  fetchLatest: async () => {
    try {
      const { data } = await glucoseApi.latest();
      set({ latestReading: data });
    } catch {
      // silent
    }
  },

  fetchStats: async (days = 14) => {
    try {
      const { data } = await glucoseApi.stats(days);
      if (days <= 7) {
        set({ stats7: data });
      } else {
        set({ stats30: data });
      }
    } catch {
      // silent
    }
  },

  fetchReadings: async (days = 14) => {
    set({ isLoading: true });
    try {
      const { data } = await glucoseApi.list(days);
      set({ readings: data.readings, isLoading: false });
    } catch (err: any) {
      set({ error: 'Failed to load readings', isLoading: false });
    }
  },

  fetchDailyAverages: async (days = 30) => {
    try {
      const { data } = await glucoseApi.dailyAverages(days);
      set({ dailyAverages: data.averages });
    } catch {
      // silent
    }
  },

  logReading: async (input) => {
    set({ isLogging: true, error: null });
    try {
      const { data } = await glucoseApi.log({
        value: input.value,
        unit: input.unit,
        tag: input.tag,
        notes: input.notes,
        meal_id: input.meal_id,
      });
      set((state) => ({
        readings: [data, ...state.readings],
        latestReading: data,
        isLogging: false,
      }));
      return data;
    } catch (err: any) {
      set({ error: 'Failed to log reading', isLogging: false });
      return null;
    }
  },

  deleteReading: async (id) => {
    try {
      await glucoseApi.delete(id);
      set((state) => ({
        readings: state.readings.filter((r) => r.id !== id),
      }));
    } catch {
      // silent
    }
  },

  setSyncStatus: (status) => set({ syncStatus: status }),

  setHealthConnectEnabled: (enabled) => set({ healthConnectEnabled: enabled }),

  triggerHealthConnectSync: async (daysSince = 1) => {
    set({ syncStatus: 'syncing' });
    try {
      const result = await syncHealthConnectReadings(daysSince);
      if (result === null) {
        set({ syncStatus: 'unavailable' });
        return;
      }
      set({ syncStatus: 'success', lastSyncedAt: new Date().toISOString() });
      await get().fetchLatest();
      await get().fetchStats(7);
    } catch {
      set({ syncStatus: 'error' });
    }
  },
}));
