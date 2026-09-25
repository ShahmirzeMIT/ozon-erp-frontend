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

/**
 * Frontend-in etibar etdiyi YEGANƏ data kontraktı.
 *
 * Bu gün `MockErpDataSource` bu interfeysi realist demo data ilə doldurur.
 * Backend hazır olanda `HttpErpDataSource` eyni interfeysi öz REST
 * endpoint-lərinizlə (məs. `GET /api/products`) dolduracaq və UI
 * komponentlərində HEÇ BİR dəyişiklik tələb olunmayacaq — yalnız
 * `src/hooks/useDataSource.ts` daxilindəki provider dəyişdiriləcək.
 *
 * Ozon-un xam cavabları birbaşa bura ötürülmür: gələcək `HttpErpDataSource`
 * Ozon JSON-unu `src/services/normalizers` qatında bu tiplərə çevirməlidir.
 */
export interface ErpDataSource {
  getOverview(range: DateRange): Promise<OverviewData>;
  getProducts(filters: ProductFilters): Promise<Paginated<Product>>;
  getProduct(id: string): Promise<Product | null>;
  getPrices(productId: string): Promise<ProductPricePoint[]>;
  getInventory(filters: InventoryFilters): Promise<InventorySnapshot[]>;
  getInventoryHistory(productId: string): Promise<{ date: string; present: number }[]>;
  getWarehouses(): Promise<Warehouse[]>;
  getPostings(filters: PostingFilters): Promise<Paginated<Posting>>;
  getPosting(postingNumber: string): Promise<Posting | null>;
  getReturns(filters: ReturnFilters): Promise<Paginated<ReturnRecord>>;
  getAnalytics(filters: AnalyticsFilters): Promise<AnalyticsDaily[]>;
  getFinanceTransactions(range: DateRange): Promise<FinanceTransaction[]>;
  getFinanceTotals(range: DateRange): Promise<FinanceTotals>;
  getDailyRealization(range: DateRange): Promise<RealizationDay[]>;
  getMonthlyRealization(): Promise<RealizationMonth[]>;
  getSyncRuns(): Promise<SyncRun[]>;
  getAiInsight(query: string, range: DateRange): Promise<AiInsight>;
}

// Gələcək backend üçün konfiqurasiya nöqtəsi. Yalnız gizli olmayan dəyər.
export const ERP_API_BASE_URL: string =
  (import.meta.env.VITE_ERP_API_BASE_URL as string | undefined) ?? '';
