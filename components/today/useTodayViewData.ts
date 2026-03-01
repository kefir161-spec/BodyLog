'use client';

import { format, parseISO, differenceInDays } from 'date-fns';
import {
  useWeightEntries,
  useDoseEntries,
  useSettings,
  useMealItemsByDate,
  useManualIntakeByDate,
  useNutritionEntries,
  useActivityEntries,
} from '@/lib/hooks';
import {
  deltaWeight,
  deltaWeightSinceFirst,
  deltaWeightThisWeek,
  weightChartData,
  intakeKcalDayFull,
  weightForDate,
  getBurnBreakdown,
  balanceKcalDay,
  weeksToGoal,
} from '@/lib/stats';
import { getNextInjectionHint } from './today-view-helpers';

export function useTodayViewData() {
  const weights = useWeightEntries();
  const doses = useDoseEntries();
  const settings = useSettings();
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const mealItemsToday = useMealItemsByDate(todayKey);
  const manualIntakesToday = useManualIntakeByDate(todayKey);
  const nutritionEntries = useNutritionEntries();
  const legacyNutritionToday = nutritionEntries.filter((n) => n.date === todayKey);
  const intakeToday = intakeKcalDayFull(mealItemsToday, manualIntakesToday, legacyNutritionToday);
  const activities = useActivityEntries();
  const todayActivity = activities.find((a) => a.date === todayKey);
  const weightKg = weightForDate(weights, todayKey);
  const burnBreakdown = getBurnBreakdown(
    settings ?? undefined,
    weightKg,
    todayActivity?.stepsKcal ?? 0,
    todayActivity?.cyclingMinutes,
    todayActivity?.manualKcal
  );
  const balanceToday = balanceKcalDay(intakeToday.kcal, burnBreakdown.total);
  const todayWeight = weights.find((w) => w.date === todayKey);
  const lastWeight = weights[0];
  const deltaWeek = deltaWeightThisWeek(weights, today);
  const deltaSinceStart = deltaWeightSinceFirst(weights);
  const chartData = weightChartData(weights, 30, settings?.goalWeightKg);
  const goalKg = settings?.goalWeightKg;
  const currentWeightForGoal = weightKg ?? lastWeight?.weightKg ?? null;
  const goalProjection =
    goalKg != null && currentWeightForGoal != null
      ? weeksToGoal(weights, goalKg, currentWeightForGoal)
      : null;
  const lastDose = doses[0];
  const nextInjectionHint =
    lastDose?.compoundName != null ? getNextInjectionHint(lastDose, today) : null;
  const startWeightKg = settings?.startWeightKg ?? null;
  const currentWeightKg = todayWeight?.weightKg ?? lastWeight?.weightKg ?? null;
  const weightLossDays =
    weights.length >= 2
      ? Math.max(
          0,
          differenceInDays(
            parseISO(weights[0]!.date),
            parseISO(weights[weights.length - 1]!.date)
          )
        )
      : null;
  return {
    today,
    todayKey,
    weights,
    intakeToday,
    burnBreakdown,
    balanceToday,
    todayWeight,
    lastWeight,
    deltaWeek,
    deltaSinceStart,
    chartData,
    goalKg,
    currentWeightForGoal,
    goalProjection,
    nextInjectionHint,
    mealItemsToday,
    manualIntakesToday,
    todayActivity,
    startWeightKg,
    currentWeightKg,
    weightLossDays,
  };
}
