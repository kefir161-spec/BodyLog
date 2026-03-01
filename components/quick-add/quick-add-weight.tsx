'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WeightForm } from '@/components/forms/weight-form';
import { addWeightEntry } from '@/lib/crud';
import { useToast } from '@/components/providers/toast-provider';

type QuickAddWeightProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** При открытии из деталки дня — дата в формате yyyy-MM-dd */
  initialDate?: string;
};

export function QuickAddWeight({ open, onOpenChange, initialDate }: QuickAddWeightProps) {
  const { addToast } = useToast();

  async function handleSubmit(data: Parameters<typeof addWeightEntry>[0]) {
    const entry = await addWeightEntry(data);
    addToast({
      title: 'Вес добавлен',
      description: `${data.weightKg} кг`,
      variant: 'success',
      action: {
        label: 'Отменить',
        onClick: async () => {
          const { deleteWeightEntry } = await import('@/lib/crud');
          await deleteWeightEntry(entry.id);
        },
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Добавить вес</DialogTitle>
        </DialogHeader>
        <WeightForm
          key={open ? (initialDate ?? 'today') : 'closed'}
          defaultValues={open && initialDate ? { date: initialDate } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
