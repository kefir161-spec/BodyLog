/**
 * Расчёт ккал и БЖУ для продукта по количеству (г / мл / шт).
 * Используется для автоматического подсчёта калоража и БЖУ блюда из позиций.
 */

import type { QtyUnit } from '../models';

export type ProductNutritionPer100 = {
  kcalPer100g?: number | null;
  proteinPer100g?: number | null;
  fatPer100g?: number | null;
  carbsPer100g?: number | null;
  servingSizeG?: number | null;
  pieceSizeG?: number | null;
};

export type CalculatedNutrition = {
  grams: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

/**
 * Переводит количество (qty + unit) в граммы.
 * Для pcs использует pieceSizeG или servingSizeG или 100 г как fallback.
 */
export function qtyToGrams(
  qty: number,
  unit: QtyUnit,
  product: ProductNutritionPer100
): number {
  if (unit === 'g') return qty;
  if (unit === 'ml') return qty; // условно 1 мл = 1 г
  // pcs
  const perPiece = product.pieceSizeG ?? product.servingSizeG ?? 100;
  return qty * perPiece;
}

/**
 * Считает ккал и БЖУ по продукту (данные на 100 г) и граммам.
 */
export function calcNutritionFromGrams(
  product: ProductNutritionPer100,
  grams: number
): Omit<CalculatedNutrition, 'grams'> {
  const k = grams / 100;
  return {
    kcal: Math.round((product.kcalPer100g ?? 0) * k),
    proteinG: Math.round((product.proteinPer100g ?? 0) * k),
    fatG: Math.round((product.fatPer100g ?? 0) * k),
    carbsG: Math.round((product.carbsPer100g ?? 0) * k),
  };
}

/**
 * Полный расчёт: по продукту, количеству и единице возвращает граммы и ккал/БЖУ.
 */
export function calcNutritionFromProduct(
  product: ProductNutritionPer100,
  qty: number,
  unit: QtyUnit
): CalculatedNutrition {
  const grams = qtyToGrams(qty, unit, product);
  const rest = calcNutritionFromGrams(product, grams);
  return { grams, ...rest };
}
