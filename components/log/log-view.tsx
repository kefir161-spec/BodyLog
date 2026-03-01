'use client';

import { useState, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWeightEntries, useDoseEntries, useNutritionEntries, useActivityEntries } from '@/lib/hooks';
import { Scale, Utensils, Syringe, Activity } from 'lucide-react';
import { QuickAddWeight } from '@/components/quick-add/quick-add-weight';
import { QuickAddNutrition } from '@/components/quick-add/quick-add-nutrition';
import { QuickAddDose } from '@/components/quick-add/quick-add-dose';
import { QuickAddActivity } from '@/components/quick-add/quick-add-activity';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const PERIODS = [
  { value: '7', label: '7 дней' },
  { value: '14', label: '14 дней' },
  { value: '30', label: '30 дней' },
];

type DayRow = {
  date: string;
  weight?: number;
  nutrition?: { calories: number; proteinG: number; fatG: number; carbsG: number };
  dose?: { compoundName: string; doseMg: number };
  activity?: { steps?: number; cyclingMinutes?: number; workout?: string };
};

export function LogView() {
  const [period, setPeriod] = useState('14');
  const [showWeight, setShowWeight] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);
  const [showDose, setShowDose] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [weightOpen, setWeightOpen] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [doseOpen, setDoseOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const weights = useWeightEntries();
  const doses = useDoseEntries();
  const nutrition = useNutritionEntries();
  const activities = useActivityEntries();

  const days = useMemo(() => {
    const n = parseInt(period, 10);
    const end = new Date();
    const result: DayRow[] = [];
    for (let i = 0; i < n; i++) {
      const d = subDays(end, n - 1 - i);
      const key = format(d, 'yyyy-MM-dd');
      const weightEntry = weights.find((w) => w.date === key);
      const nutEntry = nutrition.find((n) => n.date === key);
      const doseOnDay = doses.find((dose) => dose.datetime.startsWith(key));
      const actEntry = activities.find((a) => a.date === key);
      result.push({
        date: key,
        weight: weightEntry?.weightKg,
        nutrition: nutEntry
          ? {
              calories: nutEntry.calories,
              proteinG: nutEntry.proteinG,
              fatG: nutEntry.fatG,
              carbsG: nutEntry.carbsG,
            }
          : undefined,
        dose: doseOnDay
          ? { compoundName: doseOnDay.compoundName, doseMg: doseOnDay.doseMg }
          : undefined,
        activity: actEntry
          ? {
              steps: actEntry.steps,
              cyclingMinutes: actEntry.cyclingMinutes,
              workout: actEntry.workout,
            }
          : undefined,
      });
    }
    return result;
  }, [period, weights, doses, nutrition, activities]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Лог</h1>
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
          <Tabs value="filters" className="w-full sm:w-auto">
            <TabsList className="h-9">
              <TabsTrigger
                value="filters"
                className="text-xs"
                onClick={(e) => e.preventDefault()}
              >
                Показать:
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
                  <tr key={row.date} className="border-b last:border-0">
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
                          {row.nutrition != null
                            ? row.nutrition.calories
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">
                          {row.nutrition != null
                            ? `${row.nutrition.proteinG}/${row.nutrition.fatG}/${row.nutrition.carbsG}`
                            : '—'}
                        </td>
                      </>
                    )}
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
                          <>
                            {row.activity.steps != null && (
                              <span>{row.activity.steps} шагов</span>
                            )}
                            {row.activity.cyclingMinutes != null && (
                              <span>
                                {row.activity.cyclingMinutes} мин вело
                              </span>
                            )}
                            {row.activity.workout && (
                              <span>{row.activity.workout}</span>
                            )}
                            {!row.activity.steps &&
                              !row.activity.cyclingMinutes &&
                              !row.activity.workout &&
                              '—'}
                          </>
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
    </div>
  );
}
