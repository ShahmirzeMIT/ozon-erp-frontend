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

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type OzonRealizationRow = Record<string, unknown>;

/**
 * Frontend-in etibar etdiyi YEGANƏ data kontraktı.
 *
 * UI yalnız backend REST endpoint-lərinin qaytardığı normallaşdırılmış real
 * Ozon məlumat kontraktına bağlıdır.
 */
export interface ErpDataSource {
  getOverview(range: DateRange): Promise<OverviewData>;
  getProducts(filters: ProductFilters): Promise<Paginated<Product>>;
  getProduct(id: string): Promise<Product | null>;
  setProductCost(id: string, value: number): Promise<{ costPrice: number }>;
  getPrices(productId: string): Promise<ProductPricePoint[]>;
  getInventory(filters: InventoryFilters): Promise<InventorySnapshot[]>;
  getInventoryHistory(productId: string): Promise<{ date: string; present: number }[]>;
  getWarehouses(): Promise<Warehouse[]>;
  getPostings(filters: PostingFilters): Promise<Paginated<Posting>>;
  getPosting(postingNumber: string): Promise<Posting | null>;
  getReturns(filters: ReturnFilters): Promise<Paginated<ReturnRecord>>;
  getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsDaily[]>;
  getFinanceTransactions(range: DateRange): Promise<FinanceTransaction[]>;
  getRawRealization(range: DateRange): Promise<OzonRealizationRow[]>;
  getFinanceTotals(range: DateRange): Promise<FinanceTotals>;
  getDailyRealization(range: DateRange): Promise<RealizationDay[]>;
  getMonthlyRealization(range?: DateRange): Promise<RealizationMonth[]>;
  getSyncRuns(): Promise<SyncRun[]>;
  syncNow(): Promise<{ ok: boolean }>;
  getAiInsight(query: string, range: DateRange): Promise<AiInsight>;
}

// Gələcək backend üçün konfiqurasiya nöqtəsi. Yalnız gizli olmayan dəyər.
export const ERP_API_BASE_URL: string =
  (import.meta.env.VITE_ERP_API_BASE_URL as string | undefined) || 'http://127.0.0.1:8787/api';
