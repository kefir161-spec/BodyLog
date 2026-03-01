'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DoseForm } from '@/components/forms/dose-form';
import { addDoseEntry } from '@/lib/crud';
import { useToast } from '@/components/providers/toast-provider';

type QuickAddDoseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** При открытии из деталки дня — дата в формате yyyy-MM-dd (время будет 12:00) */
  initialDate?: string;
};

export function QuickAddDose({ open, onOpenChange, initialDate }: QuickAddDoseProps) {
  const { addToast } = useToast();

  async function handleSubmit(data: Parameters<typeof addDoseEntry>[0]) {
    const entry = await addDoseEntry(data);
    addToast({
      title: 'Доза добавлена',
      description: `${data.compoundName} ${data.doseMg} мг`,
      variant: 'success',
      action: {
        label: 'Отменить',
        onClick: async () => {
          const { deleteDoseEntry } = await import('@/lib/crud');
          await deleteDoseEntry(entry.id);
        },
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Добавить дозу</DialogTitle>
        </DialogHeader>
        <DoseForm
          key={open ? (initialDate ?? 'now') : 'closed'}
          defaultValues={open && initialDate ? { datetime: `${initialDate}T12:00` } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
