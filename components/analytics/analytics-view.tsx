'use client';

import { useMemo } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ComposedChart,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';
import { useWeightEntries, useDoseEntries, useNutritionEntries, useActivityEntries, useSettings } from '@/lib/hooks';
import {
  weightChartData,
  avgWeight,
  minWeight,
  maxWeight,
  nutritionChartData,
  doseTimelineData,
  activityChartData,
} from '@/lib/stats';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const CHART_DAYS = 30;

export function AnalyticsView() {
  const weights = useWeightEntries();
  const doses = useDoseEntries();
  const nutrition = useNutritionEntries();
  const activities = useActivityEntries();
  const settings = useSettings();

  const weightData = useMemo(
    () => weightChartData(weights, CHART_DAYS, settings?.goalWeightKg),
    [weights, settings?.goalWeightKg]
  );
  const nutritionData = useMemo(
    () => nutritionChartData(nutrition, CHART_DAYS, settings?.calorieTarget),
    [nutrition, settings?.calorieTarget]
  );
  const doseData = useMemo(() => doseTimelineData(doses, CHART_DAYS), [doses]);
  const activityData = useMemo(
    () => activityChartData(activities, CHART_DAYS),
    [activities]
  );

  const weightInsight = useMemo(() => {
    const last14 = weights.filter((w) => {
      const d = parseISO(w.date);
      return !d.getTime ? false : d >= subDays(new Date(), 14);
    });
    if (last14.length === 0) return null;
    const avg = avgWeight(last14);
    const min = minWeight(last14);
    const max = maxWeight(last14);
    return { avg, min, max, count: last14.length };
  }, [weights]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Аналитика</h1>
        <p className="text-muted-foreground">Графики и инсайты по данным</p>
      </div>

      <ScrollReveal>
      <Tabs defaultValue="weight" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="weight">Вес</TabsTrigger>
          <TabsTrigger value="nutrition">Питание</TabsTrigger>
          <TabsTrigger value="dose">Дозы</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="space-y-4">
          {weightInsight != null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">За 14 дней</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Средний вес: <strong className="text-foreground">{weightInsight.avg} кг</strong>
                {' · '}
                мин. {weightInsight.min} кг, макс. {weightInsight.max} кг
                {' · '}
                записей: {weightInsight.count}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Вес и скользящее среднее 7 дн.</CardTitle>
            </CardHeader>
            <CardContent>
              {weightData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                                <p className="text-xs">Ср. 7 дн.: {d.movingAvg7} кг</p>
                              )}
                            </div>
                          );
                        }}
                      />
                      {settings?.goalWeightKg != null && (
                        <ReferenceLine
                          y={settings.goalWeightKg}
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
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  Нет данных о весе
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Калории и цель</CardTitle>
            </CardHeader>
            <CardContent>
              {nutritionData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={nutritionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => format(parseISO(v), 'd.M', { locale: ru })}
                        className="text-xs"
                      />
                      <YAxis yAxisId="left" tickFormatter={(v) => `${v}`} className="text-xs" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-md border bg-card p-2 shadow">
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(d.date), 'd MMM yyyy', { locale: ru })}
                              </p>
                              <p className="font-medium">{d.calories} ккал</p>
                              {d.target != null && (
                                <p className="text-xs">Цель: {d.target} ккал</p>
                              )}
                            </div>
                          );
                        }}
                      />
                      {settings?.calorieTarget != null && (
                        <ReferenceLine
                          yAxisId="left"
                          y={settings.calorieTarget}
                          stroke="hsl(var(--primary))"
                          strokeDasharray="4 4"
                          label={{ value: 'Цель', position: 'right' }}
                        />
                      )}
                      <Bar
                        yAxisId="left"
                        dataKey="calories"
                        name="Ккал"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  Нет данных о питании
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Макросы (Б/Ж/У)</CardTitle>
            </CardHeader>
            <CardContent>
              {nutritionData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nutritionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} stackOffset="sign">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => format(parseISO(v), 'd.M', { locale: ru })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-md border bg-card p-2 shadow">
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(d.date), 'd MMM yyyy', { locale: ru })}
                              </p>
                              <p>Б: {d.proteinG} г · Ж: {d.fatG} г · У: {d.carbsG} г</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="proteinG" name="Белки" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="fatG" name="Жиры" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="carbsG" name="Углеводы" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  Нет данных о макросах
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Дозы по времени</CardTitle>
              </CardHeader>
            <CardContent>
              {doseData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="datetime"
                        tickFormatter={(v) => format(parseISO(v), 'd.MM', { locale: ru })}
                        className="text-xs"
                      />
                      <YAxis dataKey="doseMg" name="мг" unit=" мг" className="text-xs" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload;
                          return (
                            <div className="rounded-md border bg-card p-2 shadow">
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(p.datetime), 'd MMM yyyy, HH:mm', { locale: ru })}
                              </p>
                              <p className="font-medium">
                                {p.compoundName} {p.doseMg} мг
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Scatter name="Доза" data={doseData} fill="hsl(var(--primary))">
                        {doseData.map((_, i) => (
                          <Cell key={i} fill="hsl(var(--primary))" />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  Нет данных о дозах
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Шаги и велосипед</CardTitle>
              </CardHeader>
            <CardContent>
              {activityData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={activityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => format(parseISO(v), 'd.M', { locale: ru })}
                        className="text-xs"
                      />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-md border bg-card p-2 shadow">
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(d.date), 'd MMM yyyy', { locale: ru })}
                              </p>
                              <p>Шаги: {d.steps}</p>
                              <p>Велосипед: {d.cyclingMinutes} мин</p>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="steps"
                        name="Шаги"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="cyclingMinutes"
                        name="Вело (мин)"
                        fill="hsl(var(--muted-foreground))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  Нет данных об активности
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </ScrollReveal>
    </div>
  );
}
