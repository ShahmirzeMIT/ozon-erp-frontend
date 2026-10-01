import type { ErpDataSource, OzonRealizationRow, Paginated } from './ErpDataSource';
import { ERP_API_BASE_URL } from './ErpDataSource';
import type { AiInsight, AnalyticsDaily, AnalyticsFilters, DateRange, FinanceTotals, FinanceTransaction, InventoryFilters, InventorySnapshot, OverviewData, Posting, PostingFilters, Product, ProductFilters, ProductPricePoint, RealizationDay, RealizationMonth, ReturnFilters, ReturnRecord, SyncRun, Warehouse } from '../types';

const query = (params: Record<string, unknown>) => Object.entries(params).flatMap(([key, value]) => {
  if (value === undefined || value === null || value === '' || value === false) return [];
  return [[key, Array.isArray(value) ? value.join(',') : String(value)]] as const;
}).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');

export class HttpErpDataSource implements ErpDataSource {
  private async get<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(`${ERP_API_BASE_URL}${path}${query(params) ? `?${query(params)}` : ''}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `API xətası: ${response.status}`);
    return body as T;
  }
  getOverview(range: DateRange) { return this.get<OverviewData>('/overview', range as unknown as Record<string, unknown>); }
  getProducts(filters: ProductFilters) {
    const { range, ...productFilters } = filters;
    return this.get<Paginated<Product>>('/products', {
      ...productFilters,
      ...(range || {}),
    });
  }
  getProduct(id: string) { return this.get<Product | null>(`/products/${encodeURIComponent(id)}`); }
  setProductCost(id: string, value: number) { return this.get<{ costPrice: number }>(`/products/${encodeURIComponent(id)}/cost`, { value }); }
  getPrices(productId: string) { return this.get<ProductPricePoint[]>('/products/prices', { productId }); }
  getInventory(filters: InventoryFilters) { return this.get<InventorySnapshot[]>('/inventory', filters as Record<string, unknown>); }
  getInventoryHistory(productId: string) { return this.get<{ date: string; present: number }[]>('/inventory/history', { productId }); }
  getWarehouses() { return this.get<Warehouse[]>('/warehouses'); }
  getPostings(filters: PostingFilters) { return this.get<Paginated<Posting>>('/postings', { ...filters, ...(filters.range || {}) }); }
  getPosting(postingNumber: string) { return this.get<Posting | null>(`/postings/${encodeURIComponent(postingNumber)}`); }
  getReturns(filters: ReturnFilters) { return this.get<Paginated<ReturnRecord>>('/returns', { ...filters, ...(filters.range || {}) }); }
  getAnalytics(filters: AnalyticsFilters) { return this.get<AnalyticsDaily[]>('/analytics', { ...filters, ...(filters.range || {}) }); }
  getFinanceTransactions(range: DateRange) { return this.get<FinanceTransaction[]>('/finance/transactions', range as unknown as Record<string, unknown>); }
  getRawRealization(range: DateRange) { return this.get<OzonRealizationRow[]>('/finance/realization/raw', range as unknown as Record<string, unknown>); }
  getFinanceTotals(range: DateRange) { return this.get<FinanceTotals>('/finance/totals', range as unknown as Record<string, unknown>); }
  getDailyRealization(range: DateRange) { return this.get<RealizationDay[]>('/finance/realization/daily', range as unknown as Record<string, unknown>); }
  getMonthlyRealization(range?: DateRange) { return this.get<RealizationMonth[]>('/finance/realization/monthly', range ? (range as unknown as Record<string, unknown>) : {}); }
  getSyncRuns() { return this.get<SyncRun[]>('/sync/runs'); }
  async syncNow() { const response = await fetch(`${ERP_API_BASE_URL}/sync`, { method: 'POST' }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || `API xətası: ${response.status}`); return body as { ok: boolean }; }
  getAiInsight(queryText: string, range: DateRange) { return this.get<AiInsight>('/ai/ask', { query: queryText, ...range }); }
}
