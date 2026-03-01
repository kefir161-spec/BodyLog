'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  weightEntrySchema,
  type WeightEntry,
} from '@/lib/models';
import { cn } from '@/lib/utils';

const formSchema = weightEntrySchema.omit({ id: true }).extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().min(0).optional(),
  bodyFatPct: z.preprocess(
    (v) => (v === '' || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    z.number().min(0).max(100).optional()
  ),
  waistCm: z.preprocess(
    (v) => (v === '' || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    z.number().min(30).max(200).optional()
  ),
});
type FormValues = z.infer<typeof formSchema>;

const todayKey = format(new Date(), 'yyyy-MM-dd');
const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');

function numInputValue(v: unknown): string | number {
  if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return '';
  return typeof v === 'number' ? v : '';
}

type WeightFormProps = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: Omit<WeightEntry, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function WeightForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
}: WeightFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: todayKey,
      weightKg: undefined,
      note: '',
      bodyFatPct: undefined,
      waistCm: undefined,
      ...defaultValues,
    },
  });

  async function handleSubmit(values: FormValues) {
    if (values.weightKg == null || Number.isNaN(values.weightKg)) {
      form.setError('weightKg', { type: 'required', message: 'Укажите вес' });
      return;
    }
    await onSubmit({
      date: values.date,
      weightKg: values.weightKg,
      note: values.note || undefined,
      bodyFatPct:
        values.bodyFatPct != null && !Number.isNaN(values.bodyFatPct)
          ? values.bodyFatPct
          : undefined,
      waistCm:
        values.waistCm != null && !Number.isNaN(values.waistCm)
          ? values.waistCm
          : undefined,
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
        <Label htmlFor="weight-date">Дата</Label>
        <Input
          id="weight-date"
          type="date"
          {...form.register('date')}
        />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive">
            {form.formState.errors.date.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="weight-kg">Вес (кг) *</Label>
        <Controller
          name="weightKg"
          control={form.control}
          render={({ field }) => (
            <Input
              id="weight-kg"
              type="number"
              step="0.1"
              placeholder="72.5"
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
        {form.formState.errors.weightKg && (
          <p className="text-sm text-destructive">
            {form.formState.errors.weightKg.message}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="body-fat">Жир %</Label>
          <Controller
            name="bodyFatPct"
            control={form.control}
            render={({ field }) => (
              <Input
                id="body-fat"
                type="number"
                step="0.1"
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
          <Label htmlFor="waist">Талия (см)</Label>
          <Controller
            name="waistCm"
            control={form.control}
            render={({ field }) => (
              <Input
                id="waist"
                type="number"
                step="0.1"
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
        <Label htmlFor="weight-note">Заметка</Label>
        <Input
          id="weight-note"
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
