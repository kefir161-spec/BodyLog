import type { FoodCacheItem } from '../models';

export type SearchResultItem = Pick<
  FoodCacheItem,
  'id' | 'name' | 'brand' | 'provider' | 'providerId' | 'unitBasis' | 'kcalPer100g' | 'proteinPer100g' | 'fatPer100g' | 'carbsPer100g' | 'servingSizeG' | 'pieceSizeG' | 'barcode'
> & { raw?: unknown };

export interface FoodProvider {
  name: string;
  search(query: string): Promise<SearchResultItem[]>;
  getByBarcode?(barcode: string): Promise<SearchResultItem | null>;
}

/** kJ -> kcal */
export function kjToKcal(kj: number): number {
  return kj * 0.239006;
}
