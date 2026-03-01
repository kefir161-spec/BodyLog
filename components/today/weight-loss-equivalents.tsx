'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { pickEquivalents, type PickedItem } from '@/lib/weightEquivalents';
import { cn } from '@/lib/utils';
import { PixelateImage } from './pixelate-image';

/** Три PNG-картинки для эквивалентов (public/images/equivalents/). */
const HERO_IMAGE_BY_ID: Record<string, string> = {
  melon: '/images/equivalents/melon.png',
  watermelon: '/images/equivalents/watermelon.png',
  cup: '/images/equivalents/cup.png',
};

/** Простые inline SVG иконки по ключу (без CDN). */
const ICONS: Record<string, React.ReactNode> = {
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2C10 2 8 4 8 7c0 2 1 4 2 5 1 1 2 1 2 1s1 0 2-1c1-1 2-3 2-5 0-3-2-5-4-5zm0 2c1 0 2 1.5 2 3 0 1-.5 2-2 3-1.5-1-2-2-2-3 0-1.5 1-3 2-3z" />
    </svg>
  ),
  cup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M6 8h10v10H6z" />
      <path d="M16 10h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M6 18v-8" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6l-2-2H6a2 2 0 0 0-2 2z" />
      <line x1="12" y1="8" x2="12" y2="18" />
    </svg>
  ),
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
      <path d="M12 22V12" />
      <path d="M3 7l9 5 9-5" />
    </svg>
  ),
  laptop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="2" y="4" width="20" height="14" rx="1" />
      <path d="M2 18h20" />
      <path d="M6 18v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
    </svg>
  ),
  bottle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M9 2v4h6V2H9z" />
      <path d="M8 6h8v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V6z" />
    </svg>
  ),
  dumbbell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M6 5h2v14H6zM16 5h2v14h-2z" />
      <path d="M6 5h4v4H6zM14 5h4v4h-4zM6 15h4v4H6zM14 15h4v4h-4z" />
      <path d="M10 9h4v6h-4z" />
    </svg>
  ),
  brick: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="2" y="6" width="20" height="10" rx="0.5" />
      <line x1="12" y1="6" x2="12" y2="16" />
      <line x1="7" y1="11" x2="17" y2="11" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  cat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M12 4c-2 0-3 2-3 4 0 1.5.5 3 1 4 .5 1 1 2 1 2h4s.5-1 1-2c.5-1 1-2.5 1-4 0-2-1-4-3-4z" />
      <path d="M8 10h2M14 10h2" />
      <path d="M9 14h6" />
      <path d="M12 2v1M10 4l-1 1M14 4l1 1" />
    </svg>
  ),
  dog: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M12 6c1.5 0 2 1 2 2s-.5 2-2 2-2-1-2-2 .5-2 2-2z" />
      <path d="M8 10c-2 0-3 2-3 4v4h14v-4c0-2-1-4-3-4" />
      <path d="M9 14h2M13 14h2" />
    </svg>
  ),
  baby: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <circle cx="12" cy="8" r="3" />
      <path d="M12 11v8M9 14h6" />
      <path d="M8 19c0-2 2-3 4-3s4 1 4 3" />
    </svg>
  ),
  tire: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  ),
  suitcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="4" y="6" width="16" height="14" rx="1" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M12 10v8M9 14h6" />
    </svg>
  ),
};

function EquivalentTile({
  item,
  index,
  reduceMotion,
}: {
  item: PickedItem;
  index: number;
  reduceMotion: boolean;
}) {
  const icon = ICONS[item.iconSvg] ?? ICONS.circle;
  const label =
    item.count > 1 ? `×${item.count} (≈ ${item.totalKg} кг)` : `≈ ${item.totalKg} кг`;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border bg-muted/40 p-1.5 min-w-[58px]',
        !reduceMotion && 'animate-in fade-in slide-in-from-bottom-2 duration-300'
      )}
      style={reduceMotion ? undefined : { animationDelay: `${index * 40}ms`, animationFillMode: 'backwards' }}
    >
      <div className="text-muted-foreground [&>svg]:mx-auto [&>svg]:w-5 [&>svg]:h-5 mb-0.5" aria-hidden>
        {icon}
      </div>
      <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">
        {item.titleRu}
      </span>
      <span className="text-[8px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

function daysLabel(days: number): string {
  const n = days % 100;
  const last = days % 10;
  if (last === 1 && n !== 11) return 'день';
  if (last >= 2 && last <= 4 && (n < 10 || n >= 20)) return 'дня';
  return 'дней';
}

export type WeightLossEquivalentsProps = {
  startWeightKg: number | null | undefined;
  currentWeightKg: number | null | undefined;
  /** Количество дней с первой до последней записи веса (для фразы «за X дней») */
  daysCount?: number | null;
  className?: string;
};

export function WeightLossEquivalents({
  startWeightKg,
  currentWeightKg,
  daysCount,
  className,
}: WeightLossEquivalentsProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { items, remainderKg, totalPickedKg, lostKg } = useMemo(() => {
    const start = startWeightKg != null && startWeightKg > 0 ? startWeightKg : null;
    const current = currentWeightKg != null ? currentWeightKg : null;
    if (start == null || current == null || current >= start) {
      return {
        items: [] as PickedItem[],
        remainderKg: 0,
        totalPickedKg: 0,
        lostKg: 0,
      };
    }
    const lost = Math.round((start - current) * 10) / 10;
    return pickEquivalents(lost, { maxItems: 10, diversity: true });
  }, [startWeightKg, currentWeightKg]);

  const firstItemId = items[0]?.id;
  useEffect(() => {
    setHeroImageError(false);
  }, [firstItemId]);

  if (lostKg <= 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-3 text-center text-xs text-muted-foreground',
          className
        )}
      >
        <div className="pixel-art-scale mb-2" aria-hidden />
        <p>Потеря веса пока не отображается.</p>
        <p className="text-[10px] mt-0.5">Укажите стартовый вес в Настройках и введите текущий вес меньше стартового.</p>
      </div>
    );
  }

  const firstItem = items[0];
  const restItems = items.slice(1);

  return (
    <div className={cn('flex flex-col h-full min-h-0 text-[0.8em]', className)}>
      <p className="text-xs font-semibold text-foreground mb-2">
        Потеряно: {lostKg} кг
        {daysCount != null && daysCount >= 0 && ` за ${daysCount} ${daysLabel(daysCount)}`}
      </p>
      {/* Один главный эквивалент: большая картинка + название и вес — сразу понятно, что есть что */}
      {firstItem && (
        <div className="flex items-center gap-3 p-2 rounded-xl border bg-muted/30 mb-2 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground text-[1.125em]">{firstItem.titleRu}</p>
            <p className="text-xs text-muted-foreground">
              {firstItem.count > 1 ? `×${firstItem.count} ≈ ${firstItem.totalKg} кг` : `≈ ${firstItem.totalKg} кг`}
            </p>
          </div>
          <div
            className="flex-shrink-0 w-[58px] h-[58px] flex items-center justify-center overflow-hidden rounded-lg bg-muted/30"
            aria-hidden
          >
            {firstItem.id && HERO_IMAGE_BY_ID[firstItem.id] && !heroImageError ? (
              <PixelateImage
                src={HERO_IMAGE_BY_ID[firstItem.id]}
                alt={firstItem.titleRu}
                className="w-full h-full"
                onError={() => setHeroImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground [&>svg]:w-8 [&>svg]:h-8">
                {ICONS[firstItem.iconSvg] ?? ICONS.circle}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Остальные эквиваленты — компактная сетка */}
      {restItems.length > 0 && (
        <>
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Также примерно:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 overflow-y-auto flex-1 min-h-0 content-start">
            {restItems.map((item, index) => (
              <EquivalentTile
                key={`${item.id}-${item.count}-${index}`}
                item={item}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </>
      )}
      <p className="text-[10px] text-muted-foreground mt-1.5 flex-shrink-0">
        {remainderKg > 0.05 && `Ещё ≈ ${remainderKg} кг · `}
        Эквиваленты приблизительные.
      </p>
    </div>
  );
}
