import type {
  AiInsight,
  AnalyticsDaily,
  AnalyticsFilters,
  DateRange,
  FinanceTotals,
  FinanceTransaction,
  InventoryFilters,
  InventorySnapshot,
  OverviewData,
  Posting,
  PostingFilters,
  Product,
  ProductFilters,
  ProductPricePoint,
  RealizationDay,
  RealizationMonth,
  ReturnFilters,
  ReturnRecord,
  SyncRun,
  Warehouse,
} from '../types';
import type { ErpDataSource, Paginated } from './ErpDataSource';
import { computeFinanceTotals, getMockDataset } from '../data/mock';
import { DemoPreferencesStore } from './DemoPreferencesStore';

function delay<T>(value: T): Promise<T> {
  const ms = 200 + Math.random() * 300;
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function inRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

function paginate<T>(items: T[], page = 1, pageSize = 10): Paginated<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function withWatchFlag(p: Product): Product {
  return { ...p, isWatched: DemoPreferencesStore.isWatched(p.productId) };
}

function withCostOverride(p: Product): Product {
  const overrides = DemoPreferencesStore.getCostOverrides();
  if (Object.prototype.hasOwnProperty.call(overrides, p.productId)) {
    return { ...p, costPrice: overrides[p.productId] };
  }
  return p;
}

function decorateProduct(p: Product): Product {
  return withCostOverride(withWatchFlag(p));
}

export class MockErpDataSource implements ErpDataSource {
  async getOverview(range: DateRange): Promise<OverviewData> {
    const ds = getMockDataset();
    const postingsInRange = ds.postings.filter((p) => inRange(p.createdAt.slice(0, 10), range));
    const returnsInRange = ds.returns.filter((r) => inRange(r.createdAt.slice(0, 10), range));
    const financeInRange = ds.financeTransactions.filter((t) => inRange(t.date, range));

    const ordersCount = postingsInRange.length;
    const orderedUnits = postingsInRange.reduce((s, p) => s + p.orderedUnits, 0);
    const saleAmount = postingsInRange.filter((p) => p.status !== 'cancelled').reduce((s, p) => s + p.amount, 0);
    const returnedAmount = returnsInRange.reduce((s, r) => s + r.amount, 0);
    const commissionAndServiceCost = -financeInRange
      .filter((t) => t.type === 'commission' || t.type === 'other_service' || t.type === 'delivery')
      .reduce((s, t) => s + t.amount, 0);
    const netPayout = financeInRange.reduce((s, t) => s + t.amount, 0);
    const criticalStockCount = ds.products.filter((p) => p.criticalStock).length;

    const trend = ds.analyticsDaily.filter((a) => inRange(a.date, range));

    const fboUnits = postingsInRange.filter((p) => p.type === 'FBO').reduce((s, p) => s + p.orderedUnits, 0);
    const fbsUnits = postingsInRange.filter((p) => p.type === 'FBS').reduce((s, p) => s + p.orderedUnits, 0);

    const perProductUnits = new Map<string, number>();
    postingsInRange.forEach((p) => {
      p.items.forEach((it) => {
        perProductUnits.set(it.productId, (perProductUnits.get(it.productId) ?? 0) + it.quantity);
      });
    });
    const topProducts = Array.from(perProductUnits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, orderedUnitsSum]) => ({
        productId,
        name: ds.products.find((p) => p.productId === productId)?.name ?? productId,
        orderedUnits: orderedUnitsSum,
      }));

    const criticalAlerts = ds.products
      .filter((p) => p.criticalStock || p.highReturn || p.salesTrend === 'declining')
      .map((p) => ({
        productId: p.productId,
        name: p.name,
        message: p.criticalStock
          ? `Остаток на критическом уровне (${p.fboStock + p.fbsStock} шт.)`
          : p.highReturn
            ? `Высокая доля возвратов (${p.returnRatePct}%)`
            : 'За последние 30 дней наблюдается снижение продаж',
      }));

    const recentPostings = [...ds.postings]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 8);

    return delay({
      range,
      kpis: {
        ordersCount,
        orderedUnits,
        saleAmount,
        returnedAmount,
        commissionAndServiceCost,
        netPayout,
        criticalStockCount,
      },
      trend,
      fboFbsSplit: [
        { type: 'FBO', orderedUnits: fboUnits },
        { type: 'FBS', orderedUnits: fbsUnits },
      ],
      topProducts,
      criticalAlerts,
      recentPostings,
      lastSync: ds.syncRuns.slice(0, 5),
    });
  }

  async getProducts(filters: ProductFilters): Promise<Paginated<Product>> {
    const ds = getMockDataset();
    let items: Product[] = ds.products.map(decorateProduct);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.offerId.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }
    if (filters.status?.length) {
      items = items.filter((p) => filters.status!.includes(p.status));
    }
    if (filters.warehouseType?.length) {
      items = items.filter((p) => {
        const hasFbo = p.fboStock > 0;
        const hasFbs = p.fbsStock > 0;
        return filters.warehouseType!.some((t) => (t === 'FBO' ? hasFbo : hasFbs));
      });
    }
    if (filters.lowStockOnly) {
      items = items.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock');
    }
    if (filters.sortField) {
      const field = filters.sortField;
      const order = filters.sortOrder === 'descend' ? -1 : 1;
      items = [...items].sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * order;
        return String(av).localeCompare(String(bv)) * order;
      });
    }

    return delay(paginate(items, filters.page ?? 1, filters.pageSize ?? 10));
  }

  async getProduct(id: string): Promise<Product | null> {
    const ds = getMockDataset();
    const p = ds.products.find((prod) => prod.productId === id || prod.offerId === id);
    return delay(p ? decorateProduct(p) : null);
  }

  async getPrices(productId: string): Promise<ProductPricePoint[]> {
    const ds = getMockDataset();
    return delay(ds.priceHistory.filter((pt) => pt.productId === productId));
  }

  async getInventory(filters: InventoryFilters): Promise<InventorySnapshot[]> {
    const ds = getMockDataset();
    let items = ds.inventorySnapshots;
    if (filters.warehouseId) items = items.filter((i) => i.warehouseId === filters.warehouseId);
    if (filters.type) items = items.filter((i) => i.type === filters.type);
    if (filters.criticalOnly) {
      const threshold = filters.criticalDaysThreshold ?? 7;
      items = items.filter((i) => {
        const product = ds.products.find((p) => p.productId === i.productId);
        if (!product) return false;
        const velocity = product.velocityPerDay || 0.01;
        const daysLeft = i.available / velocity;
        return daysLeft <= threshold;
      });
    }
    return delay(items);
  }

  async getInventoryHistory(productId: string): Promise<{ date: string; present: number }[]> {
    const ds = getMockDataset();
    return delay(ds.inventoryHistory[productId] ?? []);
  }

  async getWarehouses(): Promise<Warehouse[]> {
    const ds = getMockDataset();
    return delay(ds.warehouses);
  }

  async getPostings(filters: PostingFilters): Promise<Paginated<Posting>> {
    const ds = getMockDataset();
    let items = ds.postings;
    if (filters.type) items = items.filter((p) => p.type === filters.type);
    if (filters.status?.length) items = items.filter((p) => filters.status!.includes(p.status));
    if (filters.productId) items = items.filter((p) => p.items.some((it) => it.productId === filters.productId));
    if (filters.range) items = items.filter((p) => inRange(p.createdAt.slice(0, 10), filters.range!));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (p) => p.postingNumber.toLowerCase().includes(q) || p.orderNumber.toLowerCase().includes(q),
      );
    }
    items = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return delay(paginate(items, filters.page ?? 1, filters.pageSize ?? 10));
  }

  async getPosting(postingNumber: string): Promise<Posting | null> {
    const ds = getMockDataset();
    return delay(ds.postings.find((p) => p.postingNumber === postingNumber) ?? null);
  }

  async getReturns(filters: ReturnFilters): Promise<Paginated<ReturnRecord>> {
    const ds = getMockDataset();
    let items = ds.returns;
    if (filters.range) items = items.filter((r) => inRange(r.createdAt.slice(0, 10), filters.range!));
    if (filters.sku) items = items.filter((r) => r.sku.includes(filters.sku!));
    if (filters.type) items = items.filter((r) => r.type === filters.type);
    if (filters.reason?.length) items = items.filter((r) => filters.reason!.includes(r.reason));
    if (filters.status?.length) items = items.filter((r) => filters.status!.includes(r.status));
    items = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return delay(paginate(items, filters.page ?? 1, filters.pageSize ?? 10));
  }

  async getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsDaily[]> {
    const ds = getMockDataset();
    let postings = ds.postings.filter((p) => inRange(p.createdAt.slice(0, 10), filters.range));
    if (filters.type) postings = postings.filter((p) => p.type === filters.type);
    if (filters.warehouseId) postings = postings.filter((p) => p.warehouseId === filters.warehouseId);
    if (filters.productId) {
      postings = postings
        .map((p) => ({ ...p, items: p.items.filter((it) => it.productId === filters.productId) }))
        .filter((p) => p.items.length > 0);
    }

    const byDate = new Map<string, AnalyticsDaily>();
    let d = new Date(filters.range.start);
    const end = new Date(filters.range.end);
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      byDate.set(key, { date: key, orders: 0, orderedUnits: 0, saleAmount: 0, returns: 0, fbo: 0, fbs: 0 });
      d = new Date(d.getTime() + 86400000);
    }
    postings.forEach((p) => {
      const key = p.createdAt.slice(0, 10);
      const row = byDate.get(key);
      if (!row) return;
      const units = filters.productId
        ? p.items.reduce((s, it) => s + it.quantity, 0)
        : p.orderedUnits;
      const amount = filters.productId
        ? p.items.reduce((s, it) => s + it.quantity * it.price, 0)
        : p.amount;
      row.orders += 1;
      row.orderedUnits += units;
      row.saleAmount += amount;
      if (p.type === 'FBO') row.fbo += units;
      else row.fbs += units;
    });
    const returns = ds.returns.filter((r) => inRange(r.createdAt.slice(0, 10), filters.range));
    returns.forEach((r) => {
      if (filters.productId && r.productId !== filters.productId) return;
      const row = byDate.get(r.createdAt.slice(0, 10));
      if (row) row.returns += r.amount;
    });

    return delay(Array.from(byDate.values()));
  }

  async getFinanceTransactions(range: DateRange): Promise<FinanceTransaction[]> {
    const ds = getMockDataset();
    return delay(ds.financeTransactions.filter((t) => inRange(t.date, range)));
  }

  async getFinanceTotals(range: DateRange): Promise<FinanceTotals> {
    const ds = getMockDataset();
    return delay(computeFinanceTotals(ds, range.start, range.end));
  }

  async getDailyRealization(range: DateRange): Promise<RealizationDay[]> {
    const ds = getMockDataset();
    return delay(ds.realizationDays.filter((r) => inRange(r.date, range)));
  }

  async getMonthlyRealization(): Promise<RealizationMonth[]> {
    const ds = getMockDataset();
    return delay(ds.realizationMonths);
  }

  async getSyncRuns(): Promise<SyncRun[]> {
    const ds = getMockDataset();
    const mode = DemoPreferencesStore.getSyncDemoMode();
    const overrideTs = DemoPreferencesStore.getSyncOverrideTimestamp();
    let runs = ds.syncRuns;
    if (mode === 'empty') runs = [];
    if (mode === 'all_error') {
      runs = runs.map((r) => ({
        ...r,
        status: 'error',
        objectsFetched: 0,
        message: 'Демо-режим: для всех источников активна симуляция ошибок',
      }));
    }
    if (overrideTs) {
      runs = runs.map((r) => ({ ...r, latestRunAt: overrideTs }));
    }
    return delay(runs);
  }

  async getAiInsight(query: string, range: DateRange): Promise<AiInsight> {
    const ds = getMockDataset();
    const now = new Date().toISOString();
    const q = query.toLowerCase();

    const declining = ds.products.filter((p) => p.salesTrend === 'declining');
    const critical = ds.products.filter((p) => p.criticalStock);
    const highReturn = ds.products.filter((p) => p.highReturn);
    const topByUnits = [...ds.products].sort((a, b) => b.orders30d - a.orders30d).slice(0, 5);

    let answer: string;
    let method: string;
    let sourcedProductIds: string[];

    if ((q.includes('azal') && q.includes('sat')) || (q.includes('сниз') && q.includes('продаж'))) {
      method = 'Сравнение количества заказанных единиц в первой и второй половине последних 30 дней';
      sourcedProductIds = declining.map((p) => p.productId);
      answer =
        declining.length > 0
          ? `Товары со снижением продаж: ${declining.map((p) => p.name).join(', ')}. За последние 30 дней у них снизилось число заказов по сравнению с предыдущим периодом.`
          : 'За выбранный период товаров со значительным снижением продаж не найдено.';
    } else if ((q.includes('stok') && (q.includes('bit') || q.includes('7 gün'))) || (q.includes('запас') && (q.includes('законч') || q.includes('7 дней')))) {
      method = 'Деление текущего остатка на среднюю дневную скорость продаж за последние 30 дней';
      sourcedProductIds = critical.map((p) => p.productId);
      answer =
        critical.length > 0
          ? `Товары с риском закончиться за 7 дней: ${critical.map((p) => `${p.name} (осталось ${p.fboStock + p.fbsStock} шт.)`).join(', ')}.`
          : 'Сейчас товаров с риском закончиться в течение 7 дней нет.';
    } else if (q.includes('qaytarma') || q.includes('возврат')) {
      method = 'Отношение числа возвратов товара к общему числу его заказов';
      sourcedProductIds = highReturn.map((p) => p.productId);
      answer =
        highReturn.length > 0
          ? `Товар с самой высокой долей возвратов: ${highReturn[0].name} (${highReturn[0].returnRatePct}%). Основные причины — несоответствие размера и дефект.`
          : 'За выбранный период товаров с аномально высокой долей возвратов нет.';
    } else if (q.includes('yaxşı') || q.includes('top') || q.includes('ən çox') || q.includes('лучш') || q.includes('топ')) {
      method = 'Ранжирование по числу заказанных единиц за последние 30 дней';
      sourcedProductIds = topByUnits.map((p) => p.productId);
      answer = `Лучшие товары за последние 30 дней: ${topByUnits.map((p) => `${p.name} (${p.orders30d} шт.)`).join(', ')}.`;
    } else {
      method = 'Обзор набора данных: число активных товаров, критические остатки и средняя скорость продаж';
      sourcedProductIds = [...critical, ...declining].map((p) => p.productId);
      answer = `В текущем наборе данных отслеживается ${ds.products.length} товаров: у ${critical.length} критический остаток, у ${declining.length} снижаются продажи. Для более точного ответа используйте готовые вопросы.`;
    }

    return delay({
      query,
      answer,
      method,
      rangeStart: range.start,
      rangeEnd: range.end,
      sourcedProductIds,
      isDemo: true,
      generatedAt: now,
    });
  }
}

export const mockErpDataSource = new MockErpDataSource();
