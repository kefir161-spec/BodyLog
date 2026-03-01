'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { manualIntakeEntrySchema, type ManualIntakeEntry } from '@/lib/models';

const optionalMacro = z.preprocess(
  (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : undefined),
  z.number().min(0).optional()
);
const formSchema = manualIntakeEntrySchema
  .omit({ id: true, date: true })
  .extend({ proteinG: optionalMacro, fatG: optionalMacro, carbsG: optionalMacro });
type FormValues = z.infer<typeof formSchema>;

/** Калории по БЖУ: формула Этуотера (4/9/4 ккал на 1 г белка/жира/углеводов) */
function kcalFromMacros(proteinG: number, fatG: number, carbsG: number): number {
  return proteinG * 4 + fatG * 9 + carbsG * 4;
}

function numInputValue(v: unknown): string | number {
  if (v == null || v === '' || (typeof v === 'number' && Number.isNaN(v))) return '';
  return typeof v === 'number' ? v : '';
}

type QuickAddManualIntakeProps = {
  date: string;
  onSubmit: (data: Omit<ManualIntakeEntry, 'id'>) => void | Promise<void>;
};

export function QuickAddManualIntake({ date, onSubmit }: QuickAddManualIntakeProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calories: undefined,
      proteinG: undefined,
      fatG: undefined,
      carbsG: undefined,
      note: '',
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
      form.setValue('calories', 0, { shouldValidate: true });
    }
  }, [proteinG, fatG, carbsG, form]);

  async function handleSubmit(values: FormValues) {
    await onSubmit({
      date,
      calories: values.calories,
      proteinG: Number.isFinite(values.proteinG) ? values.proteinG : undefined,
      fatG: Number.isFinite(values.fatG) ? values.fatG : undefined,
      carbsG: Number.isFinite(values.carbsG) ? values.carbsG : undefined,
      note: values.note || undefined,
    });
    form.reset({ calories: undefined, proteinG: undefined, fatG: undefined, carbsG: undefined, note: '' });
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
      <div className="grid gap-2">
        <Label htmlFor="manual-kcal">Калории, ккал *</Label>
        <p className="text-xs text-muted-foreground">Достаточно ввести только калории. Б/Ж/У — по желанию; если заполните, ккал посчитаются автоматически.</p>
        <Controller
          name="calories"
          control={form.control}
          render={({ field }) => (
            <Input
              id="manual-kcal"
              type="number"
              min={0}
              placeholder="500"
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
          <p className="text-sm text-destructive">{form.formState.errors.calories.message}</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1">
          <Label htmlFor="manual-p">Б (г), опц.</Label>
          <Controller
            name="proteinG"
            control={form.control}
            render={({ field }) => (
              <Input
                id="manual-p"
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
        <div className="grid gap-1">
          <Label htmlFor="manual-f">Ж (г), опц.</Label>
          <Controller
            name="fatG"
            control={form.control}
            render={({ field }) => (
              <Input
                id="manual-f"
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
        <div className="grid gap-1">
          <Label htmlFor="manual-c">У (г), опц.</Label>
          <Controller
            name="carbsG"
            control={form.control}
            render={({ field }) => (
              <Input
                id="manual-c"
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
      <div className="grid gap-1">
        <Label htmlFor="manual-note">Заметка</Label>
        <Input id="manual-note" placeholder="Опционально" {...form.register('note')} />
      </div>
      <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
        Добавить
      </Button>
    </form>
  );
}
