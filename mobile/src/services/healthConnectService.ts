import {
  getSdkStatus,
  SdkAvailabilityStatus,
  requestPermission,
  readRecords,
} from 'react-native-health-connect';
import { glucoseApi } from './api';

export interface SyncReadingItem {
  value: number;
  unit: 'mmol' | 'mgdl';
  recorded_at: string;
  external_id: string;
  source: 'health_connect';
  tag: null;
  trend_arrow: null;
  trend_rate: null;
}

export async function checkHealthConnectAvailability(): Promise<boolean> {
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function requestHealthConnectPermissions(): Promise<boolean> {
  try {
    const granted = await requestPermission([
      { accessType: 'read', recordType: 'BloodGlucose' },
    ]);
    return granted.some(
      (p: { accessType: string; recordType: string }) =>
        p.recordType === 'BloodGlucose' && p.accessType === 'read'
    );
  } catch {
    return false;
  }
}

export async function readBloodGlucoseFromHealthConnect(
  startDate: Date,
  endDate: Date
): Promise<SyncReadingItem[]> {
  try {
    const result = await readRecords('BloodGlucose', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    const records: SyncReadingItem[] = [];
    for (const record of result.records) {
      const id: string | undefined = (record as any).metadata?.id;
      if (!id) continue;

      const raw = record as any;
      const levelValue: number = raw.level?.inMillimolesPerLiter ?? raw.level?.value ?? 0;
      const unit: 'mmol' | 'mgdl' =
        raw.level?.unit === 'milligramsPerDeciliter' ? 'mgdl' : 'mmol';

      records.push({
        value: levelValue,
        unit,
        recorded_at: raw.time ?? raw.startTime,
        external_id: id,
        source: 'health_connect',
        tag: null,
        trend_arrow: null,
        trend_rate: null,
      });
    }
    return records;
  } catch (error) {
    console.error('[HealthConnect] readBloodGlucose error:', error);
    return [];
  }
}

export async function syncHealthConnectReadings(
  daysSince: number = 1
): Promise<{ imported: number; skipped: number } | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysSince);

    const readings = await readBloodGlucoseFromHealthConnect(startDate, endDate);
    if (readings.length === 0) return null;

    const { data } = await glucoseApi.syncReadings(readings);
    return { imported: data.imported, skipped: data.skipped_duplicates };
  } catch {
    return null;
  }
}
