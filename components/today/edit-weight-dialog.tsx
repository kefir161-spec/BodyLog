'use client';

import { useMemo } from 'react';
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
import { weightEntrySchema, type WeightEntry } from '@/lib/models';
import { updateWeightEntry } from '@/lib/crud';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const formSchema = weightEntrySchema.omit({ id: true });
type FormValues = z.infer<typeof formSchema>;

type EditWeightDialogProps = {
  entryId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditWeightDialog({
  entryId,
  onClose,
  onSaved,
}: EditWeightDialogProps) {
  const entry = useLiveQuery(
    async () => (entryId ? db.weightEntries.get(entryId) : undefined),
    [entryId]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: useMemo(
      () =>
        entry
          ? {
              date: entry.date,
              weightKg: entry.weightKg,
              note: entry.note ?? '',
              bodyFatPct: entry.bodyFatPct,
              waistCm: entry.waistCm,
            }
          : undefined,
      [entry]
    ),
  });

  async function handleSubmit(values: FormValues) {
    if (!entryId) return;
    await updateWeightEntry(entryId, {
      date: values.date,
      weightKg: values.weightKg,
      note: values.note || undefined,
      bodyFatPct: values.bodyFatPct,
      waistCm: values.waistCm,
    });
    onSaved();
    onClose();
  }

  if (entryId == null) return null;

  return (
    <Dialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Изменить вес</DialogTitle>
        </DialogHeader>
        {entry ? (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-weight-date">Дата</Label>
              <Input id="edit-weight-date" type="date" {...form.register('date')} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-weight-kg">Вес (кг) *</Label>
              <Input
                id="edit-weight-kg"
                type="number"
                step="0.1"
                {...form.register('weightKg', { valueAsNumber: true })}
              />
              {form.formState.errors.weightKg && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.weightKg.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Жир %</Label>
                <Input type="number" step="0.1" {...form.register('bodyFatPct', { valueAsNumber: true })} />
              </div>
              <div className="grid gap-1">
                <Label>Талия (см)</Label>
                <Input type="number" step="0.1" {...form.register('waistCm', { valueAsNumber: true })} />
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
