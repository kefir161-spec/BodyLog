'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const PIXELATE_ANIM_IDS = ['pixelate-anim-w', 'pixelate-anim-h', 'pixelate-anim-r'];

function startPixelateAnimation() {
  if (typeof document === 'undefined') return;
  PIXELATE_ANIM_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el && 'beginElement' in el) (el as unknown as SVGAnimateElement).beginElement();
  });
}

/**
 * Показывает изображение с SVG-пикселизацией и анимацией «от пикселей к чёткости».
 * Анимация запускается при каждой загрузке картинки (дыня, чашка, яблоко и т.д.).
 */
export function PixelateImage({
  src,
  alt,
  className,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}) {
  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden rounded-lg bg-muted/30 animate-in fade-in duration-500',
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ filter: 'url(#pixelate-hero)' }}
        loading="lazy"
        decoding="async"
        onError={onError}
        onLoad={() => startPixelateAnimation()}
      />
    </div>
  );
}
