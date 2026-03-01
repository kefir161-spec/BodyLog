'use client';

import { useState, useMemo } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWeightEntries, useDoseEntries, useNutritionEntries, useActivityEntries, useMealItemEntries, useManualIntakeEntries, useSettings } from '@/lib/hooks';
import { intakeKcalDayFull, burnKcalDay, weightForDate, balanceKcalDay, formatSignedKcal } from '@/lib/stats';
import { Scale, Utensils, Syringe, Activity } from 'lucide-react';
import { QuickAddWeight } from '@/components/quick-add/quick-add-weight';
import { QuickAddNutrition } from '@/components/quick-add/quick-add-nutrition';
import { QuickAddDose } from '@/components/quick-add/quick-add-dose';
import { QuickAddActivity } from '@/components/quick-add/quick-add-activity';
import { DayDetailDialog } from '@/components/diary/day-detail-dialog';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const PERIODS = [
  { value: '7', label: '7 дней' },
  { value: '14', label: '14 дней' },
  { value: '30', label: '30 дней' },
  { value: 'all', label: 'За все время' },
];

type DayRow = {
  date: string;
  weight?: number;
  nutrition?: { calories: number; proteinG: number; fatG: number; carbsG: number };
  intakeKcal?: number;
  burnKcal?: number;
  balanceKcal?: number;
  showBalance: boolean;
  dose?: { compoundName: string; doseMg: number };
  activity?: { steps?: number; stepsKcal?: number; cyclingMinutes?: number; manualKcal?: number; workout?: string };
};

export function DiaryView() {
  const [period, setPeriod] = useState('14');
  const [showWeight, setShowWeight] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);
  const [showDose, setShowDose] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [weightOpen, setWeightOpen] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [doseOpen, setDoseOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const weights = useWeightEntries();
  const doses = useDoseEntries();
  const nutrition = useNutritionEntries();
  const activities = useActivityEntries();
  const mealItems = useMealItemEntries();
  const manualIntakes = useManualIntakeEntries();
  const settings = useSettings();

  const days = useMemo(() => {
    const today = new Date();
    let n: number;
    if (period === 'all') {
      const dates: string[] = [
        ...weights.map((w) => w.date),
        ...nutrition.map((n) => n.date),
        ...activities.map((a) => a.date),
        ...mealItems.map((m) => m.date),
        ...manualIntakes.map((m) => m.date),
        ...doses.map((d) => d.datetime.slice(0, 10)),
      ];
      const earliest = dates.length > 0 ? dates.sort()[0] : format(today, 'yyyy-MM-dd');
      n = differenceInDays(today, parseISO(earliest)) + 1;
      n = Math.max(1, Math.min(n, 365 * 5));
    } else {
      n = parseInt(period, 10) || 14;
    }
    const result: DayRow[] = [];
    for (let i = 0; i < n; i++) {
      const d = subDays(today, i);
      const key = format(d, 'yyyy-MM-dd');
      const weightEntry = weights.find((w) => w.date === key);
      const nutEntry = nutrition.find((n) => n.date === key);
      const doseOnDay = doses.find((dose) => dose.datetime.startsWith(key));
      const actEntry = activities.find((a) => a.date === key);
      const dayMealItems = mealItems.filter((m) => m.date === key);
      const dayManual = manualIntakes.filter((m) => m.date === key);
      const dayLegacyNut = nutrition.filter((n) => n.date === key);
      const intake = intakeKcalDayFull(dayMealItems, dayManual, dayLegacyNut);
      const weightKg = weightForDate(weights, key);
      const burn = burnKcalDay(settings ?? undefined, weightKg, actEntry?.stepsKcal ?? 0, actEntry?.cyclingMinutes, actEntry?.manualKcal);
      const balance = balanceKcalDay(intake.kcal, burn);
      const hasIntake = intake.kcal > 0;
      const hasActivity = actEntry != null && (actEntry.steps != null || actEntry.cyclingMinutes != null || (actEntry.manualKcal != null && actEntry.manualKcal > 0) || (actEntry.workout != null && actEntry.workout !== ''));
      const showBalance = hasIntake && hasActivity;
      result.push({
        date: key,
        weight: weightEntry?.weightKg,
        nutrition: intake.kcal > 0
          ? { calories: intake.kcal, proteinG: intake.proteinG, fatG: intake.fatG, carbsG: intake.carbsG }
          : undefined,
        intakeKcal: intake.kcal || undefined,
        burnKcal: burn || undefined,
        balanceKcal: balance,
        showBalance,
        dose: doseOnDay
          ? { compoundName: doseOnDay.compoundName, doseMg: doseOnDay.doseMg }
          : undefined,
        activity: actEntry
          ? {
              steps: actEntry.steps,
              stepsKcal: actEntry.stepsKcal,
              cyclingMinutes: actEntry.cyclingMinutes,
              manualKcal: actEntry.manualKcal,
              workout: actEntry.workout,
            }
          : undefined,
      });
    }
    return result;
  }, [period, weights, doses, nutrition, activities, mealItems, manualIntakes, settings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дневник</h1>
        <p className="text-muted-foreground">Записи по дням</p>
      </div>

      <ScrollReveal>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Период и фильтры</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Период:</span>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={showWeight ? 'default' : 'outline'}
              onClick={() => setShowWeight(!showWeight)}
            >
              <Scale className="mr-1 h-3.5 w-3.5" />
              Вес
            </Button>
            <Button
              size="sm"
              variant={showNutrition ? 'default' : 'outline'}
              onClick={() => setShowNutrition(!showNutrition)}
            >
              <Utensils className="mr-1 h-3.5 w-3.5" />
              Питание
            </Button>
            <Button
              size="sm"
              variant={showDose ? 'default' : 'outline'}
              onClick={() => setShowDose(!showDose)}
            >
              <Syringe className="mr-1 h-3.5 w-3.5" />
              Дозы
            </Button>
            <Button
              size="sm"
              variant={showActivity ? 'default' : 'outline'}
              onClick={() => setShowActivity(!showActivity)}
            >
              <Activity className="mr-1 h-3.5 w-3.5" />
              Активность
            </Button>
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Дата</th>
                  {showWeight && (
                    <th className="px-4 py-3 text-left font-medium">Вес</th>
                  )}
                  {showNutrition && (
                    <>
                      <th className="px-4 py-3 text-right font-medium">Ккал</th>
                      <th className="px-4 py-3 text-right font-medium">Б/Ж/У</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right font-medium">Баланс, ккал</th>
                  {showDose && (
                    <th className="px-4 py-3 text-left font-medium">Доза</th>
                  )}
                  {showActivity && (
                    <th className="px-4 py-3 text-left font-medium">Активность</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {days.map((row) => (
                  <tr
                    key={row.date}
                    className="cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedDate(row.date)}
                  >
                    <td className="px-4 py-2">
                      {format(parseISO(row.date), 'd MMM yyyy', { locale: ru })}
                    </td>
                    {showWeight && (
                      <td className="px-4 py-2">
                        {row.weight != null ? `${row.weight} кг` : '—'}
                      </td>
                    )}
                    {showNutrition && (
                      <>
                        <td className="px-4 py-2 text-right">
                          {row.nutrition != null ? row.nutrition.calories : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {row.nutrition != null
                            ? `${Math.round(row.nutrition.proteinG)}/${Math.round(row.nutrition.fatG)}/${Math.round(row.nutrition.carbsG)}`
                            : '—'}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2 text-right">
                      {row.showBalance ? (
                        <span
                          className={
                            row.balanceKcal != null && row.balanceKcal < 0
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : row.balanceKcal != null && row.balanceKcal > 0
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : ''
                          }
                        >
                          {row.balanceKcal != null ? formatSignedKcal(row.balanceKcal) : '—'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    {showDose && (
                      <td className="px-4 py-2">
                        {row.dose != null
                          ? `${row.dose.compoundName} ${row.dose.doseMg} мг`
                          : '—'}
                      </td>
                    )}
                    {showActivity && (
                      <td className="px-4 py-2 text-muted-foreground">
                        {row.activity != null ? (
                          <span className="block">
                            {row.activity.steps != null && (
                              <>
                                {row.activity.steps} шагов
                                {row.activity.stepsKcal != null && row.activity.stepsKcal > 0 && (
                                  <span className="text-foreground/80"> ≈ {row.activity.stepsKcal} ккал</span>
                                )}
                              </>
                            )}
                            {row.activity.cyclingMinutes != null && (
                              <span>{row.activity.cyclingMinutes} мин вело</span>
                            )}
                            {row.activity.workout && (
                              <span>{row.activity.workout}</span>
                            )}
                            {!row.activity.steps &&
                              !row.activity.cyclingMinutes &&
                              !row.activity.workout &&
                              '—'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {days.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Нет записей за выбранный период
            </div>
          )}
        </CardContent>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setWeightOpen(true)}>
          <Scale className="mr-2 h-4 w-4" />
          Добавить вес
        </Button>
        <Button variant="outline" onClick={() => setNutritionOpen(true)}>
          <Utensils className="mr-2 h-4 w-4" />
          Добавить питание
        </Button>
        <Button variant="outline" onClick={() => setDoseOpen(true)}>
          <Syringe className="mr-2 h-4 w-4" />
          Добавить дозу
        </Button>
        <Button variant="outline" onClick={() => setActivityOpen(true)}>
          <Activity className="mr-2 h-4 w-4" />
          Добавить активность
        </Button>
      </div>
      </ScrollReveal>

      <QuickAddWeight open={weightOpen} onOpenChange={setWeightOpen} />
      <QuickAddNutrition open={nutritionOpen} onOpenChange={setNutritionOpen} />
      <QuickAddDose open={doseOpen} onOpenChange={setDoseOpen} />
      <QuickAddActivity open={activityOpen} onOpenChange={setActivityOpen} />
      <DayDetailDialog
        date={selectedDate ?? ''}
        open={selectedDate != null}
        onOpenChange={(open) => !open && setSelectedDate(null)}
      />
    </div>
  );
}
