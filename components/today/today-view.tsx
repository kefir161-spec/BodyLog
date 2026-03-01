'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Scale, Utensils, Syringe, Flame, Trash2, Activity, Pencil, StickyNote, Bell, CircleCheck, Circle } from 'lucide-react';
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
import { formatSignedKcal } from '@/lib/stats';
import { QuickAddWeight } from '@/components/quick-add/quick-add-weight';
import { QuickAddDose } from '@/components/quick-add/quick-add-dose';
import { QuickAddActivity } from '@/components/quick-add/quick-add-activity';
import { QuickAddManualIntake } from '@/components/today/quick-add-manual-intake';
import { addManualIntakeEntry, deleteManualIntakeEntry, updateManualIntakeEntry, addNoteEntry, deleteNoteEntry, updateNoteEntry, deleteWeightEntry } from '@/lib/crud';
import { useToast } from '@/components/providers/toast-provider';
import { EditManualIntakeDialog } from '@/components/today/edit-manual-intake-dialog';
import { EditWeightDialog } from '@/components/today/edit-weight-dialog';
import { EditNoteDialog } from '@/components/today/edit-note-dialog';
import { MealDishForm } from '@/components/today/meal-dish-form';
import { weeksLabel, WeightChartTooltipContent, daysUntilNextMonday, injectionCardColorClass, noteReminderColorClass, isNoteReminderPast } from './today-view-helpers';
import { useTodayViewData } from './useTodayViewData';
import { WeightLossEquivalents } from './weight-loss-equivalents';
import { useNoteEntries } from '@/lib/hooks';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function TodayView() {
  const [weightOpen, setWeightOpen] = useState(false);
  const [doseOpen, setDoseOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [editManualId, setEditManualId] = useState<string | null>(null);
  const [editWeightId, setEditWeightId] = useState<string | null>(null);
  const [nutritionSectionOpen, setNutritionSectionOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteReminder, setNewNoteReminder] = useState('');
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const { addToast } = useToast();
  const data = useTodayViewData();
  const notes = useNoteEntries();
  const activeNotes = notes.filter((n) => !n.completedAt);
  const completedNotes = notes.filter((n) => n.completedAt);
  const hasIntakeToday = data.intakeToday.kcal > 0;
  const hasActivityToday =
    data.todayActivity != null &&
    (data.todayActivity.steps != null ||
      data.todayActivity.cyclingMinutes != null ||
      (data.todayActivity.manualKcal != null && data.todayActivity.manualKcal > 0) ||
      (data.todayActivity.workout != null && data.todayActivity.workout !== ''));
  const showBalanceToday = hasIntakeToday && hasActivityToday;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Сегодня</h1>
        <p className="text-muted-foreground">
          {format(data.today, 'd MMMM yyyy', { locale: ru })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ScrollReveal>
            <Card className="border-cyan-200/70 bg-cyan-50/70 dark:border-cyan-800/40 dark:bg-cyan-950/25 transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Энергобаланс дня
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Приход, ккал</p>
                  <p className="text-2xl font-bold">{data.intakeToday.kcal}</p>
                  {(data.intakeToday.proteinG > 0 || data.intakeToday.fatG > 0 || data.intakeToday.carbsG > 0) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Б {data.intakeToday.proteinG} / Ж {data.intakeToday.fatG} / У {data.intakeToday.carbsG} г
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Расход, ккал</p>
                  <p className="text-2xl font-bold">{data.burnBreakdown.total}</p>
                  {data.burnBreakdown.hasBase && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Базовый {data.burnBreakdown.weightUsedKg != null ? `(при ${data.burnBreakdown.weightUsedKg} кг) ` : ''}{data.burnBreakdown.tdee}
                      {(data.burnBreakdown.stepsKcal > 0 || data.burnBreakdown.cyclingKcal > 0 || data.burnBreakdown.manualKcal > 0) && (
                        <> · Активность +{data.burnBreakdown.stepsKcal + data.burnBreakdown.cyclingKcal + data.burnBreakdown.manualKcal}</>
                      )}
                    </p>
                  )}
                  {!data.burnBreakdown.hasBase && (data.burnBreakdown.stepsKcal > 0 || data.burnBreakdown.cyclingKcal > 0 || data.burnBreakdown.manualKcal > 0) && (
                    <p className="text-xs text-muted-foreground mt-0.5">Только активность</p>
                  )}
                  {!data.burnBreakdown.hasBase && data.burnBreakdown.total === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Укажите профиль и вес в Настройках</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Баланс</p>
                  <p className={`text-2xl font-bold ${showBalanceToday ? (data.balanceToday > 0 ? 'text-amber-600 dark:text-amber-500' : data.balanceToday < 0 ? 'text-green-600 dark:text-green-400' : '') : 'text-muted-foreground'}`}>
                    {showBalanceToday ? `${formatSignedKcal(data.balanceToday)} ккал` : '—'}
                  </p>
                </div>
              </div>
              {data.todayActivity && (data.todayActivity.steps != null || data.todayActivity.cyclingMinutes != null || (data.todayActivity.manualKcal != null && data.todayActivity.manualKcal > 0)) && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  Активность сегодня:{' '}
                  {[
                    data.todayActivity.steps != null && data.todayActivity.steps > 0 ? `${data.todayActivity.steps} шагов` : null,
                    data.todayActivity.cyclingMinutes != null && data.todayActivity.cyclingMinutes > 0 ? `${data.todayActivity.cyclingMinutes} мин вело` : null,
                    data.todayActivity.manualKcal != null && data.todayActivity.manualKcal > 0 ? `${data.todayActivity.manualKcal} ккал` : null,
                  ].filter(Boolean).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
          </ScrollReveal>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setWeightOpen(true)}>
              <Scale className="mr-1.5 h-4 w-4" />
              + Вес
            </Button>
            <Button size="sm" variant="outline" onClick={() => setNutritionSectionOpen(true)}>
              <Utensils className="mr-1.5 h-4 w-4" />
              + Питание
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActivityOpen(true)}>
              <Activity className="mr-1.5 h-4 w-4" />
              + Активность
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDoseOpen(true)}>
              <Syringe className="mr-1.5 h-4 w-4" />
              + Доза
            </Button>
          </div>
          <ScrollReveal delay={100}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Вес</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-baseline gap-4">
                  <div>
                    {data.todayWeight != null ? (
                      <button
                        type="button"
                        onClick={() => setEditWeightId(data.todayWeight!.id)}
                        className="flex items-baseline gap-2 rounded-md hover:bg-muted/50 px-1 py-0.5 -mx-1"
                      >
                        <span className="text-3xl font-bold">{data.todayWeight!.weightKg}</span>
                        <span className="text-muted-foreground">кг</span>
                        <Pencil className="ml-1 h-4 w-4 text-muted-foreground" />
                      </button>
                    ) : data.lastWeight ? (
                      <button
                        type="button"
                        onClick={() => setEditWeightId(data.lastWeight!.id)}
                        className="text-muted-foreground rounded-md hover:bg-muted/50 px-1 py-0.5 -mx-1 text-left"
                      >
                        <span className="text-2xl font-semibold">{data.lastWeight!.weightKg}</span>
                        <span className="text-muted-foreground"> кг</span>
                        <span className="text-sm ml-1">(последний)</span>
                        <Pencil className="ml-1 h-4 w-4 inline" />
                      </button>
                    ) : (
                      <p className="text-muted-foreground">Нет записей веса</p>
                    )}
                  </div>
                  {data.goalKg != null && (
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">Цель: {data.goalKg} кг</span>
                      {data.goalProjection != null ? (
                        <p className="text-sm mt-0.5">
                          ≈ {data.goalProjection.weeks} {weeksLabel(data.goalProjection.weeks)} до цели
                          <span className="text-muted-foreground">
                            {' '}· {data.currentWeightForGoal != null && data.currentWeightForGoal > data.goalKg ? '−' : '+'}{data.goalProjection.ratePerWeekKg.toFixed(1)} кг/нед
                          </span>
                        </p>
                      ) : data.currentWeightForGoal != null && Math.abs((data.currentWeightForGoal ?? 0) - data.goalKg) >= 0.1 ? (
                        <p className="text-xs mt-0.5 text-amber-600 dark:text-amber-500">
                          Ведите вес регулярно — прогноз появится по темпу за 7–30 дней
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
                {data.weights.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Последние записи</p>
                    <ul className="space-y-1 text-sm">
                      {data.weights.slice(0, 10).map((w) => (
                        <li key={w.id} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-2 py-1.5">
                          <span className="text-muted-foreground">{format(parseISO(w.date), 'd.MM.yyyy', { locale: ru })}</span>
                          <span className="font-medium">{w.weightKg} кг</span>
                          <span className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditWeightId(w.id)}
                              title="Изменить"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={async () => {
                                await deleteWeightEntry(w.id);
                                addToast({ title: 'Запись о весе удалена', variant: 'default' });
                              }}
                              title="Удалить"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <div className="space-y-6">
          <ScrollReveal delay={50}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Потеря веса — эквиваленты</CardTitle>
              </CardHeader>
              <CardContent>
                <WeightLossEquivalents
                  startWeightKg={data.startWeightKg}
                  currentWeightKg={data.currentWeightKg}
                  daysCount={data.weightLossDays}
                  className="min-h-[96px]"
                />
              </CardContent>
            </Card>
          </ScrollReveal>
          <ScrollReveal delay={150}>
          <Card className="border-pink-200/70 bg-pink-50/70 dark:border-pink-800/40 dark:bg-pink-950/25 transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Заметки и напоминания
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const text = newNoteText.trim();
                if (!text) return;
                const reminderAt = newNoteReminder
                  ? new Date(newNoteReminder).toISOString()
                  : undefined;
                await addNoteEntry({ text, reminderAt });
                setNewNoteText('');
                setNewNoteReminder('');
                addToast({ title: 'Заметка добавлена', variant: 'success' });
              }}
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Новая заметка..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!newNoteText.trim()}>
                  Добавить
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Напоминание:</label>
                <DateTimePicker
                  value={newNoteReminder}
                  onChange={setNewNoteReminder}
                  placeholder="Укажите дату и время напоминания"
                />
              </div>
            </form>
            {activeNotes.length === 0 && completedNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Пока нет заметок</p>
            ) : (
              <>
                {activeNotes.length > 0 && (
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {activeNotes.map((n) => (
                      <li
                        key={n.id}
                        className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${noteReminderColorClass(n.reminderAt, data.today)}`}
                      >
                        <span className={`min-w-0 flex-1 ${isNoteReminderPast(n.reminderAt, data.today) ? 'line-through text-muted-foreground' : ''}`}>
                          {n.reminderAt && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground mr-1">
                              <Bell className="h-3.5 w-3.5 shrink-0" />
                              {format(parseISO(n.reminderAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                            </span>
                          )}
                          {n.text}
                        </span>
                        <span className="flex gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={async () => {
                              await updateNoteEntry(n.id, { completedAt: new Date().toISOString() });
                              addToast({ title: 'Задача выполнена', variant: 'success' });
                            }}
                            title="Выполнено"
                          >
                            <CircleCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditNoteId(n.id)}
                            title="Изменить"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={async () => {
                              await deleteNoteEntry(n.id);
                              addToast({ title: 'Заметка удалена', variant: 'default' });
                            }}
                            title="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {completedNotes.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Выполненные задачи</p>
                    <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                      {completedNotes.map((n) => (
                        <li
                          key={n.id}
                          className="flex items-start justify-between gap-2 rounded-lg border border-dashed px-3 py-2 text-sm bg-muted/30"
                        >
                          <span className="min-w-0 flex-1 line-through text-muted-foreground">
                            {n.reminderAt && (
                              <span className="inline-flex items-center gap-1 mr-1">
                                <Bell className="h-3.5 w-3.5 shrink-0" />
                                {format(parseISO(n.reminderAt), 'd MMMM yyyy, HH:mm', { locale: ru })}
                              </span>
                            )}
                            {n.text}
                          </span>
                          <span className="flex gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={async () => {
                                await updateNoteEntry(n.id, { completedAt: undefined });
                                addToast({ title: 'Задача возвращена в активные', variant: 'default' });
                              }}
                              title="Вернуть в активные"
                            >
                              <Circle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditNoteId(n.id)}
                              title="Изменить"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={async () => {
                                await deleteNoteEntry(n.id);
                                addToast({ title: 'Заметка удалена', variant: 'default' });
                              }}
                              title="Удалить"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
          </ScrollReveal>
        </div>
      </div>

      <ScrollReveal>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              За неделю
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={data.deltaWeek.delta >= 0 ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}>
              {data.deltaWeek.delta >= 0 ? '+' : ''}{data.deltaWeek.delta} кг
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
            {data.deltaSinceStart != null ? (
              <span className={data.deltaSinceStart.delta >= 0 ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}>
                {data.deltaSinceStart.delta >= 0 ? '+' : ''}{data.deltaSinceStart.delta} кг
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </CardContent>
        </Card>
      </div>
      </ScrollReveal>

      <ScrollReveal>
      {(() => {
        const daysUntilMon = daysUntilNextMonday(data.today);
        const colorClass = injectionCardColorClass(daysUntilMon);
        const monText = daysUntilMon === 0 ? 'Сегодня понедельник — день инъекции' : `До след. инъекции (пн): ${daysUntilMon} ${daysUntilMon === 1 ? 'день' : daysUntilMon < 5 ? 'дня' : 'дней'}`;
        return (
          <Card className={colorClass}>
            <CardContent className="pt-6">
              {data.nextInjectionHint && (
                <p className="text-sm font-medium">{data.nextInjectionHint.text}</p>
              )}
              <p className={`text-sm ${data.nextInjectionHint ? 'text-muted-foreground mt-1' : 'font-medium'}`}>{monText}</p>
            </CardContent>
          </Card>
        );
      })()}
      </ScrollReveal>

      <Dialog open={nutritionSectionOpen} onOpenChange={setNutritionSectionOpen}>
        <DialogContent showClose className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Питание
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Итого: <strong>{data.intakeToday.kcal} ккал</strong>
              {(data.intakeToday.proteinG > 0 || data.intakeToday.fatG > 0 || data.intakeToday.carbsG > 0) &&
                ` · Б ${Math.round(data.intakeToday.proteinG)} / Ж ${Math.round(data.intakeToday.fatG)} / У ${Math.round(data.intakeToday.carbsG)}`}
            </p>
            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick">Быстро</TabsTrigger>
                <TabsTrigger value="meal">Блюдо</TabsTrigger>
              </TabsList>
              <TabsContent value="quick" className="space-y-4 pt-2">
                <QuickAddManualIntake
                  date={data.todayKey}
                  onSubmit={async (data) => {
                    const entry = await addManualIntakeEntry(data);
                    addToast({
                      title: 'Запись добавлена',
                      description: `${data.calories} ккал`,
                      variant: 'success',
                      action: {
                        label: 'Отменить',
                        onClick: () => deleteManualIntakeEntry(entry.id),
                      },
                    });
                  }}
                />
                {data.manualIntakesToday.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {data.manualIntakesToday.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                        <span>
                          <strong>{m.calories} ккал</strong>
                          {(m.proteinG != null || m.fatG != null || m.carbsG != null) && (
                            <span className="text-muted-foreground ml-2">
                              Б {Math.round(m.proteinG ?? 0)} / Ж {Math.round(m.fatG ?? 0)} / У {Math.round(m.carbsG ?? 0)}
                            </span>
                          )}
                          {m.note && <span className="text-muted-foreground"> · {m.note}</span>}
                        </span>
                        <span className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); setEditManualId(m.id); }}
                            title="Изменить"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteManualIntakeEntry(m.id);
                              addToast({ title: 'Удалено', variant: 'default' });
                            }}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="meal" className="py-4">
                <MealDishForm date={data.todayKey} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollReveal>
      <Card>
        <CardHeader>
          <CardTitle>Вес за 30 дней</CardTitle>
        </CardHeader>
        <CardContent>
          {data.chartData.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                  <Tooltip content={WeightChartTooltipContent} />
                  {data.goalKg != null && (
                    <ReferenceLine
                      y={data.goalKg}
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
      <QuickAddDose open={doseOpen} onOpenChange={setDoseOpen} />
      <QuickAddActivity open={activityOpen} onOpenChange={setActivityOpen} />
      <EditManualIntakeDialog
        entryId={editManualId}
        onClose={() => setEditManualId(null)}
        onSaved={() => {
          setEditManualId(null);
          addToast({ title: 'Запись обновлена', variant: 'success' });
        }}
      />
      <EditWeightDialog
        entryId={editWeightId}
        onClose={() => setEditWeightId(null)}
        onSaved={() => {
          setEditWeightId(null);
          addToast({ title: 'Вес обновлён', variant: 'success' });
        }}
      />
      <EditNoteDialog
        entryId={editNoteId}
        onClose={() => setEditNoteId(null)}
        onSaved={() => {
          setEditNoteId(null);
          addToast({ title: 'Заметка сохранена', variant: 'success' });
        }}
      />
    </div>
  );
}
