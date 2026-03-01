'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NutritionForm } from '@/components/forms/nutrition-form';
import { addNutritionEntry } from '@/lib/crud';
import { useToast } from '@/components/providers/toast-provider';

type QuickAddNutritionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickAddNutrition({ open, onOpenChange }: QuickAddNutritionProps) {
  const { addToast } = useToast();

  async function handleSubmit(data: Parameters<typeof addNutritionEntry>[0]) {
    const entry = await addNutritionEntry(data);
    addToast({
      title: 'Питание добавлено',
      description: `${data.calories} ккал`,
      variant: 'success',
      action: {
        label: 'Отменить',
        onClick: async () => {
          const { deleteNutritionEntry } = await import('@/lib/crud');
          await deleteNutritionEntry(entry.id);
        },
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose>
        <DialogHeader>
          <DialogTitle>Добавить питание</DialogTitle>
        </DialogHeader>
        <NutritionForm onSubmit={handleSubmit} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
