'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  nutritionEntrySchema,
  fastingWindowEnum,
  type NutritionEntry,
} from '@/lib/models';
import { cn } from '@/lib/utils';

const formSchema = nutritionEntrySchema.omit({ id: true }).extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calories: z.number().min(0).optional(),
  proteinG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
});
type FormValues = z.infer<typeof formSchema>;

/** Калории по БЖУ: 4 ккал/г белка, 9 ккал/г жира, 4 ккал/г углеводов */
function kcalFromMacros(proteinG: number, fatG: number, carbsG: number): number {
  return proteinG * 4 + fatG * 9 + carbsG * 4;
}

/** Пустое числовое поле: показываем '', иначе число (чтобы не было 0/NaN при вводе) */
function numInputValue(v: unknown): string | number {
  if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return '';
  return typeof v === 'number' ? v : '';
}

const todayKey = format(new Date(), 'yyyy-MM-dd');
const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');

const fastingOptions = [
  { value: 'none', label: 'Без окна' },
  { value: '18/6', label: '18/6' },
  { value: '17/7', label: '17/7' },
  { value: '16/8', label: '16/8' },
];

type NutritionFormProps = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: Omit<NutritionEntry, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function NutritionForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
}: NutritionFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: todayKey,
      calories: undefined,
      proteinG: undefined,
      fatG: undefined,
      carbsG: undefined,
      fastingWindow: 'none',
      note: '',
      ...defaultValues,
    },
  });

  const proteinG = form.watch('proteinG');
  const fatG = form.watch('fatG');
  const carbsG = form.watch('carbsG');

  useEffect(() => {
    const p = Number(proteinG);
    const f = Number(fatG);
    const c = Number(carbsG);
    const hasAny = Number.isFinite(p) || Number.isFinite(f) || Number.isFinite(c);
    if (hasAny) {
      const kcal = kcalFromMacros(
        Number.isFinite(p) && p >= 0 ? p : 0,
        Number.isFinite(f) && f >= 0 ? f : 0,
        Number.isFinite(c) && c >= 0 ? c : 0
      );
      if (kcal >= 0) {
        form.setValue('calories', Math.round(kcal), { shouldValidate: true });
      }
    } else {
      form.setValue('calories', undefined, { shouldValidate: true });
    }
  }, [proteinG, fatG, carbsG, form]);

  async function handleSubmit(values: FormValues) {
    const hasCalories = values.calories != null && !Number.isNaN(values.calories) && values.calories >= 0;
    const hasBJU = Number.isFinite(values.proteinG) || Number.isFinite(values.fatG) || Number.isFinite(values.carbsG);
    if (!hasCalories && !hasBJU) {
      form.setError('calories', { type: 'required', message: 'Укажите ккал или Б/Ж/У' });
      return;
    }
    const finalCalories = hasCalories
      ? values.calories!
      : kcalFromMacros(values.proteinG ?? 0, values.fatG ?? 0, values.carbsG ?? 0);
    await onSubmit({
      date: values.date,
      calories: finalCalories,
      proteinG: values.proteinG ?? 0,
      fatG: values.fatG ?? 0,
      carbsG: values.carbsG ?? 0,
      fastingWindow: values.fastingWindow === 'none' ? undefined : values.fastingWindow,
      note: values.note || undefined,
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-4"
    >
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
        <Label htmlFor="nut-date">Дата</Label>
        <Input
          id="nut-date"
          type="date"
          {...form.register('date')}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nut-fasting">Окно голодания</Label>
        <Select
          value={form.watch('fastingWindow') ?? 'none'}
          onValueChange={(v) => form.setValue('fastingWindow', v as FormValues['fastingWindow'])}
        >
          <SelectTrigger id="nut-fasting">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fastingOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nut-calories">Ккал *</Label>
        <p className="text-xs text-muted-foreground">Можно ввести только Б/Ж/У — ккал посчитаются автоматически.</p>
        <Controller
          name="calories"
          control={form.control}
          render={({ field }) => (
            <Input
              id="nut-calories"
              type="number"
              min={0}
              placeholder="2000"
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
        {form.formState.errors.calories && (
          <p className="text-sm text-destructive">
            {form.formState.errors.calories.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-2">
          <Label htmlFor="nut-protein">Б (г)</Label>
          <Controller
            name="proteinG"
            control={form.control}
            render={({ field }) => (
              <Input
                id="nut-protein"
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
          <Label htmlFor="nut-fat">Ж (г)</Label>
          <Controller
            name="fatG"
            control={form.control}
            render={({ field }) => (
              <Input
                id="nut-fat"
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
          <Label htmlFor="nut-carbs">У (г)</Label>
          <Controller
            name="carbsG"
            control={form.control}
            render={({ field }) => (
              <Input
                id="nut-carbs"
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
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nut-note">Заметка</Label>
        <Input
          id="nut-note"
          placeholder="Опционально"
          {...form.register('note')}
        />
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
