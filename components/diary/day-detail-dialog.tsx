'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Scale, Utensils, Syringe, Activity, Pencil, Trash2 } from 'lucide-react';
import { useWeightEntries, useDoseEntries, useActivityEntries, useManualIntakeEntries, useMealItemEntries, useNutritionEntries, useSettings } from '@/lib/hooks';
import { intakeKcalDayFull, burnKcalDay, weightForDate, formatSignedKcal } from '@/lib/stats';
import { addManualIntakeEntry, deleteManualIntakeEntry, deleteWeightEntry } from '@/lib/crud';
import { useToast } from '@/components/providers/toast-provider';
import { QuickAddWeight } from '@/components/quick-add/quick-add-weight';
import { QuickAddActivity } from '@/components/quick-add/quick-add-activity';
import { QuickAddDose } from '@/components/quick-add/quick-add-dose';
import { QuickAddManualIntake } from '@/components/today/quick-add-manual-intake';
import { EditWeightDialog } from '@/components/today/edit-weight-dialog';
import { EditManualIntakeDialog } from '@/components/today/edit-manual-intake-dialog';
import { EditActivityDialog } from '@/components/today/edit-activity-dialog';
import { EditDoseDialog } from '@/components/today/edit-dose-dialog';
import {
  Dialog as ManualDialog,
  DialogContent as ManualDialogContent,
  DialogHeader as ManualDialogHeader,
  DialogTitle as ManualDialogTitle,
} from '@/components/ui/dialog';

type DayDetailDialogProps = {
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DayDetailDialog({ date, open, onOpenChange }: DayDetailDialogProps) {
  const { addToast } = useToast();
  const [weightOpen, setWeightOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [doseOpen, setDoseOpen] = useState(false);
  const [editWeightId, setEditWeightId] = useState<string | null>(null);
  const [editManualId, setEditManualId] = useState<string | null>(null);
  const [editActivityId, setEditActivityId] = useState<string | null>(null);
  const [editDoseId, setEditDoseId] = useState<string | null>(null);

  const weights = useWeightEntries();
  const doses = useDoseEntries();
  const activities = useActivityEntries();
  const manualIntakes = useManualIntakeEntries();
  const mealItems = useMealItemEntries();
  const nutrition = useNutritionEntries();
  const settings = useSettings();

  const weightEntry = weights.find((w) => w.date === date);
  const dayManual = manualIntakes.filter((m) => m.date === date);
  const dayMealItems = mealItems.filter((m) => m.date === date);
  const dayLegacyNut = nutrition.filter((n) => n.date === date);
  const actEntry = activities.find((a) => a.date === date);
  const doseOnDay = doses.find((d) => d.datetime.startsWith(date));
  const weightKg = weightForDate(weights, date);
  const intake = intakeKcalDayFull(dayMealItems, dayManual, dayLegacyNut);
  const burn = burnKcalDay(
    settings ?? undefined,
    weightKg,
    actEntry?.stepsKcal ?? 0,
    actEntry?.cyclingMinutes,
    actEntry?.manualKcal
  );
  const balance = intake.kcal - burn;
  const hasIntake = intake.kcal > 0;
  const hasActivity =
    actEntry != null &&
    (actEntry.steps != null ||
      actEntry.cyclingMinutes != null ||
      (actEntry.manualKcal != null && actEntry.manualKcal > 0) ||
      (actEntry.workout != null && actEntry.workout !== ''));
  const showBalance = hasIntake && hasActivity;

  async function handleAddManual(data: Parameters<typeof addManualIntakeEntry>[0]) {
    await addManualIntakeEntry(data);
    addToast({ title: 'Калории добавлены', variant: 'success' });
    setManualOpen(false);
  }

  async function handleDeleteManual(id: string) {
    await deleteManualIntakeEntry(id);
    addToast({ title: 'Запись удалена', variant: 'default' });
  }

  async function handleDeleteWeight(id: string) {
    await deleteWeightEntry(id);
    addToast({ title: 'Запись о весе удалена', variant: 'default' });
  }

  if (!date) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showClose className="max-w-md">
          <DialogHeader>
            <DialogTitle>{format(parseISO(date), 'd MMMM yyyy', { locale: ru })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <span className="text-muted-foreground">Вес</span>
                <p className="font-medium">{weightEntry != null ? `${weightEntry.weightKg} кг` : '—'}</p>
              </div>
              <div className="flex gap-1">
                {weightEntry != null ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditWeightId(weightEntry.id)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Изменить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteWeight(weightEntry.id)}
                      title="Удалить запись о весе"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Удалить
                    </Button>
                  </>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setWeightOpen(true)}>
                  <Scale className="mr-1 h-4 w-4" />
                  {weightEntry != null ? 'Ещё' : 'Добавить'}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-muted-foreground">Питание</span>
                  <p className="font-medium">
                    {intake.kcal > 0
                      ? `${intake.kcal} ккал · Б ${intake.proteinG} / Ж ${intake.fatG} / У ${intake.carbsG}`
                      : '—'}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {dayManual.length > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditManualId(dayManual[0].id)}
                        title="Изменить запись"
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Изменить
                      </Button>
                      {dayManual.length === 1 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteManual(dayManual[0].id)}
                          title="Удалить запись"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Удалить
                        </Button>
                      ) : null}
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setManualOpen(true)}>
                    <Utensils className="mr-1 h-4 w-4" />
                    Добавить
                  </Button>
                </div>
              </div>
              {dayManual.length > 1 && (
                <ul className="space-y-1 text-xs">
                  {dayManual.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 rounded bg-muted/50 px-2 py-1.5">
                      <span>
                        <strong>{m.calories} ккал</strong>
                        {(m.proteinG != null || m.fatG != null || m.carbsG != null) && (
                          <span className="text-muted-foreground ml-1">
                            Б {Math.round(m.proteinG ?? 0)} / Ж {Math.round(m.fatG ?? 0)} / У {Math.round(m.carbsG ?? 0)}
                          </span>
                        )}
                        {m.note && <span className="text-muted-foreground"> · {m.note}</span>}
                      </span>
                      <span className="flex gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditManualId(m.id)}
                          title="Изменить"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteManual(m.id)}
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <span className="text-muted-foreground">Расход · Баланс</span>
                <p className="font-medium">
                  {burn} ккал
                  {showBalance ? ` · ${formatSignedKcal(balance)}` : ' · —'}
                </p>
                {actEntry && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[
                      actEntry.steps != null && actEntry.steps > 0 ? `${actEntry.steps} шагов` : null,
                      actEntry.cyclingMinutes != null && actEntry.cyclingMinutes > 0 ? `${actEntry.cyclingMinutes} мин вело` : null,
                      actEntry.manualKcal != null && actEntry.manualKcal > 0 ? `${actEntry.manualKcal} ккал` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                {actEntry != null ? (
                  <Button size="sm" variant="outline" onClick={() => setEditActivityId(actEntry.id)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Изменить
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setActivityOpen(true)}>
                  <Activity className="mr-1 h-4 w-4" />
                  {actEntry != null ? 'Ещё' : 'Добавить'}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <span className="text-muted-foreground">Доза</span>
                <p className="font-medium">
                  {doseOnDay != null
                    ? `${doseOnDay.compoundName} ${doseOnDay.doseMg} мг`
                    : '—'}
                </p>
              </div>
              <div className="flex gap-1">
                {doseOnDay != null ? (
                  <Button size="sm" variant="outline" onClick={() => setEditDoseId(doseOnDay.id)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Изменить
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setDoseOpen(true)}>
                  <Syringe className="mr-1 h-4 w-4" />
                  {doseOnDay != null ? 'Ещё' : 'Добавить'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuickAddWeight open={weightOpen} onOpenChange={setWeightOpen} initialDate={date} />
      <QuickAddActivity open={activityOpen} onOpenChange={setActivityOpen} initialDate={date} />
      <QuickAddDose open={doseOpen} onOpenChange={setDoseOpen} initialDate={date} />

      <ManualDialog open={manualOpen} onOpenChange={setManualOpen}>
        <ManualDialogContent showClose>
          <ManualDialogHeader>
            <ManualDialogTitle>Добавить калории за {format(parseISO(date), 'd MMM', { locale: ru })}</ManualDialogTitle>
          </ManualDialogHeader>
          <QuickAddManualIntake date={date} onSubmit={handleAddManual} />
        </ManualDialogContent>
      </ManualDialog>

      <EditWeightDialog
        entryId={editWeightId}
        onClose={() => setEditWeightId(null)}
        onSaved={() => {
          setEditWeightId(null);
          addToast({ title: 'Вес обновлён', variant: 'success' });
        }}
      />
      <EditManualIntakeDialog
        entryId={editManualId}
        onClose={() => setEditManualId(null)}
        onSaved={() => {
          setEditManualId(null);
          addToast({ title: 'Запись обновлена', variant: 'success' });
        }}
      />
      <EditActivityDialog
        entryId={editActivityId}
        onClose={() => setEditActivityId(null)}
        onSaved={() => {
          setEditActivityId(null);
          addToast({ title: 'Активность обновлена', variant: 'success' });
        }}
      />
      <EditDoseDialog
        entryId={editDoseId}
        onClose={() => setEditDoseId(null)}
        onSaved={() => {
          setEditDoseId(null);
          addToast({ title: 'Доза обновлена', variant: 'success' });
        }}
      />
    </>
  );
}
