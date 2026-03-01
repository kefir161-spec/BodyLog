import {
  format,
  subDays,
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
  startOfWeek,
  differenceInDays,
} from 'date-fns';
import type {
  WeightEntry,
  NutritionEntry,
  DoseEntry,
  ActivityEntry,
  MealItemEntry,
  ManualIntakeEntry,
  Settings,
} from './models';

/** Потребление за день из всех источников: MealItem + ManualIntake + legacy NutritionEntry */
export function intakeKcalDayFull(
  mealItems: MealItemEntry[],
  manualIntakes: ManualIntakeEntry[],
  legacyNutrition: NutritionEntry[]
): { kcal: number; proteinG: number; fatG: number; carbsG: number } {
  let kcal = 0;
  let proteinG = 0;
  let fatG = 0;
  let carbsG = 0;
  mealItems.forEach((m) => {
    kcal += m.kcal;
    proteinG += m.proteinG;
    fatG += m.fatG;
    carbsG += m.carbsG;
  });
  manualIntakes.forEach((m) => {
    kcal += m.calories;
    proteinG += m.proteinG ?? 0;
    fatG += m.fatG ?? 0;
    carbsG += m.carbsG ?? 0;
  });
  legacyNutrition.forEach((n) => {
    kcal += n.calories;
    proteinG += n.proteinG ?? 0;
    fatG += n.fatG ?? 0;
    carbsG += n.carbsG ?? 0;
  });
  return {
    kcal,
    proteinG: Math.round(proteinG),
    fatG: Math.round(fatG),
    carbsG: Math.round(carbsG),
  };
}

const TZ = 'Europe/Amsterdam';

/** Вес на дату: последняя запись на эту дату или ближайшая предыдущая */
export function weightForDate(entries: WeightEntry[], dateKey: string): number | null {
  const sorted = [...entries].filter((e) => e.date <= dateKey).sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0]?.weightKg ?? null;
}

/** BMR по Mifflin-St Jeor (ккал/день) */
export function bmr(weightKg: number, heightCm: number, ageYears: number, sex: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Расход ккал за велотренировку: MET × weightKg × (minutes/60) */
export function computeCyclingKcal(
  cyclingMinutes: number,
  weightKg: number,
  cyclingMET: number
): number {
  if (cyclingMinutes <= 0 || weightKg <= 0) return 0;
  return Math.round(cyclingMET * weightKg * (cyclingMinutes / 60));
}

/** Вес для расчёта расхода: на дату или fallback из настроек (startWeightKg / goalWeightKg), чтобы базовый расход всегда считался при заполненном профиле */
export function weightForBurn(
  weightKg: number | null,
  settings: Settings | undefined
): number | null {
  if (weightKg != null && weightKg > 0) return weightKg;
  if (settings?.startWeightKg != null && settings.startWeightKg > 0) return settings.startWeightKg;
  if (settings?.goalWeightKg != null && settings.goalWeightKg > 0) return settings.goalWeightKg;
  return null;
}

/** Разбивка расхода за день для отображения: базовый (TDEE) и активность */
export function getBurnBreakdown(
  settings: Settings | undefined,
  weightKg: number | null,
  stepsKcal: number,
  cyclingMinutes?: number,
  manualKcal?: number
): { bmr: number; tdee: number; stepsKcal: number; cyclingKcal: number; manualKcal: number; total: number; hasBase: boolean; weightUsedKg: number | null } {
  const w = weightForBurn(weightKg, settings);
  const steps = stepsKcal ?? 0;
  const cycling = cyclingMinutes ?? 0;
  const manual = manualKcal ?? 0;
  if (!w || !settings?.heightCm || settings.birthYear == null || !settings.sex) {
    return { bmr: 0, tdee: 0, stepsKcal: steps, cyclingKcal: 0, manualKcal: manual, total: steps + manual, hasBase: false, weightUsedKg: null };
  }
  const age = new Date().getFullYear() - settings.birthYear;
  const bmrVal = bmr(w, settings.heightCm, age, settings.sex);
  const factor = settings.activityFactor ?? 1.2;
  const tdeeVal = bmrVal * factor;
  const cyclingMET = settings.cyclingMET ?? 6;
  const cyclingKcal = computeCyclingKcal(cycling, w, cyclingMET);
  const total = Math.round(tdeeVal + steps + cyclingKcal + manual);
  return {
    bmr: Math.round(bmrVal),
    tdee: Math.round(tdeeVal),
    stepsKcal: steps,
    cyclingKcal,
    manualKcal: manual,
    total,
    hasBase: true,
    weightUsedKg: w,
  };
}

/** Расход за день: TDEE (BMR × коэффициент) + stepsKcal + cyclingKcal + manualKcal. Использует weightForBurn при отсутствии веса на дату. */
export function burnKcalDay(
  settings: Settings | undefined,
  weightKg: number | null,
  stepsKcal: number,
  cyclingMinutes?: number,
  manualKcal?: number
): number {
  const breakdown = getBurnBreakdown(settings, weightKg, stepsKcal, cyclingMinutes, manualKcal);
  return breakdown.total;
}

/** Баланс за день (ккал): потребление − расход. Знак всегда показывать (+/−). */
export function balanceKcalDay(intakeKcal: number, burnKcal: number): number {
  return intakeKcal - burnKcal;
}

/** Форматирование числа с обязательным знаком +/− (Intl) */
export function formatSignedKcal(value: number): string {
  return new Intl.NumberFormat('ru-RU', { signDisplay: 'always', maximumFractionDigits: 0 }).format(value);
}

/** Расход ккал за шаги: distance = steps * stepLengthCm/100000 km, durationH = distance/walkingSpeedKmh, stepsKcal = MET * weightKg * durationH */
export function computeStepsKcal(
  steps: number,
  weightKg: number,
  stepLengthCm: number,
  walkingSpeedKmh: number,
  walkingMET: number
): number {
  if (steps <= 0 || weightKg <= 0) return 0;
  const distanceKm = (steps * stepLengthCm) / 100000;
  const durationH = distanceKm / walkingSpeedKmh;
  return Math.round(walkingMET * weightKg * durationH);
}

/** Длина шага по умолчанию (см): муж 0.415*рост, жен 0.413*рост */
export function defaultStepLengthCm(heightCm: number, sex: 'male' | 'female'): number {
  return sex === 'male' ? 0.415 * heightCm : 0.413 * heightCm;
}

/** Формат даты для ключей (YYYY-MM-DD) */
export function toDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

/** Moving average за последние 7 дней включительно для даты d */
export function movingAverage7(
  entries: WeightEntry[],
  targetDate: Date
): number | null {
  const key = toDateKey(targetDate);
  const target = parseISO(key);
  const from = startOfDay(subDays(target, 6));
  const to = startOfDay(target);
  const inRange = entries.filter((e) => {
    const ed = parseISO(e.date);
    return !isBefore(ed, from) && !isAfter(ed, to);
  });
  if (inRange.length === 0) return null;
  const sum = inRange.reduce((s, e) => s + e.weightKg, 0);
  return Math.round((sum / inRange.length) * 10) / 10;
}

/** Изменение веса за последние N дней: среднее по первым 2 дням окна vs по последним 2 дням */
export function deltaWeight(
  entries: WeightEntry[],
  days: number
): { delta: number; fromAvg: number; toAvg: number } | null {
  const end = new Date();
  const start = subDays(end, days);
  const inRange = [...entries]
    .filter((e) => {
      const d = parseISO(e.date);
      return !isBefore(d, start) && !isAfter(d, end);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (inRange.length < 2) return null;
  const recent = inRange.slice(-2);
  const older = inRange.slice(0, 2);
  const toAvg = recent.reduce((s, e) => s + e.weightKg, 0) / recent.length;
  const fromAvg = older.reduce((s, e) => s + e.weightKg, 0) / older.length;
  const delta = Math.round((toAvg - fromAvg) * 10) / 10;
  return { delta, fromAvg, toAvg };
}

/** Изменение веса с первой записи до последней (с начала ведения дневника). */
export function deltaWeightSinceFirst(entries: WeightEntry[]): { delta: number; firstDate: string; lastDate: string } | null {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = Math.round((last.weightKg - first.weightKg) * 10) / 10;
  return { delta, firstDate: first.date, lastDate: last.date };
}

/**
 * Изменение веса за текущую неделю: вес «на понедельник» vs вес «на сегодня».
 * Используется последняя известная запись на каждую дату (как в дневнике).
 * В понедельник (новая неделя) показывается 0 кг, если нет веса на сегодня.
 */
export function deltaWeightThisWeek(
  entries: WeightEntry[],
  today: Date
): { delta: number } {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartKey = toDateKey(weekStart);
  const todayKey = toDateKey(today);
  const weightMonday = weightForDate(entries, weekStartKey);
  const weightToday = weightForDate(entries, todayKey);
  if (weightMonday == null || weightToday == null) return { delta: 0 };
  const delta = Math.round((weightToday - weightMonday) * 10) / 10;
  return { delta };
}

/**
 * Ориентировочное число недель до целевого веса при текущем темпе (как расход топлива: темп за период → прогноз).
 * ratePerWeekKg: положительное = кг в неделю к цели (при похудении — кг потери, при наборе — кг набора).
 */
export function weeksToGoal(
  entries: WeightEntry[],
  goalKg: number,
  currentWeightKg: number | null
): { weeks: number; ratePerWeekKg: number } | null {
  if (currentWeightKg == null) return null;
  const toLose = currentWeightKg - goalKg;
  if (Math.abs(toLose) < 0.1) return null;

  const delta30 = deltaWeight(entries, 30);
  const delta7 = deltaWeight(entries, 7);

  let changePerWeekKg: number;
  if (delta30 != null && Math.abs(delta30.delta) > 0.01) {
    changePerWeekKg = (delta30.delta * 7) / 30;
  } else if (delta7 != null && Math.abs(delta7.delta) > 0.01) {
    changePerWeekKg = delta7.delta;
  } else {
    return null;
  }

  if (toLose > 0) {
    if (changePerWeekKg >= 0) return null;
    const ratePerWeekKg = -changePerWeekKg;
    return { weeks: Math.max(1, Math.round(toLose / ratePerWeekKg)), ratePerWeekKg };
  } else {
    if (changePerWeekKg <= 0) return null;
    return { weeks: Math.max(1, Math.round(-toLose / changePerWeekKg)), ratePerWeekKg: changePerWeekKg };
  }
}

/** Streak: сколько дней подряд есть запись веса (от сегодня в прошлое) */
export function weightStreak(entries: WeightEntry[], today: Date): number {
  const keys = new Set(entries.map((e) => e.date));
  let count = 0;
  let d = startOfDay(today);
  for (let i = 0; i < 365; i++) {
    const key = toDateKey(d);
    if (!keys.has(key)) break;
    count++;
    d = subDays(d, 1);
  }
  return count;
}

export function minWeight(entries: WeightEntry[]): number | null {
  if (entries.length === 0) return null;
  return Math.min(...entries.map((e) => e.weightKg));
}

export function maxWeight(entries: WeightEntry[]): number | null {
  if (entries.length === 0) return null;
  return Math.max(...entries.map((e) => e.weightKg));
}

export function avgWeight(entries: WeightEntry[]): number | null {
  if (entries.length === 0) return null;
  const sum = entries.reduce((s, e) => s + e.weightKg, 0);
  return Math.round((sum / entries.length) * 10) / 10;
}

/** Данные для графика веса: последние N дней с 7d MA */
export function weightChartData(
  entries: WeightEntry[],
  days: number,
  goalKg?: number
): Array<{ date: string; weightKg: number; movingAvg7: number | null; goal?: number }> {
  const end = new Date();
  const start = subDays(end, days);
  const sorted = [...entries]
    .filter((e) => {
      const d = parseISO(e.date);
      return !isBefore(d, start) && !isAfter(d, end);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map<string, number>();
  sorted.forEach((e) => byDate.set(e.date, e.weightKg));
  const result: Array<{
    date: string;
    weightKg: number;
    movingAvg7: number | null;
    goal?: number;
  }> = [];
  for (let i = 0; i <= days; i++) {
    const d = subDays(end, days - i);
    const key = toDateKey(d);
    const w = byDate.get(key);
    if (w != null) {
      const ma = movingAverage7(entries, d);
      result.push({
        date: key,
        weightKg: w,
        movingAvg7: ma,
        ...(goalKg != null && { goal: goalKg }),
      });
    }
  }
  return result;
}

/** Данные для графика калорий и макросов за N дней */
export function nutritionChartData(
  entries: NutritionEntry[],
  days: number,
  calorieTarget?: number
): Array<{
  date: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  target?: number;
}> {
  const end = new Date();
  const start = subDays(end, days);
  const inRange = entries
    .filter((e) => {
      const d = parseISO(e.date);
      return !isBefore(d, start) && !isAfter(d, end);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return inRange.map((e) => ({
    date: e.date,
    calories: e.calories,
    proteinG: e.proteinG,
    fatG: e.fatG,
    carbsG: e.carbsG,
    ...(calorieTarget != null && { target: calorieTarget }),
  }));
}

/** Дозы для timeline (последние N дней) */
export function doseTimelineData(
  entries: DoseEntry[],
  days: number
): Array<{ datetime: string; doseMg: number; compoundName: string; date: string }> {
  const end = new Date();
  const start = subDays(end, days);
  return entries
    .filter((e) => {
      const d = parseISO(e.datetime);
      return !isBefore(d, start) && !isAfter(d, end);
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
    .map((e) => ({
      datetime: e.datetime,
      doseMg: e.doseMg,
      compoundName: e.compoundName,
      date: e.datetime.slice(0, 10),
    }));
}

/** Активность по дням за N дней */
export function activityChartData(
  entries: ActivityEntry[],
  days: number
): Array<{ date: string; steps: number; cyclingMinutes: number }> {
  const end = new Date();
  const start = subDays(end, days);
  const inRange = entries
    .filter((e) => {
      const d = parseISO(e.date);
      return !isBefore(d, start) && !isAfter(d, end);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return inRange.map((e) => ({
    date: e.date,
    steps: e.steps ?? 0,
    cyclingMinutes: e.cyclingMinutes ?? 0,
  }));
}
