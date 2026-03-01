import Dexie, { type Table } from 'dexie';
import type {
  WeightEntry,
  DoseEntry,
  NutritionEntry,
  ActivityEntry,
  Settings,
  FoodCacheItem,
  MealEntry,
  MealItemEntry,
  ManualIntakeEntry,
  SearchCacheItem,
  NoteEntry,
} from './models';

export type WeightEntryRecord = WeightEntry;
export type DoseEntryRecord = DoseEntry;
export type NutritionEntryRecord = NutritionEntry;
export type ActivityEntryRecord = ActivityEntry;
export type SettingsRecord = Settings & { id: 'default' };
export type FoodCacheItemRecord = FoodCacheItem;
export type MealEntryRecord = MealEntry;
export type MealItemEntryRecord = MealItemEntry;
export type ManualIntakeEntryRecord = ManualIntakeEntry;
export type SearchCacheItemRecord = SearchCacheItem;
export type NoteEntryRecord = NoteEntry;

export class BodyLogDB extends Dexie {
  weightEntries!: Table<WeightEntryRecord, string>;
  doseEntries!: Table<DoseEntryRecord, string>;
  nutritionEntries!: Table<NutritionEntryRecord, string>;
  activityEntries!: Table<ActivityEntryRecord, string>;
  settings!: Table<SettingsRecord, string>;
  foodCacheItems!: Table<FoodCacheItemRecord, string>;
  mealEntries!: Table<MealEntryRecord, string>;
  mealItemEntries!: Table<MealItemEntryRecord, string>;
  manualIntakeEntries!: Table<ManualIntakeEntryRecord, string>;
  searchCache!: Table<SearchCacheItemRecord, string>;
  noteEntries!: Table<NoteEntryRecord, string>;

  constructor() {
    super('BodyLogDB');
    this.version(1).stores({
      weightEntries: 'id, date',
      doseEntries: 'id, datetime',
      nutritionEntries: 'id, date',
      activityEntries: 'id, date',
      settings: 'id',
    });
    this.version(2)
      .stores({
        weightEntries: 'id, date',
        doseEntries: 'id, datetime',
        nutritionEntries: 'id, date',
        activityEntries: 'id, date',
        settings: 'id',
        foodCacheItems: 'id, updatedAt',
        mealEntries: 'id, date, mealType',
        mealItemEntries: 'id, mealId, date',
        manualIntakeEntries: 'id, date',
        searchCache: 'id, query, createdAt',
      })
      .upgrade((tx) => {
        // v1 -> v2: новые таблицы создаются пустыми, старые данные не трогаем
      });
    this.version(3).stores({
      noteEntries: 'id, createdAt, reminderAt',
    });
  }
}

export const db = new BodyLogDB();

if (typeof window !== 'undefined') {
  (window as unknown as { __bodylog_db?: BodyLogDB }).__bodylog_db = db;
}
