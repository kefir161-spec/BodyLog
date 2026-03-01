'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { SearchResultItem } from '@/lib/food-providers/types';
import type { MealType, QtyUnit } from '@/lib/models';
import { openFoodFactsProvider } from '@/lib/food-providers/openfoodfacts';
import { calcNutritionFromProduct } from '@/lib/food-providers/calc';
import { addMealEntry, addMealItemEntry } from '@/lib/crud';
import { useToast } from '@/components/providers/toast-provider';

type DishItem = {
  product: SearchResultItem;
  qty: number;
  unit: QtyUnit;
  grams: number;
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
};

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'Завтрак', label: 'Завтрак' },
  { value: 'Обед', label: 'Обед' },
  { value: 'Ужин', label: 'Ужин' },
  { value: 'Перекус', label: 'Перекус' },
];

const UNITS: { value: QtyUnit; label: string }[] = [
  { value: 'g', label: 'г' },
  { value: 'ml', label: 'мл' },
  { value: 'pcs', label: 'шт' },
];

type MealDishFormProps = {
  date: string;
  onSaved?: () => void;
};

export function MealDishForm({ date, onSaved }: MealDishFormProps) {
  const { addToast } = useToast();
  const [mealType, setMealType] = useState<MealType>('Обед');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [items, setItems] = useState<DishItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SearchResultItem | null>(null);
  const [addQty, setAddQty] = useState(100);
  const [addUnit, setAddUnit] = useState<QtyUnit>('g');

  const search = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const list = await openFoodFactsProvider.search(q);
      setSearchResults(list);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const addItem = useCallback(() => {
    if (!selectedProduct) return;
    const calc = calcNutritionFromProduct(selectedProduct, addQty, addUnit);
    setItems((prev) => [
      ...prev,
      {
        product: selectedProduct,
        qty: addQty,
        unit: addUnit,
        grams: calc.grams,
        kcal: calc.kcal,
        proteinG: calc.proteinG,
        fatG: calc.fatG,
        carbsG: calc.carbsG,
      },
    ]);
    setSelectedProduct(null);
    setAddQty(100);
    setAddUnit('g');
  }, [selectedProduct, addQty, addUnit]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const total = items.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      proteinG: acc.proteinG + i.proteinG,
      fatG: acc.fatG + i.fatG,
      carbsG: acc.carbsG + i.carbsG,
    }),
    { kcal: 0, proteinG: 0, fatG: 0, carbsG: 0 }
  );

  const saveMeal = useCallback(async () => {
    if (items.length === 0) {
      addToast({ title: 'Добавьте хотя бы один продукт', variant: 'destructive' });
      return;
    }
    const datetime = new Date().toISOString();
    const meal = await addMealEntry({
      datetime,
      date,
      mealType,
    });
    for (const it of items) {
      await addMealItemEntry({
        mealId: meal.id,
        date,
        name: it.product.name,
        brand: it.product.brand,
        provider: it.product.provider,
        providerId: it.product.providerId,
        qty: it.qty,
        unit: it.unit,
        grams: it.grams,
        kcal: it.kcal,
        proteinG: it.proteinG,
        fatG: it.fatG,
        carbsG: it.carbsG,
      });
    }
    addToast({
      title: 'Приём пищи добавлен',
      description: `${mealType}: ${total.kcal} ккал · Б ${Math.round(total.proteinG)} / Ж ${Math.round(total.fatG)} / У ${Math.round(total.carbsG)}`,
      variant: 'success',
    });
    setItems([]);
    onSaved?.();
  }, [date, mealType, items, total, addToast, onSaved]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Найдите продукт по базе Open Food Facts, укажите количество — ккал и БЖУ посчитаются автоматически. Добавьте несколько позиций и сохраните приём.
      </p>
      <div className="grid gap-2">
        <Label>Тип приёма</Label>
        <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEAL_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Поиск продукта</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Например: гречка, молоко, яйца"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
          />
          <Button type="button" variant="secondary" onClick={search} disabled={searchLoading}>
            {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Найти'}
          </Button>
        </div>
      </div>
      {searchResults.length > 0 && (
        <div className="rounded-md border p-2 max-h-48 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">Выберите продукт:</p>
          <ul className="space-y-1">
            {searchResults.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted ${selectedProduct?.id === p.id ? 'bg-primary/10' : ''}`}
                  onClick={() => setSelectedProduct(p)}
                >
                  {p.name}
                  {p.brand ? ` · ${p.brand}` : ''}
                  {p.kcalPer100g != null && (
                    <span className="text-muted-foreground"> — {p.kcalPer100g} ккал/100 г</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedProduct && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3 bg-muted/30">
          <span className="text-sm font-medium truncate max-w-[200px]">{selectedProduct.name}</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0.1}
              step={1}
              className="w-20"
              value={addQty}
              onChange={(e) => setAddQty(Number(e.target.value) || 100)}
            />
            <Select value={addUnit} onValueChange={(v) => setAddUnit(v as QtyUnit)}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            В блюдо
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedProduct(null)}>
            Отмена
          </Button>
        </div>
      )}
      {items.length > 0 && (
        <>
          <div className="rounded-md border divide-y">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  {it.product.name} — {it.qty} {it.unit === 'g' ? 'г' : it.unit === 'ml' ? 'мл' : 'шт'} = {it.kcal} ккал
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeItem(idx)}
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-sm font-medium">
            Итого блюдо: <strong>{total.kcal} ккал</strong> · Б {Math.round(total.proteinG)} / Ж {Math.round(total.fatG)} / У {Math.round(total.carbsG)}
          </p>
          <Button onClick={saveMeal}>
            Сохранить приём «{mealType}»
          </Button>
        </>
      )}
    </div>
  );
}
