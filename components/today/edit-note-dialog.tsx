'use client';

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
import { noteEntrySchema } from '@/lib/models';
import { updateNoteEntry } from '@/lib/crud';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { format, parseISO } from 'date-fns';

const formSchema = noteEntrySchema.omit({ id: true, createdAt: true }).extend({
  reminderAt: z.string().optional(),
  completed: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

type EditNoteDialogProps = {
  entryId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditNoteDialog({
  entryId,
  onClose,
  onSaved,
}: EditNoteDialogProps) {
  const entry = useLiveQuery(
    async () => (entryId ? db.noteEntries.get(entryId) : undefined),
    [entryId]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: entry
      ? {
          text: entry.text,
          reminderAt: entry.reminderAt
            ? format(parseISO(entry.reminderAt), "yyyy-MM-dd'T'HH:mm")
            : '',
          completed: !!entry.completedAt,
        }
      : undefined,
  });

  async function handleSubmit(values: FormValues) {
    if (!entryId) return;
    await updateNoteEntry(entryId, {
      text: values.text.trim(),
      reminderAt: values.reminderAt?.trim()
        ? new Date(values.reminderAt).toISOString()
        : undefined,
      completedAt: values.completed ? new Date().toISOString() : undefined,
    });
    onSaved();
    onClose();
  }

  if (!entryId) return null;

  return (
    <Dialog open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать заметку</DialogTitle>
        </DialogHeader>
        {!entry && <p className="text-sm text-muted-foreground">Загрузка...</p>}
        {entry && (
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="edit-note-text">Текст заметки *</Label>
              <Input
                id="edit-note-text"
                {...form.register('text')}
                placeholder="Текст заметки..."
              />
              {form.formState.errors.text && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.text.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Напоминание (опционально)</Label>
              <DateTimePicker
                value={form.watch('reminderAt') ?? ''}
                onChange={(v) => form.setValue('reminderAt', v)}
                placeholder="Без напоминания"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-note-completed"
                className="h-4 w-4 rounded border-input"
                {...form.register('completed')}
              />
              <Label htmlFor="edit-note-completed" className="font-normal cursor-pointer">
                Выполнено
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
