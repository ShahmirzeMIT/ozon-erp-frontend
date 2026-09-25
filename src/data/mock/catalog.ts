import type { Product, ProductPricePoint, Warehouse } from '../../types';
import { createRng, pick, randFloat, randInt, weighted } from './seed';

export const WAREHOUSES: Warehouse[] = [
  { warehouseId: 'WH-FBO-MSK', name: 'Ozon FBO — Москва', type: 'FBO', region: 'Московская область' },
  { warehouseId: 'WH-FBO-KZN', name: 'Ozon FBO — Kazan', type: 'FBO', region: 'Tatarstan' },
  { warehouseId: 'WH-FBS-OWN', name: 'Мой склад (FBS)', type: 'FBS', region: 'Баку' },
];

const CATEGORIES = [
  'Дом и сад',
  'Одежда',
  'Электроника',
  'Красота',
  'Спорт и отдых',
  'Детские товары',
  'Кухонные принадлежности',
  'Обувь',
];

const ADJECTIVES = [
  'Termo',
  'Klassik',
  'Premium',
  'Kompakt',
  'Universal',
  'Водостойкий',
  'Portativ',
  'Ekoloji',
  'Лёгкий',
  'Долговечный',
];

const NOUNS: Record<string, string[]> = {
  'Дом и сад': ['стакан 350 мл', 'контейнер', 'настенные часы', 'лампа', 'ковёр 120x180'],
  Одежда: ['женская куртка M', 'мужская футболка L', 'детские брюки 128', 'зимний шарф', 'жилет'],
  Электроника: ['беспроводные наушники', 'powerbank 10000 мАч', 'ремешок для смарт-часов', 'чехол для телефона', 'кабель USB-C 2 м'],
  Красота: ['крем для лица 50 мл', 'фен', 'набор для ногтей', 'духи 30 мл', 'лампа для маникюра'],
  'Спорт и отдых': ['коврик для йоги', 'набор фитнес-резинок', 'велосипедные перчатки', 'термобутылка 1 л', 'сумка 25 л'],
  'Детские товары': ['детский конструктор', 'игрушечная машина', 'набор детских книг', 'коврик', 'мягкая игрушка'],
  'Кухонные принадлежности': ['набор ножей 5 шт.', 'разделочная доска', 'термоконтейнер 1,2 л', 'силиконовая лопатка', 'чайный сервиз на 6 персон'],
  Обувь: ['кроссовки 42', 'зимние ботинки 38', 'домашние тапочки', 'летние сандалии', 'треккинговые ботинки 43'],
};

const EMOJI: Record<string, string> = {
  'Дом и сад': '🏠',
  Одежда: '🧥',
  Электроника: '🔌',
  Красота: '💄',
  'Спорт и отдых': '🏋️',
  'Детские товары': '🧸',
  'Кухонные принадлежности': '🍳',
  Обувь: '👟',
};

export interface ProductProfile extends Product {
  salesTrend: 'declining' | 'rising' | 'stable' | 'hot';
  criticalStock: boolean;
  highReturn: boolean;
  velocityPerDay: number; // baza gündəlik satış sürəti (ordered units)
}

export function generateProducts(): ProductProfile[] {
  const rng = createRng(1000);
  const products: ProductProfile[] = [];
  let counter = 1;

  for (const category of CATEGORIES) {
    const nouns = NOUNS[category];
    for (let i = 0; i < nouns.length; i++) {
      const adj = pick(rng, ADJECTIVES);
      const name = `${adj} ${nouns[i]}`;
      const offerId = `OFR-${String(counter).padStart(4, '0')}`;
      const productId = `${100000000 + counter * 37}`;
      const sku = `${700000000 + counter * 53}`;
      const price = randInt(rng, 250, 12000);
      const hasCost = rng() > 0.18; // bəzi məhsullarda maya dəyəri qəsdən boş
      const costPrice = hasCost ? Math.round(price * randFloat(rng, 0.42, 0.72)) : null;
      const velocityPerDay = randFloat(rng, 0.3, 9, 2);

      const trend = weighted<ProductProfile['salesTrend']>(rng, [
        ['stable', 60],
        ['rising', 20],
        ['hot', 10],
        ['declining', 10],
      ]);

      products.push({
        productId,
        offerId,
        sku,
        name,
        category,
        imageEmoji: EMOJI[category],
        status: 'active',
        currentPrice: price,
        currency: 'RUB',
        costPrice,
        fboStock: 0,
        fbsStock: 0,
        orders7d: 0,
        orders30d: 0,
        returnRatePct: 0,
        isWatched: false,
        salesTrend: trend,
        criticalStock: false,
        highReturn: false,
        velocityPerDay,
      });
      counter += 1;
    }
  }

  // Tələb olunan xüsusi ssenarilər: dəqiq say və deterministik seçim.
  const decliningIdx = [2, 14]; // 2 məhsulda satış azalması
  const criticalIdx = [4, 19, 27]; // 3 məhsulda kritik az qalıq
  const highReturnIdx = [9]; // 1 məhsulda yüksək qaytarma

  decliningIdx.forEach((i) => {
    products[i].salesTrend = 'declining';
  });
  criticalIdx.forEach((i) => {
    products[i].criticalStock = true;
    products[i].status = 'low_stock';
  });
  highReturnIdx.forEach((i) => {
    products[i].highReturn = true;
  });

  return products;
}

export function generatePriceHistory(products: ProductProfile[]): ProductPricePoint[] {
  const rng = createRng(2000);
  const points: ProductPricePoint[] = [];
  const today = new Date('2026-09-24T00:00:00.000Z');

  products.forEach((p) => {
    let price = Math.round(p.currentPrice * randFloat(rng, 0.9, 1.12));
    const changeDays = [58, 45, 30, 18, 7, 0].filter(() => rng() > 0.25);
    if (!changeDays.includes(0)) changeDays.push(0);
    changeDays
      .sort((a, b) => b - a)
      .forEach((daysAgoVal, idx) => {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - daysAgoVal);
        if (daysAgoVal === 0) {
          price = p.currentPrice;
        } else if (idx > 0) {
          price = Math.round(price * randFloat(rng, 0.94, 1.08));
        }
        points.push({ date: d.toISOString().slice(0, 10), productId: p.productId, price });
      });
  });

  return points;
}
