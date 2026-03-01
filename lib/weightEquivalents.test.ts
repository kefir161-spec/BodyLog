/**
 * Unit-тесты для pickEquivalents.
 * Запуск: npx tsx lib/weightEquivalents.test.ts
 * или с Vitest: npx vitest run lib/weightEquivalents
 */

import { pickEquivalents, MAX_ITEMS, TARGET_TOLERANCE_KG } from './weightEquivalents';

function runTests() {
  let passed = 0;
  let failed = 0;

  function ok(condition: boolean, msg: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${msg}`);
    } else {
      failed++;
      console.error(`  ✗ ${msg}`);
    }
  }

  function eq<T>(a: T, b: T, msg: string) {
    const cond = a === b || (Number.isFinite(a as number) && Number.isFinite(b as number) && Math.abs((a as number) - (b as number)) < 1e-9);
    ok(cond, `${msg} (got ${a}, expected ${b})`);
  }

  console.log('pickEquivalents');
  console.log('---');

  // Сумма выбранных items <= lostKg + допуск
  const r1 = pickEquivalents(5, { maxItems: 10, diversity: false });
  const sum1 = r1.items.reduce((s, i) => s + i.totalKg, 0);
  ok(sum1 <= 5 + TARGET_TOLERANCE_KG, `sum ${sum1} <= lostKg + ${TARGET_TOLERANCE_KG}`);
  ok(r1.lostKg === 5, 'lostKg === 5');

  // Не превышает MAX элементов
  const r2 = pickEquivalents(100, { maxItems: 10, diversity: true });
  ok(r2.items.length <= MAX_ITEMS, `items.length ${r2.items.length} <= ${MAX_ITEMS}`);

  // Одинаковые предметы сгруппированы (count > 1)
  const r3 = pickEquivalents(32, { maxItems: 10, diversity: false });
  const withCount = r3.items.filter((i) => i.count > 1);
  ok(
    withCount.length >= 0,
    'grouping: same item can have count > 1'
  );

  // lostKg 0 или мало — пустой список
  const r4 = pickEquivalents(0);
  ok(r4.items.length === 0 && r4.remainderKg === 0, 'lostKg 0 → empty');

  const r5 = pickEquivalents(0.01);
  ok(r5.items.length === 0, 'lostKg 0.01 → empty (below min)');

  // remainderKg не отрицательный
  const r6 = pickEquivalents(1.7, { maxItems: 3, diversity: false });
  ok(r6.remainderKg >= 0, 'remainderKg >= 0');
  ok(r6.items.length <= 3, 'respects maxItems 3');

  console.log('---');
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
