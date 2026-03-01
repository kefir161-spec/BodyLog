'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
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

export function useWeightEntries(): WeightEntry[] {
  return (
    useLiveQuery(async () => db.weightEntries.orderBy('date').reverse().toArray(), []) ??
    []
  );
}

export function useWeightEntriesByDateRange(
  from: string,
  to: string
): WeightEntry[] {
  return (
    useLiveQuery(
      async () =>
        db.weightEntries
          .where('date')
          .between(from, to, true, true)
          .sortBy('date'),
      [from, to]
    ) ?? []
  );
}

export function useDoseEntries(): DoseEntry[] {
  return (
    useLiveQuery(
      async () => db.doseEntries.orderBy('datetime').reverse().toArray(),
      []
    ) ?? []
  );
}

export function useNutritionEntries(): NutritionEntry[] {
  return (
    useLiveQuery(
      async () =>
        db.nutritionEntries.orderBy('date').reverse().toArray(),
      []
    ) ?? []
  );
}

export function useNutritionEntriesByDateRange(
  from: string,
  to: string
): NutritionEntry[] {
  return (
    useLiveQuery(
      async () =>
        db.nutritionEntries
          .where('date')
          .between(from, to, true, true)
          .sortBy('date'),
      [from, to]
    ) ?? []
  );
}

export function useActivityEntries(): ActivityEntry[] {
  return (
    useLiveQuery(
      async () =>
        db.activityEntries.orderBy('date').reverse().toArray(),
      []
    ) ?? []
  );
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(
    async () => db.settings.get('default'),
    []
  ) as Settings | undefined;
}

export function useMealEntries(): MealEntry[] {
  return (
    useLiveQuery(
      async () => db.mealEntries.orderBy('datetime').reverse().toArray(),
      []
    ) ?? []
  );
}

export function useMealItemsByDate(date: string): MealItemEntry[] {
  return (
    useLiveQuery(
      async () =>
        db.mealItemEntries.where('date').equals(date).sortBy('id'),
      [date]
    ) ?? []
  );
}

export function useMealItemEntries(): MealItemEntry[] {
  return useLiveQuery(async () => db.mealItemEntries.orderBy('date').reverse().toArray(), []) ?? [];
}

export function useManualIntakeByDate(date: string): ManualIntakeEntry[] {
  return (
    useLiveQuery(
      async () =>
        db.manualIntakeEntries.where('date').equals(date).toArray(),
      [date]
    ) ?? []
  );
}

export function useManualIntakeEntries(): ManualIntakeEntry[] {
  return useLiveQuery(async () => db.manualIntakeEntries.orderBy('date').reverse().toArray(), []) ?? [];
}

export function useFoodCacheItems(): FoodCacheItem[] {
  return (
    useLiveQuery(async () => db.foodCacheItems.orderBy('updatedAt').reverse().toArray(), []) ?? []
  );
}

export function useMealEntriesByDateRange(from: string, to: string): MealEntry[] {
  return (
    useLiveQuery(
      async () =>
        db.mealEntries.where('date').between(from, to, true, true).sortBy('date'),
      [from, to]
    ) ?? []
  );
}

export function useNoteEntries(): NoteEntry[] {
  return (
    useLiveQuery(
      async () => db.noteEntries.orderBy('createdAt').reverse().toArray(),
      []
    ) ?? []
  );
}
