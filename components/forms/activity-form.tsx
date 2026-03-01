'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { activityEntrySchema, type ActivityEntry } from '@/lib/models';
import { weightForDate, computeStepsKcal, computeCyclingKcal, defaultStepLengthCm } from '@/lib/stats';
import type { Settings } from '@/lib/models';
import type { WeightEntry } from '@/lib/models';
import { cn } from '@/lib/utils';

const formSchema = activityEntrySchema.omit({ id: true }).extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.preprocess(
    (v) =>
      v === '' || v === undefined || Number.isNaN(v) ? undefined : Number(v),
    z.number().min(0).optional()
  ),
  cyclingMinutes: z.preprocess(
    (v) =>
      v === '' || v === undefined || Number.isNaN(v) ? undefined : Number(v),
    z.number().min(0).optional()
  ),
  manualKcal: z.preprocess(
    (v) =>
      v === '' || v === undefined || Number.isNaN(v) ? undefined : Number(v),
    z.number().min(0).optional()
  ),
});
type FormValues = z.infer<typeof formSchema>;

const todayKey = format(new Date(), 'yyyy-MM-dd');
const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');

function numInputValue(v: unknown): string | number {
  if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return '';
  return typeof v === 'number' ? v : '';
}

type ActivityFormProps = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: Omit<ActivityEntry, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  /** Для показа расхода ккал по шагам: нужны профиль и вес на дату */
  settings?: Settings | null;
  weightEntries?: WeightEntry[];
};

export function ActivityForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
  settings,
  weightEntries = [],
}: ActivityFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: todayKey,
      steps: undefined,
      cyclingMinutes: undefined,
      manualKcal: undefined,
      workout: '',
      note: '',
      ...defaultValues,
    },
  });

  const date = form.watch('date');
  const steps = form.watch('steps');
  const cyclingMinutes = form.watch('cyclingMinutes');
  const stepsKcalPreview = useMemo(() => {
    if (!steps || steps <= 0 || !settings?.heightCm || !settings?.sex || !weightEntries.length) return null;
    const weightKg = weightForDate(weightEntries, date);
    if (weightKg == null) return null;
    const stepLengthCm =
      settings.stepLengthCm ??
      defaultStepLengthCm(settings.heightCm, settings.sex);
    const speed = settings.walkingSpeedKmh ?? 4.8;
    const met = settings.walkingMET ?? 3.3;
    return computeStepsKcal(steps, weightKg, stepLengthCm, speed, met);
  }, [steps, date, settings, weightEntries]);
  const cyclingKcalPreview = useMemo(() => {
    const mins = cyclingMinutes != null && !Number.isNaN(cyclingMinutes) ? Number(cyclingMinutes) : 0;
    if (mins <= 0 || !weightEntries.length) return null;
    const weightKg = weightForDate(weightEntries, date);
    if (weightKg == null) return null;
    const met = settings?.cyclingMET ?? 6;
    return computeCyclingKcal(mins, weightKg, met);
  }, [cyclingMinutes, date, settings?.cyclingMET, weightEntries]);

  async function handleSubmit(values: FormValues) {
    await onSubmit({
      date: values.date,
      steps: values.steps,
      cyclingMinutes: values.cyclingMinutes,
      manualKcal: values.manualKcal,
      workout: values.workout || undefined,
      note: values.note || undefined,
    });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={form.watch('date') === todayKey ? 'default' : 'outline'}
          size="sm"
          onClick={() => form.setValue('date', todayKey)}
        >
          Сегодня
        </Button>
        <Button
          type="button"
          variant={form.watch('date') === yesterdayKey ? 'default' : 'outline'}
          size="sm"
          onClick={() => form.setValue('date', yesterdayKey)}
        >
          Вчера
        </Button>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="act-date">Дата</Label>
        <Input id="act-date" type="date" {...form.register('date')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="act-steps">Шаги</Label>
          <Controller
            name="steps"
            control={form.control}
            render={({ field }) => (
              <Input
                id="act-steps"
                type="number"
                min={0}
                placeholder="0"
                value={numInputValue(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') { field.onChange(undefined); return; }
                  const n = parseFloat(v);
                  field.onChange(Number.isFinite(n) ? n : undefined);
                }}
                onBlur={field.onBlur}
              />
            )}
          />
          {stepsKcalPreview != null && (
            <p className="text-xs text-muted-foreground">
              ≈ {stepsKcalPreview} ккал расход (по профилю)
            </p>
          )}
          {steps != null && steps > 0 && stepsKcalPreview == null && settings && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Заполните Настройки: рост, пол, год рождения — и добавьте вес на эту дату, чтобы считать расход по шагам.
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="act-cycling">Велосипед (мин)</Label>
          <Controller
            name="cyclingMinutes"
            control={form.control}
            render={({ field }) => (
              <Input
                id="act-cycling"
                type="number"
                min={0}
                placeholder="0"
                value={numInputValue(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') { field.onChange(undefined); return; }
                  const n = parseFloat(v);
                  field.onChange(Number.isFinite(n) ? n : undefined);
                }}
                onBlur={field.onBlur}
              />
            )}
          />
          {cyclingKcalPreview != null && (
            <p className="text-xs text-muted-foreground">
              ≈ {cyclingKcalPreview} ккал расход
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="act-manualKcal">Расход ккал (вписать цифру)</Label>
        <Controller
          name="manualKcal"
          control={form.control}
          render={({ field }) => (
            <Input
              id="act-manualKcal"
              type="number"
              min={0}
              placeholder="0"
              value={numInputValue(field.value)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') { field.onChange(undefined); return; }
                const n = parseFloat(v);
                field.onChange(Number.isFinite(n) ? n : undefined);
              }}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="act-workout">Тренировка</Label>
        <Input
          id="act-workout"
          placeholder="Например: бег 30 мин"
          {...form.register('workout')}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="act-note">Заметка</Label>
        <Input id="act-note" placeholder="Опционально" {...form.register('note')} />
      </div>
      <div className={cn('flex gap-2', onCancel && 'justify-end')}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
