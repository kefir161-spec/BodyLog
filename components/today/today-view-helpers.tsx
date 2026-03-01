import React from 'react';
import { format, parseISO, differenceInDays, addDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DoseEntry } from '@/lib/models';

export type TooltipPayloadItem = { payload?: { date: string; weightKg: number; movingAvg7?: number } };

export function WeightChartTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.payload;
  if (!raw) return null;
  const d = raw;
  return (
    <div className="rounded-md border bg-card p-2 shadow">
      <p className="text-xs text-muted-foreground">
        {format(parseISO(d.date), 'd MMM yyyy', { locale: ru })}
      </p>
      <p className="font-medium">{d.weightKg} кг</p>
      {d.movingAvg7 != null && (
        <p className="text-xs text-muted-foreground">
          Ср. 7 дн.: {d.movingAvg7} кг
        </p>
      )}
    </div>
  );
}

export function getNextInjectionHint(lastDose: DoseEntry, today: Date) {
  const lastDate = parseISO(lastDose.datetime);
  const nextDate = addDays(lastDate, 7);
  const daysUntil = differenceInDays(nextDate, today);
  if (daysUntil <= 0) return { text: 'Сегодня возможна следующая инъекция', days: 0 };
  if (daysUntil === 1) return { text: 'Следующая инъекция завтра', days: 1 };
  return { text: 'След. инъекция через ' + daysUntil + ' дн.', days: daysUntil };
}

export function TodayRoot({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

export function weeksLabel(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'неделя';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'недели';
  return 'недель';
}

/** Дней до следующего понедельника (0 = понедельник). Воскресенье = 1, суббота = 2, ... вторник = 6. */
export function daysUntilNextMonday(today: Date): number {
  const day = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  return (8 - day) % 7;
}

/** Классы для карточки инъекции: от зелёного (вт, 6 дн.) до красного (вс, 1 дн.). */
export function injectionCardColorClass(daysUntil: number): string {
  switch (daysUntil) {
    case 0:
      return 'border-primary/40 bg-primary/10';
    case 1:
      return 'border-red-500/60 bg-red-500/10';
    case 2:
      return 'border-orange-500/50 bg-orange-500/10';
    case 3:
      return 'border-amber-500/50 bg-amber-500/10';
    case 4:
      return 'border-yellow-500/40 bg-yellow-500/10';
    case 5:
      return 'border-lime-500/40 bg-lime-500/10';
    case 6:
      return 'border-green-500/40 bg-green-500/10';
    default:
      return 'border-dashed';
  }
}

/** Напоминание уже прошло — для зачёркивания текста. */
export function isNoteReminderPast(reminderAt: string | undefined, now: Date): boolean {
  if (!reminderAt) return false;
  const reminder = parseISO(reminderAt);
  return differenceInDays(startOfDay(now), startOfDay(reminder)) > 0;
}

/** Классы для карточки заметки по дате напоминания: чем ближе дата — тем краснее. Просроченные — нейтрально. */
export function noteReminderColorClass(reminderAt: string | undefined, now: Date): string {
  if (!reminderAt) return 'border-l-4 border-l-border bg-muted/30';
  const reminder = parseISO(reminderAt);
  const days = differenceInDays(startOfDay(reminder), startOfDay(now));
  if (days < 0) return 'border-l-4 border-l-border bg-muted/30';
  if (days === 0) return 'border-l-4 border-l-red-500 bg-red-500/10 dark:bg-red-950/30';
  if (days === 1) return 'border-l-4 border-l-orange-500 bg-orange-500/10 dark:bg-orange-950/30';
  if (days === 2) return 'border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-950/30';
  if (days <= 4) return 'border-l-4 border-l-yellow-500 bg-yellow-500/10 dark:bg-yellow-950/30';
  if (days <= 7) return 'border-l-4 border-l-lime-500 bg-lime-500/10 dark:bg-lime-950/30';
  return 'border-l-4 border-l-green-500 bg-green-500/10 dark:bg-green-950/30';
}
