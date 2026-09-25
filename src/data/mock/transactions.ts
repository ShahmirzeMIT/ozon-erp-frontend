import type {
  AnalyticsDaily,
  FinanceTransaction,
  FinanceTransactionType,
  InventorySnapshot,
  Posting,
  PostingItem,
  PostingStatus,
  ProductDailyMetrics,
  ReturnReason,
  ReturnRecord,
  ReturnStatus,
  SyncRun,
  Warehouse,
} from '../../types';
import { createRng, daysAgo, isoDate, pick, randFloat, randInt, weighted, DEMO_TODAY } from './seed';
import type { ProductProfile } from './catalog';

const DAYS = 60;

function trendMultiplier(profile: ProductProfile, dayIndex: number): number {
  // dayIndex: 0 = 59 gün əvvəl, 59 = bu gün
  const progress = dayIndex / (DAYS - 1); // 0..1
  switch (profile.salesTrend) {
    case 'declining':
      return 1.7 - 1.3 * progress; // 1.7 -> 0.4
    case 'rising':
      return 0.5 + 1.1 * progress; // 0.5 -> 1.6
    case 'hot':
      return 0.7 + 1.6 * progress; // 0.7 -> 2.3
    default:
      return 0.85 + 0.3 * Math.sin(progress * Math.PI * 2) * 0.3 + 0.15;
  }
}

export interface GeneratedTransactions {
  postings: Posting[];
  returns: ReturnRecord[];
  financeTransactions: FinanceTransaction[];
  analyticsDaily: AnalyticsDaily[];
  productDailyMetrics: ProductDailyMetrics[];
  inventorySnapshots: InventorySnapshot[]; // cari (bugünkü) vəziyyət, anbar üzrə
  inventoryHistory: Record<string, { date: string; present: number }[]>; // productId -> 60 günlük cəm
  syncRuns: SyncRun[];
}

const POSTING_STATUS_WEIGHTS: Array<[PostingStatus, number]> = [
  ['delivered', 62],
  ['delivering', 16],
  ['awaiting_deliver', 10],
  ['awaiting_packaging', 7],
  ['cancelled', 5],
];

const RETURN_REASON_WEIGHTS: Array<[ReturnReason, number]> = [
  ['not_needed', 35],
  ['size_mismatch', 25],
  ['defect', 20],
  ['wrong_item', 12],
  ['other', 8],
];

const RETURN_STATUS_WEIGHTS: Array<[ReturnStatus, number]> = [
  ['refunded', 45],
  ['received', 20],
  ['approved', 15],
  ['requested', 15],
  ['rejected', 5],
];

export function generateAll(
  products: ProductProfile[],
  warehouses: Warehouse[],
): GeneratedTransactions {
  const rng = createRng(3000);
  const fboWarehouses = warehouses.filter((w) => w.type === 'FBO');
  const fbsWarehouse = warehouses.find((w) => w.type === 'FBS')!;

  // Hər məhsul üçün gündəlik satış vahidi seriyası (60 gün) — dataset-in "vahid mənbəyi".
  const dailyUnits: Record<string, number[]> = {};
  products.forEach((p) => {
    const arr: number[] = [];
    for (let d = 0; d < DAYS; d++) {
      const mult = trendMultiplier(p, d);
      const noise = randFloat(rng, 0.5, 1.5, 2);
      const units = Math.max(0, Math.round(p.velocityPerDay * mult * noise));
      arr.push(units);
    }
    dailyUnits[p.productId] = arr;
  });

  // ---- Postings ----
  const postings: Posting[] = [];
  let postingCounter = 1;
  let orderCounter = 1;

  for (let d = 0; d < DAYS; d++) {
    const date = daysAgo(DAYS - 1 - d, DEMO_TODAY);
    const postingsToday = randInt(rng, 2, 4);
    for (let k = 0; k < postingsToday; k++) {
      const type = rng() > 0.42 ? 'FBO' : 'FBS';
      const warehouse = type === 'FBO' ? pick(rng, fboWarehouses) : fbsWarehouse;
      const itemCount = randInt(rng, 1, 3);
      const items: PostingItem[] = [];
      const weightsForDay: Array<[ProductProfile, number]> = products.map((p) => [
        p,
        Math.max(0.05, p.velocityPerDay * trendMultiplier(p, d)),
      ]);
      for (let it = 0; it < itemCount; it++) {
        const product = weighted(rng, weightsForDay);
        const qty = randInt(rng, 1, 3);
        items.push({
          productId: product.productId,
          offerId: product.offerId,
          name: product.name,
          quantity: qty,
          price: product.currentPrice,
        });
      }
      const orderedUnits = items.reduce((s, i) => s + i.quantity, 0);
      const amount = items.reduce((s, i) => s + i.quantity * i.price, 0);
      const status = weighted<PostingStatus>(rng, POSTING_STATUS_WEIGHTS);
      const hh = randInt(rng, 8, 21);
      const mm = randInt(rng, 0, 59);
      const createdAt = new Date(date);
      createdAt.setUTCHours(hh, mm, 0, 0);

      postings.push({
        postingNumber: `${isoDate(date).replace(/-/g, '')}-${String(postingCounter).padStart(4, '0')}-1`,
        orderNumber: `ORD-${String(orderCounter).padStart(6, '0')}`,
        type,
        status,
        createdAt: createdAt.toISOString(),
        warehouseId: warehouse.warehouseId,
        items,
        orderedUnits,
        amount,
      });
      postingCounter += 1;
      orderCounter += 1;
    }
  }

  // ---- Analytics daily (postings-dən aqreqasiya, vahid mənbə) ----
  const analyticsDaily: AnalyticsDaily[] = [];
  const productDailyMetrics: ProductDailyMetrics[] = [];
  for (let d = 0; d < DAYS; d++) {
    const date = isoDate(daysAgo(DAYS - 1 - d, DEMO_TODAY));
    const dayPostings = postings.filter((p) => p.createdAt.slice(0, 10) === date);
    const orders = dayPostings.length;
    const orderedUnits = dayPostings.reduce((s, p) => s + p.orderedUnits, 0);
    const saleAmount = dayPostings.reduce((s, p) => s + p.amount, 0);
    const fbo = dayPostings.filter((p) => p.type === 'FBO').reduce((s, p) => s + p.orderedUnits, 0);
    const fbs = dayPostings.filter((p) => p.type === 'FBS').reduce((s, p) => s + p.orderedUnits, 0);

    analyticsDaily.push({ date, orders, orderedUnits, saleAmount, returns: 0, fbo, fbs });

    const perProduct = new Map<string, { orderedUnits: number; saleAmount: number }>();
    dayPostings.forEach((p) => {
      p.items.forEach((it) => {
        const cur = perProduct.get(it.productId) ?? { orderedUnits: 0, saleAmount: 0 };
        cur.orderedUnits += it.quantity;
        cur.saleAmount += it.quantity * it.price;
        perProduct.set(it.productId, cur);
      });
    });
    products.forEach((p) => {
      const agg = perProduct.get(p.productId);
      productDailyMetrics.push({
        date,
        productId: p.productId,
        orderedUnits: agg?.orderedUnits ?? 0,
        saleAmount: agg?.saleAmount ?? 0,
        returns: 0,
      });
    });
  }

  // ---- Returns ----
  const returns: ReturnRecord[] = [];
  let returnCounter = 1;
  const highReturnProduct = products.find((p) => p.highReturn)!;

  // yüksək qaytarma məhsulu üçün onun sifarişlərindən bir neçəsini seç
  const highReturnPostings = postings.filter((p) =>
    p.items.some((it) => it.productId === highReturnProduct.productId),
  );
  const guaranteedHighReturnCount = Math.min(7, highReturnPostings.length);
  for (let i = 0; i < guaranteedHighReturnCount; i++) {
    const posting = highReturnPostings[i];
    const item = posting.items.find((it) => it.productId === highReturnProduct.productId)!;
    returns.push({
      returnId: `RET-${String(returnCounter).padStart(4, '0')}`,
      postingNumber: posting.postingNumber,
      productId: item.productId,
      sku: highReturnProduct.sku,
      type: posting.type,
      reason: weighted(rng, RETURN_REASON_WEIGHTS),
      status: weighted(rng, RETURN_STATUS_WEIGHTS),
      amount: item.price * item.quantity,
      createdAt: posting.createdAt,
    });
    returnCounter += 1;
  }

  // ümumi say ən azı 10+guaranteedHighReturnCount olsun deyə əlavə təsadüfi qaytarmalar
  const remainingTarget = 14; // əlavə ümumi qaytarma sayı (cəmi >= 21)
  const shuffledPostings = [...postings].sort(() => rng() - 0.5);
  for (let i = 0; i < remainingTarget && i < shuffledPostings.length; i++) {
    const posting = shuffledPostings[i];
    const item = pick(rng, posting.items);
    const product = products.find((p) => p.productId === item.productId)!;
    returns.push({
      returnId: `RET-${String(returnCounter).padStart(4, '0')}`,
      postingNumber: posting.postingNumber,
      productId: item.productId,
      sku: product.sku,
      type: posting.type,
      reason: weighted(rng, RETURN_REASON_WEIGHTS),
      status: weighted(rng, RETURN_STATUS_WEIGHTS),
      amount: item.price * item.quantity,
      createdAt: posting.createdAt,
    });
    returnCounter += 1;
  }

  // qaytarmaları analytics-ə geri yaz
  returns.forEach((r) => {
    const date = r.createdAt.slice(0, 10);
    const dayRow = analyticsDaily.find((a) => a.date === date);
    if (dayRow) dayRow.returns += r.amount;
    const prodRow = productDailyMetrics.find((m) => m.date === date && m.productId === r.productId);
    if (prodRow) prodRow.returns += r.amount;
  });

  // ---- Finance transactions ----
  const financeTransactions: FinanceTransaction[] = [];
  let txCounter = 1;
  const pushTx = (
    date: string,
    postingNumber: string | null,
    type: FinanceTransactionType,
    category: string,
    amount: number,
  ) => {
    financeTransactions.push({
      transactionId: `TXN-${String(txCounter).padStart(5, '0')}`,
      date,
      postingNumber,
      type,
      category,
      amount,
    });
    txCounter += 1;
  };

  postings
    .filter((p) => p.status !== 'cancelled')
    .forEach((p) => {
      const date = p.createdAt.slice(0, 10);
      pushTx(date, p.postingNumber, 'sale', 'Продажа товара', p.amount);
      const commission = -Math.round(p.amount * randFloat(rng, 0.08, 0.16, 3));
      pushTx(date, p.postingNumber, 'commission', 'Комиссия с продаж', commission);
      if (p.type === 'FBO' || rng() > 0.5) {
        const delivery = -Math.round(p.amount * randFloat(rng, 0.02, 0.06, 3));
        pushTx(date, p.postingNumber, 'delivery', 'Услуга доставки', delivery);
      }
      if (rng() > 0.85) {
        const other = -randInt(rng, 20, 150);
        pushTx(date, p.postingNumber, 'other_service', 'Складская/сервисная комиссия', other);
      }
    });

  returns.forEach((r) => {
    pushTx(r.createdAt.slice(0, 10), r.postingNumber, 'return', 'Возврат', -r.amount);
  });

  // ---- Sync runs (16 endpoint) ----
  const endpointDefs: Array<{ name: string; path: string; page: string }> = [
    { name: 'Каталог товаров', path: '/v3/product/list', page: 'Товары' },
    { name: 'Детали товаров', path: '/v3/product/info/list', page: 'Товары' },
    { name: 'Цены', path: '/v5/product/info/prices', page: 'Товары' },
    { name: 'Остатки FBO', path: '/v2/analytics/stock_on_warehouses', page: 'Склад и остатки' },
    { name: 'Остатки FBS', path: '/v4/product/info/stocks', page: 'Склад и остатки' },
    { name: 'Заказы FBO', path: '/v2/posting/fbo/list', page: 'Заказы' },
    { name: 'Заказы FBS', path: '/v3/posting/fbs/list', page: 'Заказы' },
    { name: 'Детали заказа FBO', path: '/v2/posting/fbo/get', page: 'Заказы' },
    { name: 'Детали заказа FBS', path: '/v3/posting/fbs/get', page: 'Заказы' },
    { name: 'Возвраты (FBS)', path: '/v3/returns/company/fbs', page: 'Возвраты' },
    { name: 'Возвраты (FBO)', path: '/v2/returns/company/fbo', page: 'Возвраты' },
    { name: 'Финансовые операции', path: '/v3/finance/transaction/list', page: 'Финансы' },
    { name: 'Итоги финансовых операций', path: '/v3/finance/transaction/totals', page: 'Финансы' },
    { name: 'Ежедневная реализация', path: '/v1/finance/realization/day', page: 'Финансы' },
    { name: 'Список складов', path: '/v1/warehouse/list', page: 'Склад и остатки' },
    { name: 'Ежемесячная реализация', path: '/v2/finance/realization', page: 'Финансы' },
  ];
  const syncRuns: SyncRun[] = endpointDefs.map((def, idx) => {
    const isError = idx === 8; // "FBS sifariş detalı" üçün 1 uğursuz sync nümunəsi
    const status = isError ? 'error' : weighted<SyncRun['status']>(rng, [
      ['success', 85],
      ['partial', 15],
    ]);
    const latestRun = daysAgo(randInt(rng, 0, 1), DEMO_TODAY);
    latestRun.setUTCHours(randInt(rng, 1, 6), randInt(rng, 0, 59), 0, 0);
    const lastSuccess = isError ? daysAgo(randInt(rng, 2, 5), DEMO_TODAY) : latestRun;
    return {
      endpointId: idx + 1,
      endpointName: def.name,
      path: def.path,
      lastSuccessAt: lastSuccess.toISOString(),
      latestRunAt: latestRun.toISOString(),
      status,
      objectsFetched: isError ? 0 : randInt(rng, 20, 4000),
      latencyMs: randInt(rng, 180, isError ? 9000 : 2200),
      message: isError
        ? 'Ozon API вернул ошибку 500 — остановлено после 3 попыток'
        : status === 'partial'
          ? 'Некоторые объекты отложены из-за лимита пагинации'
          : 'Успешно завершено',
      page: def.page,
    };
  });

  // ---- Inventory ----
  const inventorySnapshots: InventorySnapshot[] = [];
  const inventoryHistory: Record<string, { date: string; present: number }[]> = {};

  products.forEach((p, idx) => {
    const units = dailyUnits[p.productId];
    const totalSold60d = units.reduce((s, u) => s + u, 0);

    let currentTotal: number;
    if (p.criticalStock) {
      currentTotal = randInt(rng, 2, 8);
    } else {
      const base = Math.round(p.velocityPerDay * randInt(rng, 12, 28));
      currentTotal = Math.max(15, base);
    }

    const fboWarehouse = fboWarehouses[idx % fboWarehouses.length];
    const fboShare = p.criticalStock ? Math.round(currentTotal * 0.5) : Math.round(currentTotal * randFloat(rng, 0.5, 0.7));
    const fbsShare = currentTotal - fboShare;

    const fboReserved = Math.min(fboShare, randInt(rng, 0, Math.ceil(fboShare * 0.2)));
    const fbsReserved = Math.min(fbsShare, randInt(rng, 0, Math.ceil(fbsShare * 0.2)));

    inventorySnapshots.push({
      date: isoDate(DEMO_TODAY),
      productId: p.productId,
      warehouseId: fboWarehouse.warehouseId,
      type: 'FBO',
      present: fboShare,
      reserved: fboReserved,
      available: fboShare - fboReserved,
    });
    inventorySnapshots.push({
      date: isoDate(DEMO_TODAY),
      productId: p.productId,
      warehouseId: fbsWarehouse.warehouseId,
      type: 'FBS',
      present: fbsShare,
      reserved: fbsReserved,
      available: fbsShare - fbsReserved,
    });

    p.fboStock = fboShare;
    p.fbsStock = fbsShare;

    // tarixçə: bugünkü dəyərdən geriyə doğru satılan miqdarı əlavə edərək qururuq,
    // arabir bərpa (restock) hadisəsi ilə.
    const history: { date: string; present: number }[] = new Array(DAYS);
    let runningPresent = currentTotal;
    for (let d = DAYS - 1; d >= 0; d--) {
      history[d] = { date: isoDate(daysAgo(DAYS - 1 - d, DEMO_TODAY)), present: Math.max(0, runningPresent) };
      const soldThatDay = units[d];
      runningPresent += soldThatDay;
      if (!p.criticalStock && d % 21 === 0 && d !== 0) {
        runningPresent -= randInt(rng, 20, 60); // restock idi (geriyə hesablamada çıxırıq)
      }
    }
    inventoryHistory[p.productId] = history;

    // orders7d / orders30d / returnRatePct
    const metrics = productDailyMetrics.filter((m) => m.productId === p.productId);
    const last7 = metrics.slice(-7).reduce((s, m) => s + m.orderedUnits, 0);
    const last30 = metrics.slice(-30).reduce((s, m) => s + m.orderedUnits, 0);
    p.orders7d = last7;
    p.orders30d = last30;

    const productReturns = returns.filter((r) => r.productId === p.productId).length;
    const productOrders = postings.filter((po) => po.items.some((it) => it.productId === p.productId)).length;
    p.returnRatePct = productOrders > 0 ? Math.round((productReturns / productOrders) * 1000) / 10 : 0;

    if (p.fboStock + p.fbsStock === 0) p.status = 'out_of_stock';
    else if (p.criticalStock) p.status = 'low_stock';
    void totalSold60d;
  });

  return {
    postings,
    returns,
    financeTransactions,
    analyticsDaily,
    productDailyMetrics,
    inventorySnapshots,
    inventoryHistory,
    syncRuns,
  };
}
