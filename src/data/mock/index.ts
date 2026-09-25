import type {
  FinanceTotals,
  RealizationDay,
  RealizationMonth,
} from '../../types';
import { WAREHOUSES, generatePriceHistory, generateProducts, type ProductProfile } from './catalog';
import { generateAll, type GeneratedTransactions } from './transactions';
import { isoDate, daysAgo, DEMO_TODAY } from './seed';

export interface MockDataset extends GeneratedTransactions {
  products: ProductProfile[];
  warehouses: typeof WAREHOUSES;
  priceHistory: ReturnType<typeof generatePriceHistory>;
  realizationDays: RealizationDay[];
  realizationMonths: RealizationMonth[];
}

function buildDataset(): MockDataset {
  const products = generateProducts();
  const warehouses = WAREHOUSES;
  const priceHistory = generatePriceHistory(products);
  const generated = generateAll(products, warehouses);

  // Günlük realizasiya: maliyyə əməliyyatlarından aqreqasiya (vahid mənbə).
  const realizationDays: RealizationDay[] = [];
  for (let d = 0; d < 60; d++) {
    const date = isoDate(daysAgo(59 - d, DEMO_TODAY));
    const dayTx = generated.financeTransactions.filter((t) => t.date === date);
    const saleAmount = dayTx.filter((t) => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
    const commission = dayTx.filter((t) => t.type === 'commission').reduce((s, t) => s + t.amount, 0);
    const delivery = dayTx.filter((t) => t.type === 'delivery').reduce((s, t) => s + t.amount, 0);
    const returns = dayTx.filter((t) => t.type === 'return').reduce((s, t) => s + t.amount, 0);
    const other = dayTx.filter((t) => t.type === 'other_service').reduce((s, t) => s + t.amount, 0);
    const payout = saleAmount + commission + delivery + returns + other;
    realizationDays.push({ date, saleAmount, commission, delivery, payout });
  }

  const monthMap = new Map<string, RealizationDay[]>();
  realizationDays.forEach((r) => {
    const month = r.date.slice(0, 7);
    const arr = monthMap.get(month) ?? [];
    arr.push(r);
    monthMap.set(month, arr);
  });
  const realizationMonths: RealizationMonth[] = Array.from(monthMap.entries()).map(([month, rows]) => ({
    month,
    saleAmount: rows.reduce((s, r) => s + r.saleAmount, 0),
    commission: rows.reduce((s, r) => s + r.commission, 0),
    delivery: rows.reduce((s, r) => s + r.delivery, 0),
    payout: rows.reduce((s, r) => s + r.payout, 0),
    reconciled: month !== realizationDays[realizationDays.length - 1].date.slice(0, 7),
  }));

  return {
    products,
    warehouses,
    priceHistory,
    realizationDays,
    realizationMonths,
    ...generated,
  };
}

let cached: MockDataset | null = null;

export function getMockDataset(): MockDataset {
  if (!cached) cached = buildDataset();
  return cached;
}

export function computeFinanceTotals(dataset: MockDataset, start: string, end: string): FinanceTotals {
  const tx = dataset.financeTransactions.filter((t) => t.date >= start && t.date <= end);
  const saleAmount = tx.filter((t) => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
  const commission = tx.filter((t) => t.type === 'commission').reduce((s, t) => s + t.amount, 0);
  const delivery = tx.filter((t) => t.type === 'delivery').reduce((s, t) => s + t.amount, 0);
  const otherServices = tx.filter((t) => t.type === 'other_service').reduce((s, t) => s + t.amount, 0);
  const returnsAmt = tx.filter((t) => t.type === 'return').reduce((s, t) => s + t.amount, 0);
  const payout = saleAmount + commission + delivery + otherServices + returnsAmt;
  return {
    rangeStart: start,
    rangeEnd: end,
    saleAmount,
    commission,
    delivery,
    otherServices,
    returns: returnsAmt,
    payout,
  };
}
