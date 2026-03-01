'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  doseEntrySchema,
  injectionSiteEnum,
  type DoseEntry,
} from '@/lib/models';
import { cn } from '@/lib/utils';

const formSchema = doseEntrySchema.omit({ id: true }).extend({
  datetime: z.string().min(1, 'Укажите дату и время'),
  doseMg: z.number().min(0.1).optional(),
});
type FormValues = z.infer<typeof formSchema>;

const injectionSites = [
  { value: 'left_abdomen', label: 'Живот слева' },
  { value: 'right_abdomen', label: 'Живот справа' },
  { value: 'left_thigh', label: 'Бедро слева' },
  { value: 'right_thigh', label: 'Бедро справа' },
  { value: 'left_arm', label: 'Рука слева' },
  { value: 'right_arm', label: 'Рука справа' },
];

const defaultDatetime = format(new Date(), "yyyy-MM-dd'T'HH:mm");

function numInputValue(v: unknown): string | number {
  if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return '';
  return typeof v === 'number' ? v : '';
}

type DoseFormProps = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: Omit<DoseEntry, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

export function DoseForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
}: DoseFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      datetime: defaultDatetime,
      compoundName: 'tirzepatide',
      doseMg: undefined,
      injectionSite: undefined,
      note: '',
      ...defaultValues,
    },
  });

  async function handleSubmit(values: FormValues) {
    if (values.doseMg == null || Number.isNaN(values.doseMg) || values.doseMg < 0.1) {
      form.setError('doseMg', { type: 'required', message: 'Укажите дозу (мг)' });
      return;
    }
    await onSubmit({
      datetime: new Date(values.datetime).toISOString(),
      compoundName: values.compoundName,
      doseMg: values.doseMg,
      injectionSite: values.injectionSite,
      note: values.note || undefined,
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-4"
    >
      <div className="grid gap-2">
        <Label htmlFor="dose-datetime">Дата и время *</Label>
        <Controller
          name="datetime"
          control={form.control}
          render={({ field }) => (
            <DateTimePicker
              id="dose-datetime"
              value={field.value}
              onChange={field.onChange}
              placeholder="Выберите дату и время"
            />
          )}
        />
        {form.formState.errors.datetime && (
          <p className="text-sm text-destructive">
            {form.formState.errors.datetime.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dose-compound">Препарат *</Label>
        <Input
          id="dose-compound"
          placeholder="tirzepatide"
          {...form.register('compoundName')}
        />
        {form.formState.errors.compoundName && (
          <p className="text-sm text-destructive">
            {form.formState.errors.compoundName.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dose-mg">Доза (мг) *</Label>
        <Controller
          name="doseMg"
          control={form.control}
          render={({ field }) => (
            <Input
              id="dose-mg"
              type="number"
              step="0.1"
              min={0.1}
              placeholder="2.5"
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
        {form.formState.errors.doseMg && (
          <p className="text-sm text-destructive">
            {form.formState.errors.doseMg.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dose-site">Место укола</Label>
        <Select
          value={form.watch('injectionSite') ?? ''}
          onValueChange={(v) =>
            form.setValue('injectionSite', v ? (v as FormValues['injectionSite']) : undefined)
          }
        >
          <SelectTrigger id="dose-site">
            <SelectValue placeholder="Не указано" />
          </SelectTrigger>
          <SelectContent>
            {injectionSites.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dose-note">Заметка</Label>
        <Input
          id="dose-note"
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
