'use client';

import { useState } from 'react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale, Utensils, Syringe } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useWeightEntries, useDoseEntries, useSettings } from '@/lib/hooks';
import {
  deltaWeightSinceFirst,
  deltaWeightThisWeek,
  weightChartData,
} from '@/lib/stats';
import { QuickAddWeight } from '@/components/quick-add/quick-add-weight';
import { QuickAddNutrition } from '@/components/quick-add/quick-add-nutrition';
import { QuickAddDose } from '@/components/quick-add/quick-add-dose';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function DashboardView() {
  const [weightOpen, setWeightOpen] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [doseOpen, setDoseOpen] = useState(false);

  const weights = useWeightEntries();
  const doses = useDoseEntries();
  const settings = useSettings();
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');

  const todayWeight = weights.find((w) => w.date === todayKey);
  const lastWeight = weights[0];
  const deltaWeek = deltaWeightThisWeek(weights, today);
  const deltaSinceStart = deltaWeightSinceFirst(weights);
  const chartData = weightChartData(weights, 30, settings?.goalWeightKg);
  const goalKg = settings?.goalWeightKg;

  const lastDose = doses[0];
  const nextInjectionHint =
    lastDose && lastDose.compoundName
      ? (() => {
          const lastDate = parseISO(lastDose.datetime);
          const nextDate = addDays(lastDate, 7);
          const daysUntil = differenceInDays(nextDate, today);
          if (daysUntil <= 0) return { text: 'Сегодня возможна следующая инъекция', days: 0 };
          if (daysUntil === 1) return { text: 'Следующая инъекция завтра', days: 1 };
          return { text: `След. инъекция через ${daysUntil} дн.`, days: daysUntil };
        })()
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground">
          Сегодня {format(today, 'd MMMM yyyy', { locale: ru })}
        </p>
      </div>

      <ScrollReveal>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Сегодня</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {todayWeight != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{todayWeight.weightKg}</span>
                <span className="text-muted-foreground">кг</span>
              </div>
            ) : lastWeight ? (
              <div className="text-muted-foreground">
                Последний вес: <strong>{lastWeight.weightKg} кг</strong> ({lastWeight.date})
              </div>
            ) : (
              <p className="text-muted-foreground">Пока нет записей веса</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setWeightOpen(true)}>
                <Scale className="mr-1.5 h-4 w-4" />
                + Вес
              </Button>
              <Button size="sm" variant="outline" onClick={() => setNutritionOpen(true)}>
                <Utensils className="mr-1.5 h-4 w-4" />
                + Питание
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDoseOpen(true)}>
                <Syringe className="mr-1.5 h-4 w-4" />
                + Доза
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              За неделю
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={deltaWeek.delta >= 0 ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}>
              {deltaWeek.delta >= 0 ? '+' : ''}{deltaWeek.delta} кг
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              С начала дневника
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deltaSinceStart != null ? (
              <span className={deltaSinceStart.delta >= 0 ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}>
                {deltaSinceStart.delta >= 0 ? '+' : ''}{deltaSinceStart.delta} кг
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>
      </div>
      </ScrollReveal>

      {nextInjectionHint && (
        <ScrollReveal delay={100}>
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{nextInjectionHint.text}</p>
          </CardContent>
        </Card>
        </ScrollReveal>
      )}

      <ScrollReveal delay={100}>
      <Card>
        <CardHeader>
          <CardTitle>Вес за 30 дней</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(parseISO(v), 'd.M', { locale: ru })}
                    className="text-xs"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${v} кг`}
                    className="text-xs"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-md border bg-card p-2 shadow">
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(d.date), 'd MMM yyyy', { locale: ru })}
                          </p>
                          <p className="font-medium">{d.weightKg} кг</p>
                          {d.movingAvg7 != null && (
                            <p className="text-xs text-muted-foreground">
                              Ср. 7 дн.: {d.movingAvg7} кг
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  {goalKg != null && (
                    <ReferenceLine
                      y={goalKg}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="4 4"
                      label={{ value: 'Цель', position: 'right' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weightKg"
                    name="Вес"
                    stroke="hsl(var(--foreground))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="movingAvg7"
                    name="Ср. 7 дн."
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-center text-muted-foreground">
              <p className="text-sm font-medium">Пока нет данных</p>
              <p className="text-xs">Добавьте вес через кнопку «+ Вес», чтобы построить график</p>
            </div>
          )}
        </CardContent>
      </Card>
      </ScrollReveal>

      <QuickAddWeight open={weightOpen} onOpenChange={setWeightOpen} />
      <QuickAddNutrition open={nutritionOpen} onOpenChange={setNutritionOpen} />
      <QuickAddDose open={doseOpen} onOpenChange={setDoseOpen} />
    </div>
  );
}
