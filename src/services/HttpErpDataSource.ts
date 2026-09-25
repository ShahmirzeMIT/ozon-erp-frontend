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
import { ERP_API_BASE_URL } from './ErpDataSource';
import {
  normalizeAnalytics,
  normalizeFinanceTotals,
  normalizeFinanceTransactions,
  normalizeInventory,
  normalizeOverview,
  normalizePosting,
  normalizePostings,
  normalizeProduct,
  normalizeProducts,
  normalizeRealizationDays,
  normalizeRealizationMonths,
  normalizeReturns,
  normalizeSyncRuns,
  normalizeWarehouses,
} from './normalizers';

/**
 * BACKEND HAZIR OLANDA İSTİFADƏ ÜÇÜN.
 *
 * Bu sinif hazırda HEÇ BİR şəbəkə çağırışı ETMİR — Ozon Client-Id/Api-Key
 * idarəetməsi, cron, email və AI inteqrasiyası tamamilə backend
 * tərəfindədir. Backend hazır olanda hər metod öz REST endpoint-inizə
 * `fetch(`${ERP_API_BASE_URL}/...`)` sorğusu göndərəcək və cavabı
 * `src/services/normalizers` vasitəsilə bu faylın idxal etdiyi UI
 * modellərinə çevirəcək.
 *
 * `src/hooks/useDataSource.ts` faylında `mockErpDataSource`-i
 * `new HttpErpDataSource()` ilə əvəz etməklə keçid edilir; UI
 * komponentlərində HEÇ NƏ dəyişdirilmir.
 */
export class HttpErpDataSource implements ErpDataSource {
  private notImplemented(method: string): never {
    throw new Error(
      `HttpErpDataSource.${method} hələ qoşulmayıb. BASE_URL: ${ERP_API_BASE_URL || '(təyin edilməyib)'}. ` +
        'Backend hazır olduqda bu metodu öz endpoint-inizə fetch çağırışı ilə tamamlayın və normalizers qatından keçirin.',
    );
  }

  getOverview(_range: DateRange): Promise<OverviewData> {
    return this.notImplemented('getOverview');
    // Nümunə: const res = await fetch(`${ERP_API_BASE_URL}/overview?...`);
    // return normalizeOverview(await res.json());
  }
  getProducts(_filters: ProductFilters): Promise<Paginated<Product>> {
    return this.notImplemented('getProducts');
  }
  getProduct(_id: string): Promise<Product | null> {
    return this.notImplemented('getProduct');
  }
  getPrices(_productId: string): Promise<ProductPricePoint[]> {
    return this.notImplemented('getPrices');
  }
  getInventory(_filters: InventoryFilters): Promise<InventorySnapshot[]> {
    return this.notImplemented('getInventory');
  }
  getInventoryHistory(_productId: string): Promise<{ date: string; present: number }[]> {
    return this.notImplemented('getInventoryHistory');
  }
  getWarehouses(): Promise<Warehouse[]> {
    return this.notImplemented('getWarehouses');
  }
  getPostings(_filters: PostingFilters): Promise<Paginated<Posting>> {
    return this.notImplemented('getPostings');
  }
  getPosting(_postingNumber: string): Promise<Posting | null> {
    return this.notImplemented('getPosting');
  }
  getReturns(_filters: ReturnFilters): Promise<Paginated<ReturnRecord>> {
    return this.notImplemented('getReturns');
  }
  getAnalytics(_filters: AnalyticsFilters): Promise<AnalyticsDaily[]> {
    return this.notImplemented('getAnalytics');
  }
  getFinanceTransactions(_range: DateRange): Promise<FinanceTransaction[]> {
    return this.notImplemented('getFinanceTransactions');
  }
  getFinanceTotals(_range: DateRange): Promise<FinanceTotals> {
    return this.notImplemented('getFinanceTotals');
  }
  getDailyRealization(_range: DateRange): Promise<RealizationDay[]> {
    return this.notImplemented('getDailyRealization');
  }
  getMonthlyRealization(): Promise<RealizationMonth[]> {
    return this.notImplemented('getMonthlyRealization');
  }
  getSyncRuns(): Promise<SyncRun[]> {
    return this.notImplemented('getSyncRuns');
  }
  getAiInsight(_query: string, _range: DateRange): Promise<AiInsight> {
    return this.notImplemented('getAiInsight');
    // Nümunə: POST /api/ai/ask { query, range } -> backend Gemini-yə müraciət edir.
  }
}

void normalizeOverview;
void normalizeProducts;
void normalizeProduct;
void normalizeInventory;
void normalizeWarehouses;
void normalizePostings;
void normalizePosting;
void normalizeReturns;
void normalizeAnalytics;
void normalizeFinanceTransactions;
void normalizeFinanceTotals;
void normalizeRealizationDays;
void normalizeRealizationMonths;
void normalizeSyncRuns;
