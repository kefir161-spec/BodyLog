'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { settingsSchema, exportDataSchema, type Settings } from '@/lib/models';
import { saveSettings } from '@/lib/crud';
import { useSettings } from '@/lib/hooks';
import { exportToJSON, exportWeightToCSV, importFromJSON } from '@/lib/export-import';
import { useToast } from '@/components/providers/toast-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { Moon, Sun, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

type FormValues = Settings;

export function SettingsView() {
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const stored = useSettings();
  const [importPreview, setImportPreview] = useState<{
    weight: number;
    dose: number;
    nutrition: number;
    activity: number;
    meal?: number;
    mealItem?: number;
    manualIntake?: number;
    foodCache?: number;
  } | null>(null);
  const [importFile, setImportFile] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      goalWeightKg: undefined,
      startWeightKg: undefined,
      heightCm: undefined,
      sex: undefined,
      birthYear: undefined,
      calorieTarget: undefined,
      proteinTarget: undefined,
      unitSystem: 'metric',
      stepLengthCm: undefined,
      walkingSpeedKmh: 4.8,
      walkingMET: 3.3,
      activityFactor: 1.2,
      cyclingMET: 6,
      customFoodApiBaseUrl: '',
      customFoodApiKey: '',
      usdaApiKey: '',
      exportSecretsEnabled: false,
    },
  });

  useEffect(() => {
    if (stored) {
      form.reset(stored);
    }
  }, [stored, form]);

  const onSave = useCallback(
    async (values: FormValues) => {
      const clean = (v: number | undefined) =>
        v != null && !Number.isNaN(v) ? v : undefined;
      await saveSettings({
        ...values,
        goalWeightKg: clean(values.goalWeightKg),
        startWeightKg: clean(values.startWeightKg),
        heightCm: clean(values.heightCm),
        birthYear: clean(values.birthYear),
        calorieTarget: clean(values.calorieTarget),
        proteinTarget: clean(values.proteinTarget),
        stepLengthCm: clean(values.stepLengthCm),
        walkingSpeedKmh: values.walkingSpeedKmh != null && !Number.isNaN(values.walkingSpeedKmh) ? values.walkingSpeedKmh : undefined,
        walkingMET: values.walkingMET != null && !Number.isNaN(values.walkingMET) ? values.walkingMET : undefined,
        activityFactor: values.activityFactor != null && !Number.isNaN(values.activityFactor) ? values.activityFactor : undefined,
        cyclingMET: values.cyclingMET != null && !Number.isNaN(values.cyclingMET) ? values.cyclingMET : undefined,
        customFoodApiBaseUrl: values.customFoodApiBaseUrl || undefined,
        customFoodApiKey: values.customFoodApiKey || undefined,
        usdaApiKey: values.usdaApiKey || undefined,
        exportSecretsEnabled: values.exportSecretsEnabled ?? false,
      });
      addToast({ title: 'Настройки сохранены', variant: 'success' });
    },
    [addToast]
  );

  const handleExportJSON = useCallback(async () => {
    const json = await exportToJSON(stored?.exportSecretsEnabled ?? false);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bodylog-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'Экспорт JSON выполнен', variant: 'success' });
  }, [addToast]);

  const handleExportCSV = useCallback(async () => {
    const csv = await exportWeightToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bodylog-weight-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ title: 'Экспорт CSV (вес) выполнен', variant: 'success' });
  }, [addToast]);

  const handleFile = useCallback(
    (text: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        addToast({ title: 'Неверный JSON', variant: 'destructive' });
        setImportPreview(null);
        setImportFile(null);
        return;
      }
      const result = exportDataSchema.safeParse(parsed);
      if (!result.success) {
        addToast({
          title: 'Ошибка валидации',
          description: result.error.errors.map((e) => e.message).join('; '),
          variant: 'destructive',
        });
        setImportPreview(null);
        setImportFile(null);
        return;
      }
      const d = result.data;
      setImportPreview({
        weight: d.weightEntries.length,
        dose: d.doseEntries.length,
        nutrition: d.nutritionEntries.length,
        activity: d.activityEntries.length,
        ...(d.version === 2 && 'mealEntries' in d && {
          meal: d.mealEntries.length,
          mealItem: d.mealItemEntries.length,
          manualIntake: d.manualIntakeEntries.length,
          foodCache: d.foodCacheItems.length,
        }),
      });
      setImportFile(text);
    },
    [addToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result);
        try {
          JSON.parse(text);
          handleFile(text);
        } catch {
          addToast({ title: 'Неверный JSON', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    },
    [handleFile, addToast]
  );

  const handleImportConfirm = useCallback(async () => {
    if (!importFile) return;
    const result = await importFromJSON(importFile);
    if (!result.success) {
      addToast({ title: 'Ошибка импорта', description: result.error, variant: 'destructive' });
      return;
    }
    addToast({
      title: 'Импорт выполнен',
      description: result.counts
        ? `Вес: ${result.counts.weight}, Дозы: ${result.counts.dose}, Питание: ${result.counts.nutrition}, Активность: ${result.counts.activity}`
        : undefined,
      variant: 'success',
    });
    setImportFile(null);
    setImportPreview(null);
  }, [importFile, addToast]);

  const handleImportCancel = useCallback(() => {
    setImportFile(null);
    setImportPreview(null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>
        <p className="text-muted-foreground">Профиль, цели и данные</p>
      </div>

      <ScrollReveal>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Тема</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              <Sun className="mr-2 h-4 w-4" />
              Светлая
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              <Moon className="mr-2 h-4 w-4" />
              Тёмная
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
            >
              Система
            </Button>
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <form onSubmit={form.handleSubmit(onSave)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Профиль и цели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="goalWeightKg">Целевой вес (кг)</Label>
                <Input
                  id="goalWeightKg"
                  type="number"
                  step="0.1"
                  placeholder="70"
                  {...form.register('goalWeightKg', { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startWeightKg">Стартовый вес (кг)</Label>
                <Input
                  id="startWeightKg"
                  type="number"
                  step="0.1"
                  placeholder="—"
                  {...form.register('startWeightKg', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="heightCm">Рост (см)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  placeholder="170"
                  {...form.register('heightCm', { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sex">Пол</Label>
                <Select
                  value={form.watch('sex') ?? ''}
                  onValueChange={(v) => form.setValue('sex', v === '' ? undefined : (v as 'male' | 'female'))}
                >
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Не указано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="female">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="birthYear">Год рождения</Label>
                <Input
                  id="birthYear"
                  type="number"
                  placeholder="1990"
                  {...form.register('birthYear', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="calorieTarget">Цель по калориям (ккал/день)</Label>
                <Input
                  id="calorieTarget"
                  type="number"
                  placeholder="2000"
                  {...form.register('calorieTarget', { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proteinTarget">Цель по белку (г/день)</Label>
                <Input
                  id="proteinTarget"
                  type="number"
                  placeholder="—"
                  {...form.register('proteinTarget', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stepLengthCm">Длина шага (см)</Label>
                <Input
                  id="stepLengthCm"
                  type="number"
                  step="0.1"
                  placeholder="Авто по росту"
                  {...form.register('stepLengthCm', { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="walkingSpeedKmh">Скорость ходьбы (км/ч)</Label>
                <Input
                  id="walkingSpeedKmh"
                  type="number"
                  step="0.1"
                  placeholder="4.8"
                  {...form.register('walkingSpeedKmh', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="walkingMET">MET ходьбы</Label>
                <Input
                  id="walkingMET"
                  type="number"
                  step="0.1"
                  placeholder="3.3"
                  {...form.register('walkingMET', { valueAsNumber: true })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="activityFactor">Коэф. повседневной активности (TDEE)</Label>
                <Input
                  id="activityFactor"
                  type="number"
                  step="0.05"
                  min={1}
                  max={2}
                  placeholder="1.2"
                  {...form.register('activityFactor', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cyclingMET">MET велотренировки</Label>
                <Input
                  id="cyclingMET"
                  type="number"
                  step="0.5"
                  placeholder="6"
                  {...form.register('cyclingMET', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customFoodApiBaseUrl">Base URL API еды</Label>
                <Input
                  id="customFoodApiBaseUrl"
                  type="url"
                  placeholder="https://..."
                  {...form.register('customFoodApiBaseUrl')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customFoodApiKey">Ключ API еды</Label>
                <Input
                  id="customFoodApiKey"
                  type="password"
                  placeholder="Не сохранять в экспорт по умолчанию"
                  {...form.register('customFoodApiKey')}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="usdaApiKey">Ключ USDA API (опционально)</Label>
              <Input
                id="usdaApiKey"
                type="password"
                placeholder="—"
                {...form.register('usdaApiKey')}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exportSecretsEnabled"
                {...form.register('exportSecretsEnabled')}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="exportSecretsEnabled" className="font-normal">
                Включать ключи API в экспорт (не рекомендуется)
              </Label>
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Сохранить настройки
            </Button>
          </CardContent>
        </Card>
      </form>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Экспорт</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            Экспорт JSON (всё)
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            Экспорт CSV (вес)
          </Button>
        </CardContent>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Импорт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            <p className="text-sm text-muted-foreground">
              Перетащите JSON сюда или выберите файл
            </p>
            <input
              type="file"
              accept=".json,application/json"
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border file:border-input file:bg-background file:px-4 file:py-2 file:text-sm file:font-medium"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    handleFile(String(reader.result));
                  } catch {
                    addToast({ title: 'Неверный JSON', variant: 'destructive' });
                  }
                };
                reader.readAsText(file);
              }}
            />
          </div>
          {importPreview != null && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-2 text-sm font-medium">Будет добавлено записей:</p>
              <p className="text-sm text-muted-foreground">
                Вес: {importPreview.weight}, Дозы: {importPreview.dose}, Питание (старый формат):{' '}
                {importPreview.nutrition}, Активность: {importPreview.activity}
                {[importPreview.meal, importPreview.mealItem, importPreview.manualIntake, importPreview.foodCache].some((n) => n != null && n > 0) && (
                  <> · Приёмы: {importPreview.meal ?? 0}, Позиции: {importPreview.mealItem ?? 0}, Ручной ввод: {importPreview.manualIntake ?? 0}, Кеш продуктов: {importPreview.foodCache ?? 0}</>
                )}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleImportConfirm}>
                  Импортировать
                </Button>
                <Button size="sm" variant="outline" onClick={handleImportCancel}>
                  Отмена
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </ScrollReveal>
    </div>
  );
}
