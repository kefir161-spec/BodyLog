'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DoseForm } from '@/components/forms/dose-form';
import { updateDoseEntry } from '@/lib/crud';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

type EditDoseDialogProps = {
  entryId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditDoseDialog({
  entryId,
  onClose,
  onSaved,
}: EditDoseDialogProps) {
  const entry = useLiveQuery(
    async () => (entryId ? db.doseEntries.get(entryId) : undefined),
    [entryId]
  );

  const defaultValues = useMemo(() => {
    if (!entry) return undefined;
    const dt = parseISO(entry.datetime);
    return {
      datetime: format(dt, "yyyy-MM-dd'T'HH:mm"),
      compoundName: entry.compoundName,
      doseMg: entry.doseMg,
      injectionSite: entry.injectionSite ?? undefined,
      note: entry.note ?? '',
    };
  }, [entry]);

  async function handleSubmit(data: Parameters<typeof updateDoseEntry>[1]) {
    if (!entryId) return;
    await updateDoseEntry(entryId, {
      datetime: new Date(data.datetime!).toISOString(),
      compoundName: data.compoundName,
      doseMg: data.doseMg,
      injectionSite: data.injectionSite,
      note: data.note || undefined,
    });
    onSaved();
    onClose();
  }

  if (entryId == null) return null;

  return (
    <Dialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Изменить дозу</DialogTitle>
        </DialogHeader>
        {entry ? (
          <DoseForm
            key={entryId}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Сохранить"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
