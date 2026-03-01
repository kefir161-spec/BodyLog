'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActivityForm } from '@/components/forms/activity-form';
import { addActivityEntry } from '@/lib/crud';
import { useToast } from '@/components/providers/toast-provider';
import { useSettings, useWeightEntries } from '@/lib/hooks';
import { weightForDate, computeStepsKcal, defaultStepLengthCm } from '@/lib/stats';

type QuickAddActivityProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** При открытии из деталки дня — дата в формате yyyy-MM-dd */
  initialDate?: string;
};

export function QuickAddActivity({ open, onOpenChange, initialDate }: QuickAddActivityProps) {
  const { addToast } = useToast();
  const settings = useSettings();
  const weights = useWeightEntries();

  async function handleSubmit(data: Parameters<typeof addActivityEntry>[0]) {
    let stepsKcal: number | undefined;
    if (data.steps != null && data.steps > 0 && settings) {
      const weightKg = weightForDate(weights, data.date);
      if (weightKg != null) {
        const stepLengthCm =
          settings.stepLengthCm ??
          (settings.heightCm && settings.sex ? defaultStepLengthCm(settings.heightCm, settings.sex) : 78);
        const speed = settings.walkingSpeedKmh ?? 4.8;
        const met = settings.walkingMET ?? 3.3;
        stepsKcal = computeStepsKcal(data.steps, weightKg, stepLengthCm, speed, met);
      }
    }
    const entry = await addActivityEntry({
      ...data,
      stepsKcal,
      methodVersion: stepsKcal != null ? 'steps-v1' : undefined,
    });
    addToast({
      title: 'Активность добавлена',
      variant: 'success',
      action: {
        label: 'Отменить',
        onClick: async () => {
          const { deleteActivityEntry } = await import('@/lib/crud');
          await deleteActivityEntry(entry.id);
        },
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Добавить активность</DialogTitle>
        </DialogHeader>
        <ActivityForm
          key={open ? (initialDate ?? 'today') : 'closed'}
          defaultValues={open && initialDate ? { date: initialDate } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          settings={settings ?? null}
          weightEntries={weights}
        />
      </DialogContent>
    </Dialog>
  );
}
