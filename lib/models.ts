import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат: ГГГГ-ММ-ДД');

export const injectionSiteEnum = z.enum([
  'left_abdomen',
  'right_abdomen',
  'left_thigh',
  'right_thigh',
  'left_arm',
  'right_arm',
]);
export type InjectionSite = z.infer<typeof injectionSiteEnum>;

export const fastingWindowEnum = z.enum(['18/6', '17/7', '16/8', 'none']);
export type FastingWindow = z.infer<typeof fastingWindowEnum>;

export const sexEnum = z.enum(['male', 'female']);
export type Sex = z.infer<typeof sexEnum>;

// --- Weight ---
export const weightEntrySchema = z.object({
  id: z.string(),
  date: dateString,
  weightKg: z.number().min(20).max(300),
  note: z.string().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  waistCm: z.number().min(30).max(200).optional(),
});
export type WeightEntry = z.infer<typeof weightEntrySchema>;

// --- Dose ---
export const doseEntrySchema = z.object({
  id: z.string(),
  datetime: z.string().datetime(),
  compoundName: z.string().min(1, 'Укажите препарат'),
  doseMg: z.number().positive('Доза должна быть > 0'),
  injectionSite: injectionSiteEnum.optional(),
  note: z.string().optional(),
});
export type DoseEntry = z.infer<typeof doseEntrySchema>;

// --- Nutrition (legacy: дневной итог, оставляем для совместимости) ---
export const nutritionEntrySchema = z.object({
  id: z.string(),
  date: dateString,
  calories: z.number().min(0),
  proteinG: z.number().min(0).default(0),
  fatG: z.number().min(0).default(0),
  carbsG: z.number().min(0).default(0),
  fastingWindow: fastingWindowEnum.optional(),
  note: z.string().optional(),
});
export type NutritionEntry = z.infer<typeof nutritionEntrySchema>;

// --- Food cache (продукт из API или ручной) ---
export const foodProviderEnum = z.enum(['custom', 'openfoodfacts', 'usda', 'manual']);
export type FoodProvider = z.infer<typeof foodProviderEnum>;

export const unitBasisEnum = z.enum(['per100g', 'perServing', 'perPiece']);
export type UnitBasis = z.infer<typeof unitBasisEnum>;

export const foodCacheItemSchema = z.object({
  id: z.string(),
  provider: foodProviderEnum,
  providerId: z.string().optional(),
  name: z.string(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  unitBasis: unitBasisEnum,
  kcalPer100g: z.number().min(0).nullable().optional(),
  proteinPer100g: z.number().min(0).nullable().optional(),
  fatPer100g: z.number().min(0).nullable().optional(),
  carbsPer100g: z.number().min(0).nullable().optional(),
  servingSizeG: z.number().positive().nullable().optional(),
  pieceSizeG: z.number().positive().nullable().optional(),
  defaultMeasureLabel: z.string().nullable().optional(),
  favorite: z.boolean().optional(),
  updatedAt: z.string().datetime(),
  rawSource: z.record(z.unknown()).optional(),
});
export type FoodCacheItem = z.infer<typeof foodCacheItemSchema>;

// --- Meal (приём пищи) ---
export const mealTypeEnum = z.enum(['Завтрак', 'Обед', 'Ужин', 'Перекус']);
export type MealType = z.infer<typeof mealTypeEnum>;

export const mealEntrySchema = z.object({
  id: z.string(),
  datetime: z.string().datetime(),
  date: dateString,
  mealType: mealTypeEnum,
  note: z.string().optional(),
});
export type MealEntry = z.infer<typeof mealEntrySchema>;

// --- Meal item (позиция в приёме) ---
export const qtyUnitEnum = z.enum(['g', 'ml', 'pcs']);
export type QtyUnit = z.infer<typeof qtyUnitEnum>;

export const mealItemEntrySchema = z.object({
  id: z.string(),
  mealId: z.string(),
  date: dateString,
  foodCacheId: z.string().optional(),
  name: z.string(),
  brand: z.string().optional(),
  provider: foodProviderEnum,
  providerId: z.string().optional(),
  qty: z.number().positive(),
  unit: qtyUnitEnum,
  grams: z.number().min(0),
  kcal: z.number().min(0),
  proteinG: z.number().min(0),
  fatG: z.number().min(0),
  carbsG: z.number().min(0),
});
export type MealItemEntry = z.infer<typeof mealItemEntrySchema>;

// --- Manual intake (ручной ввод ккал без продукта) ---
export const manualIntakeEntrySchema = z.object({
  id: z.string(),
  date: dateString,
  calories: z.number().min(0),
  proteinG: z.number().min(0).nullable().optional(),
  fatG: z.number().min(0).nullable().optional(),
  carbsG: z.number().min(0).nullable().optional(),
  note: z.string().optional(),
});
export type ManualIntakeEntry = z.infer<typeof manualIntakeEntrySchema>;

// --- Activity (с stepsKcal) ---
export const activityEntrySchema = z.object({
  id: z.string(),
  date: dateString,
  steps: z.number().min(0).optional(),
  stepsKcal: z.number().min(0).optional(),
  methodVersion: z.string().optional(),
  cyclingMinutes: z.number().min(0).optional(),
  /** Ручной ввод расхода ккал (доп. к шагам/вело) */
  manualKcal: z.number().min(0).optional(),
  workout: z.string().optional(),
  note: z.string().optional(),
});
export type ActivityEntry = z.infer<typeof activityEntrySchema>;

// --- Settings (расширенные) ---
export const settingsSchema = z.object({
  goalWeightKg: z.number().min(20).max(300).optional(),
  startWeightKg: z.number().min(20).max(300).optional(),
  heightCm: z.number().min(100).max(250).optional(),
  sex: sexEnum.optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  calorieTarget: z.number().min(0).optional(),
  proteinTarget: z.number().min(0).optional(),
  unitSystem: z.literal('metric').default('metric'),
  stepLengthCm: z.number().positive().optional(),
  walkingSpeedKmh: z.number().positive().optional(),
  walkingMET: z.number().positive().optional(),
  /** Коэффициент повседневной активности (TDEE = BMR × factor). 1.2 = малоподвижный, 1.55 = средняя активность */
  activityFactor: z.number().min(1).max(2).optional(),
  /** MET для велотренировки (примерно 6 — умеренная езда) */
  cyclingMET: z.number().positive().optional(),
  usdaApiKey: z.string().optional(),
  customFoodApiBaseUrl: z.string().url().optional().or(z.literal('')),
  customFoodApiKey: z.string().optional(),
  exportSecretsEnabled: z.boolean().default(false),
});
export type Settings = z.infer<typeof settingsSchema>;

// --- Note (заметки и напоминания на главной) ---
export const noteEntrySchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Текст заметки не может быть пустым'),
  createdAt: z.string().datetime(),
  reminderAt: z.string().datetime().optional(),
  /** Когда установлено — заметка в статусе «Выполнено», отображается зачёркнутой в разделе выполненных */
  completedAt: z.string().datetime().optional(),
});
export type NoteEntry = z.infer<typeof noteEntrySchema>;

// --- Search cache (TTL 24h) ---
export const searchCacheItemSchema = z.object({
  id: z.string(),
  query: z.string(),
  provider: z.string(),
  results: z.array(z.unknown()),
  createdAt: z.string().datetime(),
});
export type SearchCacheItem = z.infer<typeof searchCacheItemSchema>;

/** Экспорт/импорт v2: все таблицы */
export const exportDataSchemaV2 = z.object({
  version: z.literal(2),
  exportedAt: z.string().datetime(),
  weightEntries: z.array(weightEntrySchema),
  doseEntries: z.array(doseEntrySchema),
  nutritionEntries: z.array(nutritionEntrySchema),
  activityEntries: z.array(activityEntrySchema),
  mealEntries: z.array(mealEntrySchema),
  mealItemEntries: z.array(mealItemEntrySchema),
  manualIntakeEntries: z.array(manualIntakeEntrySchema),
  foodCacheItems: z.array(foodCacheItemSchema),
  settings: settingsSchema.optional(),
});
export type ExportDataV2 = z.infer<typeof exportDataSchemaV2>;

/** Экспорт v1 (legacy) для импорта старых файлов */
export const exportDataSchemaV1 = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  weightEntries: z.array(weightEntrySchema),
  doseEntries: z.array(doseEntrySchema),
  nutritionEntries: z.array(nutritionEntrySchema),
  activityEntries: z.array(activityEntrySchema),
  settings: settingsSchema.optional(),
});

export const exportDataSchema = z.union([exportDataSchemaV2, exportDataSchemaV1]);
export type ExportData = z.infer<typeof exportDataSchema>;
