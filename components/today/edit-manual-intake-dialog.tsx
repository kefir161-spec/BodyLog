'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { manualIntakeEntrySchema, type ManualIntakeEntry } from '@/lib/models';
import { updateManualIntakeEntry } from '@/lib/crud';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const formSchema = manualIntakeEntrySchema.omit({ id: true });
type FormValues = z.infer<typeof formSchema>;

function kcalFromMacros(proteinG: number, fatG: number, carbsG: number): number {
  return proteinG * 4 + fatG * 9 + carbsG * 4;
}

type EditManualIntakeDialogProps = {
  entryId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditManualIntakeDialog({
  entryId,
  onClose,
  onSaved,
}: EditManualIntakeDialogProps) {
  const entry = useLiveQuery(
    async () => (entryId ? db.manualIntakeEntries.get(entryId) : undefined),
    [entryId]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: useMemo(
      () =>
        entry
          ? {
              date: entry.date,
              calories: entry.calories,
              proteinG: entry.proteinG ?? undefined,
              fatG: entry.fatG ?? undefined,
              carbsG: entry.carbsG ?? undefined,
              note: entry.note ?? '',
            }
          : undefined,
      [entry]
    ),
  });

  const proteinG = form.watch('proteinG');
  const fatG = form.watch('fatG');
  const carbsG = form.watch('carbsG');

  useEffect(() => {
    const p = Number(proteinG);
    const f = Number(fatG);
    const c = Number(carbsG);
    if (Number.isFinite(p) || Number.isFinite(f) || Number.isFinite(c)) {
      const kcal = kcalFromMacros(
        Number.isFinite(p) && p >= 0 ? p : 0,
        Number.isFinite(f) && f >= 0 ? f : 0,
        Number.isFinite(c) && c >= 0 ? c : 0
      );
      if (kcal >= 0) {
        form.setValue('calories', Math.round(kcal), { shouldValidate: true });
      }
    }
  }, [proteinG, fatG, carbsG, form]);

  async function handleSubmit(values: FormValues) {
    if (!entryId) return;
    await updateManualIntakeEntry(entryId, {
      calories: values.calories,
      proteinG: values.proteinG ?? null,
      fatG: values.fatG ?? null,
      carbsG: values.carbsG ?? null,
      note: values.note || undefined,
    });
    onSaved();
    onClose();
  }

  if (entryId == null) return null;

  return (
    <Dialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Изменить запись калорий</DialogTitle>
        </DialogHeader>
        {entry ? (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label>Дата</Label>
              <Input value={entry.date} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-kcal">Калории, ккал *</Label>
              <Input
                id="edit-kcal"
                type="number"
                min={0}
                {...form.register('calories', { valueAsNumber: true })}
              />
              {form.formState.errors.calories && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.calories.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-1">
                <Label>Б (г)</Label>
                <Input type="number" min={0} {...form.register('proteinG', { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1">
                <Label>Ж (г)</Label>
                <Input type="number" min={0} {...form.register('fatG', { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1">
                <Label>У (г)</Label>
                <Input type="number" min={0} {...form.register('carbsG', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Заметка</Label>
              <Input {...form.register('note')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Сохранить
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
