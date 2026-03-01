'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActivityForm } from '@/components/forms/activity-form';
import { updateActivityEntry } from '@/lib/crud';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings, useWeightEntries } from '@/lib/hooks';
import { weightForDate, computeStepsKcal, defaultStepLengthCm } from '@/lib/stats';

type EditActivityDialogProps = {
  entryId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditActivityDialog({
  entryId,
  onClose,
  onSaved,
}: EditActivityDialogProps) {
  const entry = useLiveQuery(
    async () => (entryId ? db.activityEntries.get(entryId) : undefined),
    [entryId]
  );
  const settings = useSettings();
  const weights = useWeightEntries();

  async function handleSubmit(data: Parameters<typeof updateActivityEntry>[1]) {
    if (!entryId) return;
    let stepsKcal: number | undefined;
    if (data.steps != null && data.steps > 0 && settings) {
      const weightKg = weightForDate(weights, data.date!);
      if (weightKg != null) {
        const stepLengthCm =
          settings.stepLengthCm ??
          (settings.heightCm && settings.sex ? defaultStepLengthCm(settings.heightCm, settings.sex) : 78);
        const speed = settings.walkingSpeedKmh ?? 4.8;
        const met = settings.walkingMET ?? 3.3;
        stepsKcal = computeStepsKcal(data.steps, weightKg, stepLengthCm, speed, met);
      }
    }
    await updateActivityEntry(entryId, {
      ...data,
      stepsKcal,
      methodVersion: stepsKcal != null ? 'steps-v1' : undefined,
    });
    onSaved();
    onClose();
  }

  const defaultValues = useMemo(
    () =>
      entry
        ? {
            date: entry.date,
            steps: entry.steps,
            cyclingMinutes: entry.cyclingMinutes,
            manualKcal: entry.manualKcal,
            workout: entry.workout ?? '',
            note: entry.note ?? '',
          }
        : undefined,
    [entry]
  );

  if (entryId == null) return null;

  return (
    <Dialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Изменить активность</DialogTitle>
        </DialogHeader>
        {entry ? (
          <ActivityForm
            key={entryId}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Сохранить"
            settings={settings ?? null}
            weightEntries={weights}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
