import { db } from './db';
import { generateId } from './id';
import type {
  WeightEntry,
  DoseEntry,
  NutritionEntry,
  ActivityEntry,
  Settings,
  MealEntry,
  MealItemEntry,
  ManualIntakeEntry,
  FoodCacheItem,
  NoteEntry,
} from './models';

export async function addWeightEntry(
  data: Omit<WeightEntry, 'id'>
): Promise<WeightEntry> {
  const entry: WeightEntry = { ...data, id: generateId() };
  await db.weightEntries.add(entry);
  return entry;
}

export async function updateWeightEntry(
  id: string,
  data: Partial<Omit<WeightEntry, 'id'>>
): Promise<void> {
  await db.weightEntries.update(id, data);
}

export async function deleteWeightEntry(id: string): Promise<void> {
  await db.weightEntries.delete(id);
}

export async function addDoseEntry(
  data: Omit<DoseEntry, 'id'>
): Promise<DoseEntry> {
  const entry: DoseEntry = { ...data, id: generateId() };
  await db.doseEntries.add(entry);
  return entry;
}

export async function updateDoseEntry(
  id: string,
  data: Partial<Omit<DoseEntry, 'id'>>
): Promise<void> {
  await db.doseEntries.update(id, data);
}

export async function deleteDoseEntry(id: string): Promise<void> {
  await db.doseEntries.delete(id);
}

export async function addNutritionEntry(
  data: Omit<NutritionEntry, 'id'>
): Promise<NutritionEntry> {
  const entry: NutritionEntry = { ...data, id: generateId() };
  await db.nutritionEntries.add(entry);
  return entry;
}

export async function updateNutritionEntry(
  id: string,
  data: Partial<Omit<NutritionEntry, 'id'>>
): Promise<void> {
  await db.nutritionEntries.update(id, data);
}

export async function deleteNutritionEntry(id: string): Promise<void> {
  await db.nutritionEntries.delete(id);
}

export async function addActivityEntry(
  data: Omit<ActivityEntry, 'id'>
): Promise<ActivityEntry> {
  const entry: ActivityEntry = { ...data, id: generateId() };
  await db.activityEntries.add(entry);
  return entry;
}

export async function updateActivityEntry(
  id: string,
  data: Partial<Omit<ActivityEntry, 'id'>>
): Promise<void> {
  await db.activityEntries.update(id, data);
}

export async function deleteActivityEntry(id: string): Promise<void> {
  await db.activityEntries.delete(id);
}

export async function getSettings(): Promise<Settings | undefined> {
  const row = await db.settings.get('default');
  if (!row) return undefined;
  const { id: _id, ...rest } = row;
  return rest;
}

export async function saveSettings(data: Partial<Settings>): Promise<void> {
  await db.settings.put({ ...data, id: 'default' } as Settings & { id: 'default' });
}

export async function addMealEntry(data: Omit<MealEntry, 'id'>): Promise<MealEntry> {
  const entry: MealEntry = { ...data, id: generateId() };
  await db.mealEntries.add(entry);
  return entry;
}

export async function deleteMealEntry(id: string): Promise<void> {
  await db.mealItemEntries.where('mealId').equals(id).delete();
  await db.mealEntries.delete(id);
}

export async function addMealItemEntry(data: Omit<MealItemEntry, 'id'>): Promise<MealItemEntry> {
  const entry: MealItemEntry = { ...data, id: generateId() };
  await db.mealItemEntries.add(entry);
  return entry;
}

export async function deleteMealItemEntry(id: string): Promise<void> {
  await db.mealItemEntries.delete(id);
}

export async function addManualIntakeEntry(data: Omit<ManualIntakeEntry, 'id'>): Promise<ManualIntakeEntry> {
  const entry: ManualIntakeEntry = { ...data, id: generateId() };
  await db.manualIntakeEntries.add(entry);
  return entry;
}

export async function updateManualIntakeEntry(
  id: string,
  data: Partial<Omit<ManualIntakeEntry, 'id'>>
): Promise<void> {
  await db.manualIntakeEntries.update(id, data);
}

export async function deleteManualIntakeEntry(id: string): Promise<void> {
  await db.manualIntakeEntries.delete(id);
}

export async function putFoodCacheItem(item: FoodCacheItem): Promise<void> {
  await db.foodCacheItems.put({ ...item, updatedAt: new Date().toISOString() });
}

export async function getFoodCacheItem(id: string): Promise<FoodCacheItem | undefined> {
  return db.foodCacheItems.get(id);
}

export async function updateFoodCacheItem(id: string, data: Partial<Omit<FoodCacheItem, 'id'>>): Promise<void> {
  const existing = await db.foodCacheItems.get(id);
  if (!existing) return;
  await db.foodCacheItems.put({ ...existing, ...data, updatedAt: new Date().toISOString() });
}

export async function addNoteEntry(data: Omit<NoteEntry, 'id' | 'createdAt'>): Promise<NoteEntry> {
  const entry: NoteEntry = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  await db.noteEntries.add(entry);
  return entry;
}

export async function updateNoteEntry(
  id: string,
  data: Partial<Omit<NoteEntry, 'id' | 'createdAt'>>
): Promise<void> {
  const { completedAt, ...restData } = data;
  if (completedAt === undefined && Object.prototype.hasOwnProperty.call(data, 'completedAt')) {
    const entry = await db.noteEntries.get(id);
    if (entry) {
      const { completedAt: _removed, ...entryRest } = entry;
      await db.noteEntries.put({ ...entryRest, ...restData, id });
    }
    return;
  }
  await db.noteEntries.update(id, data);
}

export async function deleteNoteEntry(id: string): Promise<void> {
  await db.noteEntries.delete(id);
}
