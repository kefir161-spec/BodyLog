/**
 * Парсер строки ввода: "2 яйца", "гречка 200г", "молоко 250 мл" -> name, qty, unit, grams (если можно).
 */

export type ParsedQty = {
  name: string;
  qty: number;
  unit: 'g' | 'ml' | 'pcs';
  grams?: number;
};

const RE_NUM = /(\d+[.,]?\d*)\s*?(кг|г|гр|g|л|мл|ml|л\.|шт|штуки?|pcs|piece|pieces|x|×|х)/gi;
const RE_NUM_FIRST = /^(\d+[.,]?\d*)\s+/;
const RE_UNIT_AT_END = /\s*(\d+[.,]?\d*)\s*(кг|г|гр|g|л|мл|ml|шт|штуки?|pcs|piece|pieces|x|×|х)\s*$/i;
const STOP_WORDS = new Set([
  'шт', 'штуки', 'штук', 'г', 'гр', 'г.', 'мл', 'л', 'кг', 'g', 'ml', 'pcs', 'piece', 'pieces',
  'x', '×', 'х', 'и', 'в', 'на', 'с', 'по', 'из',
]);

function normalizeNumber(s: string): number {
  const n = s.replace(',', '.').trim();
  const v = parseFloat(n);
  return Number.isNaN(v) ? 1 : v;
}

function normalizeName(s: string): string {
  return s
    .replace(/\s*[\d.,]+\s*(кг|г|гр|g|л|мл|шт|штуки?|pcs|piece|x|×|х)\s*/gi, ' ')
    .replace(/\s*\d+[.,]?\d*\s*(x|×|х)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Определяет unit по ключевым словам в названии (яйца, бананы и т.д. -> pcs если есть число перед словом).
 */
function inferUnitFromName(name: string, hadExplicitUnit: boolean): 'g' | 'ml' | 'pcs' {
  if (hadExplicitUnit) return 'g'; // уже задано ниже
  const lower = name.toLowerCase();
  const pcsHint = /\b(яйцо|яйца|яиц|банан|банана|котлета|котлеты|ломтик|ломтика|кусок|куска|шт\.?)\b/i.test(lower);
  if (pcsHint) return 'pcs';
  return 'g';
}

export function parseFoodInput(input: string): ParsedQty | null {
  if (!input || !input.trim()) return null;
  const raw = input.trim();
  let name = raw;
  let qty = 1;
  let unit: 'g' | 'ml' | 'pcs' = 'g';
  let grams: number | undefined;
  let hadExplicitUnit = false;

  // Сначала проверяем явные единицы в конце: "гречка 200г", "молоко 250 мл", "банан 1 шт"
  const matchEnd = raw.match(RE_UNIT_AT_END);
  if (matchEnd) {
    const [, numStr, unitStr] = matchEnd;
    qty = normalizeNumber(numStr);
    const u = unitStr.toLowerCase();
    if (u === 'кг' || u === 'kg') {
      unit = 'g';
      grams = qty * 1000;
      hadExplicitUnit = true;
    } else if (u === 'г' || u === 'гр' || u === 'g') {
      unit = 'g';
      grams = qty;
      hadExplicitUnit = true;
    } else if (u === 'л' || u === 'л.') {
      unit = 'ml';
      qty = qty * 1000;
      hadExplicitUnit = true;
    } else if (u === 'мл' || u === 'ml') {
      unit = 'ml';
      hadExplicitUnit = true;
    } else if (/шт|штуки?|pcs|piece|pieces|x|×|х/i.test(u)) {
      unit = 'pcs';
      hadExplicitUnit = true;
    }
    name = raw.slice(0, matchEnd.index).trim();
  }

  // Число в начале: "2 яйца", "2x яйцо"
  if (!hadExplicitUnit) {
    const matchFirst = name.match(RE_NUM_FIRST);
    if (matchFirst) {
      qty = normalizeNumber(matchFirst[1]);
      name = name.slice(matchFirst[0].length).trim();
      const lower = name.toLowerCase();
      if (/\b(яйцо|яйца|банан|котлета|ломтик|кусок|шт)\b/i.test(lower) || name.length < 20) {
        unit = 'pcs';
      }
    }
  }

  // Разделитель 2x или 2× в середине/начале
  const xMatch = name.match(/^(\d+[.,]?\d*)\s*(x|×|х)\s*/i);
  if (xMatch && !hadExplicitUnit) {
    qty = normalizeNumber(xMatch[1]);
    name = name.slice(xMatch[0].length).trim();
    unit = 'pcs';
  }

  name = normalizeName(name);
  if (!name) return null;

  return { name, qty, unit, grams };
}

/** Для яиц: быстрые варианты массы 1 шт (г) */
export const EGG_PIECE_OPTIONS = [
  { label: '1 яйцо: 50 г', grams: 50 },
  { label: '1 яйцо (С0): 60 г', grams: 60 },
  { label: '1 яйцо (мал.): 45 г', grams: 45 },
] as const;

export function isEggLikeName(name: string): boolean {
  const n = name.toLowerCase().replace(/\s+/g, ' ');
  return /яйцо|яйца|egg/i.test(n);
}
