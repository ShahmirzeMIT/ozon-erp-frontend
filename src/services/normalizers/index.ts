import type {
  AnalyticsDaily,
  FinanceTotals,
  FinanceTransaction,
  InventorySnapshot,
  OverviewData,
  Posting,
  Product,
  RealizationDay,
  RealizationMonth,
  ReturnRecord,
  SyncRun,
  Warehouse,
} from '../../types';
import type { Paginated } from '../ErpDataSource';

/**
 * Normalizer qatı: Ozon-un xam JSON cavablarını (məs. `POST /v3/product/list`
 * cavabındakı `result.items`) bu faylın idxal etdiyi UI tiplərinə (məs.
 * `Product[]`) xəritələyir. Hazırda bu funksiyalar YALNIZ imza səviyyəsində
 * mövcuddur — backend qoşulanda hər birinin daxilini konkret Ozon sahə
 * adlarına uyğun yazın (bax: promptun sonundakı 16 endpoint kontraktı).
 *
 * Qayda: UI komponentləri heç vaxt Ozon-un `offer_id` / `product_id` /
 * `sku` sahə adlarını birbaşa görməməlidir — hər şey bu qatdan keçməlidir.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
export function normalizeProducts(_raw: unknown): Paginated<Product> {
  throw new Error('normalizeProducts: Ozon /v3/product/list cavabına uyğun yazılmalıdır');
}
export function normalizeProduct(_raw: unknown): Product {
  throw new Error('normalizeProduct: Ozon /v3/product/info/list cavabına uyğun yazılmalıdır');
}
export function normalizeOverview(_raw: unknown): OverviewData {
  throw new Error('normalizeOverview: bir neçə Ozon endpointinin backend tərəfində aqreqasiyasını tələb edir');
}
export function normalizeInventory(_raw: unknown): InventorySnapshot[] {
  throw new Error('normalizeInventory: /v2/analytics/stock_on_warehouses və /v4/product/info/stocks birləşdirilməlidir');
}
export function normalizeWarehouses(_raw: unknown): Warehouse[] {
  throw new Error('normalizeWarehouses: /v1/warehouse/list cavabına uyğun yazılmalıdır');
}
export function normalizePostings(_raw: unknown): Paginated<Posting> {
  throw new Error('normalizePostings: /v2/posting/fbo/list və /v3/posting/fbs/list birləşdirilməlidir');
}
export function normalizePosting(_raw: unknown): Posting {
  throw new Error('normalizePosting: /v2/posting/fbo/get və ya /v3/posting/fbs/get cavabına uyğun yazılmalıdır');
}
export function normalizeReturns(_raw: unknown): Paginated<ReturnRecord> {
  throw new Error('normalizeReturns: /v3/returns/company/fbs və /v2/returns/company/fbo birləşdirilməlidir');
}
export function normalizeAnalytics(_raw: unknown): AnalyticsDaily[] {
  throw new Error('normalizeAnalytics: backend tərəfində sifariş/qaytarma məlumatından aqreqasiya olunmalıdır');
}
export function normalizeFinanceTransactions(_raw: unknown): FinanceTransaction[] {
  throw new Error('normalizeFinanceTransactions: /v3/finance/transaction/list cavabına uyğun yazılmalıdır');
}
export function normalizeFinanceTotals(_raw: unknown): FinanceTotals {
  throw new Error('normalizeFinanceTotals: /v3/finance/transaction/totals cavabına uyğun yazılmalıdır');
}
export function normalizeRealizationDays(_raw: unknown): RealizationDay[] {
  throw new Error('normalizeRealizationDays: /v1/finance/realization/day cavabına uyğun yazılmalıdır');
}
export function normalizeRealizationMonths(_raw: unknown): RealizationMonth[] {
  throw new Error('normalizeRealizationMonths: /v2/finance/realization cavabına uyğun yazılmalıdır');
}
export function normalizeSyncRuns(_raw: unknown): SyncRun[] {
  throw new Error('normalizeSyncRuns: backend-in daxili job statuslarından formalaşdırılmalıdır');
}
/* eslint-enable @typescript-eslint/no-unused-vars */
