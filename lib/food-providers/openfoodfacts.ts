import type { FoodProvider, SearchResultItem } from './types';
import { kjToKcal } from './types';
import type { FoodCacheItem } from '../models';

const BASE = 'https://world.openfoodfacts.org';

function mapProduct(product: Record<string, unknown>): SearchResultItem | null {
  const nutriments = (product.nutriments as Record<string, unknown>) ?? {};
  const energyKcal = nutriments['energy-kcal_100g'] as number | undefined;
  const energyKj = nutriments['energy_100g'] as number | undefined;
  const kcal = energyKcal ?? (energyKj != null ? kjToKcal(energyKj) : undefined);
  if (kcal == null) return null;
  const id = `openfoodfacts:${product.code ?? product._id ?? ''}`;
  const name = (product.product_name ?? product.product_name_ru ?? product.product_name_en ?? '') as string;
  const serving = (product.serving_size ?? '') as string;
  let servingSizeG: number | undefined;
  const match = serving.match(/(\d+)\s*g/i);
  if (match) servingSizeG = parseInt(match[1], 10);
  return {
    id,
    name: name || 'Без названия',
    brand: (product.brands ?? product.brand_owner) as string | undefined,
    provider: 'openfoodfacts',
    providerId: String(product.code ?? product._id ?? ''),
    unitBasis: servingSizeG ? 'perServing' : 'per100g',
    kcalPer100g: kcal,
    proteinPer100g: (nutriments['proteins_100g'] as number) ?? undefined,
    fatPer100g: (nutriments['fat_100g'] as number) ?? undefined,
    carbsPer100g: (nutriments['carbohydrates_100g'] as number) ?? undefined,
    servingSizeG,
    barcode: (product.code ?? product._id) as string | undefined,
    raw: product,
  };
}

export const openFoodFactsProvider: FoodProvider = {
  name: 'Open Food Facts',
  async search(query: string): Promise<SearchResultItem[]> {
    try {
      const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as { products?: Record<string, unknown>[] };
      const products = data.products ?? [];
      const out: SearchResultItem[] = [];
      for (const p of products) {
        if (!p.code && !p._id) continue;
        const item = mapProduct(p);
        if (item) out.push(item);
      }
      return out;
    } catch {
      return [];
    }
  },
  async getByBarcode(barcode: string): Promise<SearchResultItem | null> {
    try {
      const url = `${BASE}/api/v0/product/${barcode}.json`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as { product?: Record<string, unknown> };
      const product = data.product;
      if (!product) return null;
      return mapProduct(product);
    } catch {
      return null;
    }
  },
};

export function toFoodCacheItem(item: SearchResultItem): FoodCacheItem {
  return {
    id: item.id,
    provider: item.provider,
    providerId: item.providerId,
    name: item.name,
    brand: item.brand,
    barcode: item.barcode,
    unitBasis: item.unitBasis,
    kcalPer100g: item.kcalPer100g ?? null,
    proteinPer100g: item.proteinPer100g ?? null,
    fatPer100g: item.fatPer100g ?? null,
    carbsPer100g: item.carbsPer100g ?? null,
    servingSizeG: item.servingSizeG ?? null,
    pieceSizeG: item.pieceSizeG ?? null,
    defaultMeasureLabel: null,
    favorite: false,
    updatedAt: new Date().toISOString(),
    rawSource: item.raw ? (item.raw as Record<string, unknown>) : undefined,
  };
}
