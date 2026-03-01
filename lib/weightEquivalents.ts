/**
 * Справочник предметов с примерной массой для визуализации потери веса.
 * Расширяемый конфиг: добавляйте элементы в массив weightEquivalents.
 */

export type WeightEquivalentItem = {
  id: string;
  titleRu: string;
  weightKg: number;
  iconSvg: string;
};

/** Минимальный вес для отображения отдельным предметом (остаток показываем текстом). */
export const MIN_WEIGHT_DISPLAY_KG = 0.05;

/** Максимум плиток в визуализации; при большем числе — группировка или "+N кг". */
export const MAX_ITEMS = 10;

/** Допуск при подборе суммы к target (кг). */
export const TARGET_TOLERANCE_KG = 0.2;

/**
 * Справочник: от мелких предметов к крупным (для greedy подбора по убыванию веса).
 * Веса приблизительные, без брендов.
 */
export const weightEquivalents: WeightEquivalentItem[] = [
  { id: 'smartphone', titleRu: 'Смартфон', weightKg: 0.2, iconSvg: 'phone' },
  { id: 'apple', titleRu: 'Яблоко', weightKg: 0.2, iconSvg: 'apple' },
  { id: 'cup', titleRu: 'Чашка с чаем', weightKg: 0.3, iconSvg: 'cup' },
  { id: 'book', titleRu: 'Книга в твёрдом переплёте', weightKg: 0.5, iconSvg: 'book' },
  { id: 'sugar-1kg', titleRu: 'Пакет сахара 1 кг', weightKg: 1, iconSvg: 'package' },
  { id: 'laptop', titleRu: 'Ноутбук', weightKg: 1.3, iconSvg: 'laptop' },
  { id: 'water-1.5', titleRu: 'Бутылка воды 1,5 л', weightKg: 1.5, iconSvg: 'bottle' },
  { id: 'kettlebell-2', titleRu: 'Гиря 2 кг', weightKg: 2, iconSvg: 'dumbbell' },
  { id: 'brick', titleRu: 'Кирпич', weightKg: 2.5, iconSvg: 'brick' },
  { id: 'melon', titleRu: 'Небольшая дыня', weightKg: 3, iconSvg: 'circle' },
  { id: 'cat', titleRu: 'Кошка (средняя)', weightKg: 4, iconSvg: 'cat' },
  { id: 'water-5l', titleRu: 'Бутыль воды 5 л', weightKg: 5, iconSvg: 'bottle' },
  { id: 'kettlebell-6', titleRu: 'Гиря 6 кг', weightKg: 6, iconSvg: 'dumbbell' },
  { id: 'baby', titleRu: 'Грудной ребёнок (примерно)', weightKg: 7, iconSvg: 'baby' },
  { id: 'dog-small', titleRu: 'Маленькая собака', weightKg: 8, iconSvg: 'dog' },
  { id: 'kettlebell-8', titleRu: 'Гиря 8 кг', weightKg: 8, iconSvg: 'dumbbell' },
  { id: 'watermelon', titleRu: 'Арбуз (средний)', weightKg: 8, iconSvg: 'circle' },
  { id: 'tire', titleRu: 'Автомобильная покрышка', weightKg: 10, iconSvg: 'tire' },
  { id: 'kettlebell-12', titleRu: 'Гиря 12 кг', weightKg: 12, iconSvg: 'dumbbell' },
  { id: 'suitcase', titleRu: 'Чемодан (заполненный)', weightKg: 15, iconSvg: 'suitcase' },
  { id: 'kettlebell-16', titleRu: 'Гиря 16 кг', weightKg: 16, iconSvg: 'dumbbell' },
  { id: 'dog-medium', titleRu: 'Средняя собака', weightKg: 18, iconSvg: 'dog' },
  { id: 'kettlebell-20', titleRu: 'Гиря 20 кг', weightKg: 20, iconSvg: 'dumbbell' },
];

export type PickedItem = {
  id: string;
  titleRu: string;
  weightKg: number;
  iconSvg: string;
  count: number;
  totalKg: number;
};

export type PickEquivalentsResult = {
  items: PickedItem[];
  remainderKg: number;
  totalPickedKg: number;
  lostKg: number;
};

export type PickEquivalentsOptions = {
  maxItems?: number;
  /** Добавлять разнообразие: предпочитать разные предметы при близком весе */
  diversity?: boolean;
};

/**
 * Подбирает набор предметов, суммарный вес которых приближается к lostKg.
 * Greedy: сортировка по weightKg по убыванию, добор пока target > minWeight.
 * Ограничение по количеству элементов (maxItems), остаток — remainderKg.
 */
export function pickEquivalents(
  lostKg: number,
  options: PickEquivalentsOptions = {}
): PickEquivalentsResult {
  const maxItems = options.maxItems ?? MAX_ITEMS;
  const diversity = options.diversity ?? true;
  const target = Math.round(lostKg * 10) / 10;
  const result: PickedItem[] = [];
  let remaining = target;
  const minWeight = Math.min(...weightEquivalents.map((e) => e.weightKg));

  if (target < MIN_WEIGHT_DISPLAY_KG) {
    return {
      items: [],
      remainderKg: target,
      totalPickedKg: 0,
      lostKg: target,
    };
  }

  const sorted = [...weightEquivalents].sort((a, b) => b.weightKg - a.weightKg);
  let usedIds = new Set<string>();

  while (remaining >= minWeight) {
    const candidates = sorted.filter(
      (item) => item.weightKg <= remaining + TARGET_TOLERANCE_KG
    );
    if (candidates.length === 0) break;

    let chosen: WeightEquivalentItem;
    if (diversity && candidates.length > 1) {
      const preferred = candidates.find((c) => !usedIds.has(c.id));
      chosen = preferred ?? candidates[0];
    } else {
      chosen = candidates[0];
    }
    usedIds.add(chosen.id);

    const count = Math.max(1, Math.floor(remaining / chosen.weightKg));
    const totalKg = Math.round(chosen.weightKg * count * 10) / 10;
    const existing = result.find((r) => r.id === chosen.id);
    if (existing) {
      existing.count += count;
      existing.totalKg = Math.round((existing.totalKg + totalKg) * 10) / 10;
    } else {
      if (result.length >= maxItems) break;
      result.push({
        id: chosen.id,
        titleRu: chosen.titleRu,
        weightKg: chosen.weightKg,
        iconSvg: chosen.iconSvg,
        count,
        totalKg,
      });
    }
    remaining = Math.round((remaining - totalKg) * 10) / 10;
  }

  const totalPickedKg = result.reduce((sum, r) => sum + r.totalKg, 0);
  const remainderKg = Math.round((target - totalPickedKg) * 10) / 10;

  return {
    items: result,
    remainderKg: remainderKg < 0 ? 0 : remainderKg,
    totalPickedKg,
    lostKg: target,
  };
}
