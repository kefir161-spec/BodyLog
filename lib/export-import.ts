import { db } from './db';
import { exportDataSchemaV2, exportDataSchemaV1 } from './models';
import type { Settings } from './models';

export async function exportToJSON(includeSecrets = false): Promise<string> {
  const [
    weightEntries,
    doseEntries,
    nutritionEntries,
    activityEntries,
    mealEntries,
    mealItemEntries,
    manualIntakeEntries,
    foodCacheItems,
    settingsRows,
  ] = await Promise.all([
    db.weightEntries.toArray(),
    db.doseEntries.toArray(),
    db.nutritionEntries.toArray(),
    db.activityEntries.toArray(),
    db.mealEntries.toArray(),
    db.mealItemEntries.toArray(),
    db.manualIntakeEntries.toArray(),
    db.foodCacheItems.toArray(),
    db.settings.toArray(),
  ]);
  const settingsRow = settingsRows[0];
  let settings: Partial<Settings> | undefined;
  if (settingsRow) {
    const { id: _id, ...rest } = settingsRow;
    settings = rest;
    if (!includeSecrets) {
      settings = { ...settings };
      delete (settings as Record<string, unknown>).customFoodApiKey;
      delete (settings as Record<string, unknown>).customFoodApiBaseUrl;
      delete (settings as Record<string, unknown>).usdaApiKey;
    }
  }
  const data = {
    version: 2 as const,
    exportedAt: new Date().toISOString(),
    weightEntries,
    doseEntries,
    nutritionEntries,
    activityEntries,
    mealEntries,
    mealItemEntries,
    manualIntakeEntries,
    foodCacheItems,
    settings,
  };
  return JSON.stringify(data, null, 2);
}

export async function exportWeightToCSV(): Promise<string> {
  const rows = await db.weightEntries.orderBy('date').toArray();
  const header = 'date,weightKg,note,bodyFatPct,waistCm';
  const lines = rows.map(
    (e) =>
      `${e.date},${e.weightKg},${e.note ?? ''},${e.bodyFatPct ?? ''},${e.waistCm ?? ''}`
  );
  return [header, ...lines].join('\n');
}

type ImportCounts = {
  weight: number;
  dose: number;
  nutrition: number;
  activity: number;
  meal?: number;
  mealItem?: number;
  manualIntake?: number;
  foodCache?: number;
};

export async function importFromJSON(json: string): Promise<{
  success: boolean;
  error?: string;
  counts?: ImportCounts;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, error: 'Неверный JSON' };
  }
  const v2 = exportDataSchemaV2.safeParse(parsed);
  if (v2.success) {
    const data = v2.data;
    try {
      if (data.weightEntries.length > 0) await db.weightEntries.bulkPut(data.weightEntries);
      if (data.doseEntries.length > 0) await db.doseEntries.bulkPut(data.doseEntries);
      if (data.nutritionEntries.length > 0) await db.nutritionEntries.bulkPut(data.nutritionEntries);
      if (data.activityEntries.length > 0) await db.activityEntries.bulkPut(data.activityEntries);
      if (data.mealEntries.length > 0) await db.mealEntries.bulkPut(data.mealEntries);
      if (data.mealItemEntries.length > 0) await db.mealItemEntries.bulkPut(data.mealItemEntries);
      if (data.manualIntakeEntries.length > 0) await db.manualIntakeEntries.bulkPut(data.manualIntakeEntries);
      if (data.foodCacheItems.length > 0) await db.foodCacheItems.bulkPut(data.foodCacheItems);
      if (data.settings != null) {
        const s = { ...data.settings, id: 'default' as const };
        if (!data.settings.exportSecretsEnabled) {
          delete (s as Record<string, unknown>).customFoodApiKey;
          delete (s as Record<string, unknown>).customFoodApiBaseUrl;
          delete (s as Record<string, unknown>).usdaApiKey;
        }
        await db.settings.put(s);
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Ошибка записи' };
    }
    return {
      success: true,
      counts: {
        weight: data.weightEntries.length,
        dose: data.doseEntries.length,
        nutrition: data.nutritionEntries.length,
        activity: data.activityEntries.length,
        meal: data.mealEntries.length,
        mealItem: data.mealItemEntries.length,
        manualIntake: data.manualIntakeEntries.length,
        foodCache: data.foodCacheItems.length,
      },
    };
  }
  const v1 = exportDataSchemaV1.safeParse(parsed);
  if (v1.success) {
    const data = v1.data;
    try {
      if (data.weightEntries.length > 0) await db.weightEntries.bulkPut(data.weightEntries);
      if (data.doseEntries.length > 0) await db.doseEntries.bulkPut(data.doseEntries);
      if (data.nutritionEntries.length > 0) await db.nutritionEntries.bulkPut(data.nutritionEntries);
      if (data.activityEntries.length > 0) await db.activityEntries.bulkPut(data.activityEntries);
      if (data.settings != null) await db.settings.put({ ...data.settings, id: 'default' });
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Ошибка записи' };
    }
    return {
      success: true,
      counts: {
        weight: data.weightEntries.length,
        dose: data.doseEntries.length,
        nutrition: data.nutritionEntries.length,
        activity: data.activityEntries.length,
      },
    };
  }
  return {
    success: false,
    error: v2.error?.errors.map((e) => e.message).join('; ') ?? 'Неверный формат данных',
  };
}
