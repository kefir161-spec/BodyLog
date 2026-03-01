'use client';

import * as React from 'react';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAY_LABELS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export type DateTimePickerProps = {
  value: string; // yyyy-MM-dd'T'HH:mm
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
};

function toLocalISOString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function DateTimePicker({ value, onChange, id, className, placeholder }: DateTimePickerProps) {
  const now = new Date();
  const parsed = value ? (() => { try { return parseISO(value); } catch { return null; } })() : null;
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(parsed ?? now));
  const [hour, setHour] = React.useState(() => (parsed ?? now).getHours());
  const [minute, setMinute] = React.useState(() => (parsed ?? now).getMinutes());
  const selectedDate = parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) : null;

  React.useEffect(() => {
    if (value) {
      try {
        const p = parseISO(value);
        setHour(p.getHours());
        setMinute(p.getMinutes());
      } catch { /* ignore */ }
    }
  }, [value]);

  const handleDayClick = (d: Date) => {
    const next = new Date(d);
    next.setHours(hour, minute, 0, 0);
    onChange(toLocalISOString(next));
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0));
    setHour(v);
    const base = parsed ?? now;
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), v, minute, 0, 0);
    onChange(toLocalISOString(d));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0));
    setMinute(v);
    const base = parsed ?? now;
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, v, 0, 0);
    onChange(toLocalISOString(d));
  };

  const handleClear = () => {
    onChange('');
    setViewMonth(startOfMonth(now));
    setHour(now.getHours());
    setMinute(now.getMinutes());
  };

  const handleToday = () => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    onChange(toLocalISOString(d));
    setViewMonth(startOfMonth(now));
  };

  const calendarStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const displayLabel = value
    ? format(parseISO(value), 'd MMMM yyyy, HH:mm', { locale: ru })
    : placeholder ?? 'Выберите дату и время';

  return (
    <div id={id} className={cn('rounded-md border bg-background', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-3 text-left text-sm text-muted-foreground hover:bg-muted/50 rounded-t-md transition-colors"
      >
        {displayLabel}
      </button>
      {open && (
      <div className="flex flex-col sm:flex-row border-t">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize">
              {format(viewMonth, 'LLLL yyyy', { locale: ru })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Следующий месяц"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-muted-foreground mb-1">
            {WEEKDAY_LABELS_RU.map((label) => (
              <div key={label} className="h-8 flex items-center justify-center font-medium">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const selected = selectedDate != null && isSameDay(day, selectedDate);
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'h-8 w-8 rounded-md text-sm transition-colors',
                    !inMonth && 'text-muted-foreground/50',
                    selected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    !selected && inMonth && 'hover:bg-accent',
                    today && !selected && 'ring-1 ring-primary/50'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              Очистить
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleToday}>
              Сегодня
            </Button>
          </div>
        </div>
        <div className="p-3 border-t sm:border-t-0 sm:border-l flex flex-col justify-center gap-2 min-w-[120px]">
          <span className="text-xs font-medium text-muted-foreground">Время (24 ч)</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={handleHourChange}
              className="w-14 text-center"
              aria-label="Часы"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={handleMinuteChange}
              className="w-14 text-center"
              aria-label="Минуты"
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
