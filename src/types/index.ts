// Bütün domen tipləri. UI komponentləri yalnız bu tiplərdən istifadə edir;
// Ozon-un xam JSON formatı ilə birbaşa işləmir (bax: src/services/normalizers).

export type FulfilmentType = 'FBO' | 'FBS';

export type ProductStatus = 'active' | 'archived' | 'low_stock' | 'out_of_stock';

export interface Product {
  productId: string; // Ozon product_id
  offerId: string; // Ozon offer_id (satıcı SKU-su)
  sku: string; // Ozon sku (FBO/FBS anbar identifikatoru)
  name: string;
  category: string;
  imageEmoji: string; // demo üçün ikon
  status: ProductStatus;
  currentPrice: number;
  currency: 'RUB';
  costPrice: number | null; // null => "Maya dəyəri daxil edilməyib"
  fboStock: number;
  fbsStock: number;
  orders7d: number;
  orders30d: number;
  returnRatePct: number; // 0-100
  isWatched: boolean;
}

export interface ProductPricePoint {
  date: string; // ISO
  productId: string;
  price: number;
}

export interface Warehouse {
  warehouseId: string;
  name: string;
  type: FulfilmentType;
  region: string;
}

export interface InventorySnapshot {
  date: string; // ISO
  productId: string;
  warehouseId: string;
  type: FulfilmentType;
  present: number;
  reserved: number;
  available: number; // present - reserved
}

export type PostingStatus =
  | 'awaiting_packaging'
  | 'awaiting_deliver'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface PostingItem {
  productId: string;
  offerId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Posting {
  postingNumber: string;
  orderNumber: string;
  type: FulfilmentType;
  status: PostingStatus;
  createdAt: string; // ISO
  warehouseId: string;
  items: PostingItem[];
  orderedUnits: number; // = sum(items.quantity) — sifariş edilmiş vahid, satış deyil
  amount: number; // sifariş məbləği
}

export type ReturnReason =
  | 'defect'
  | 'wrong_item'
  | 'not_needed'
  | 'size_mismatch'
  | 'other';

export type ReturnStatus = 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';

export interface ReturnRecord {
  returnId: string;
  postingNumber: string;
  productId: string;
  sku: string;
  type: FulfilmentType;
  reason: ReturnReason;
  status: ReturnStatus;
  amount: number;
  createdAt: string; // ISO
}

export type FinanceTransactionType =
  | 'sale'
  | 'commission'
  | 'delivery'
  | 'return'
  | 'other_service';

export interface FinanceTransaction {
  transactionId: string;
  date: string; // ISO
  postingNumber: string | null;
  type: FinanceTransactionType;
  category: string;
  amount: number; // müsbət/mənfi RUB
}

export interface FinanceTotals {
  rangeStart: string;
  rangeEnd: string;
  saleAmount: number; // sifariş məbləği (naxod)
  commission: number;
  delivery: number;
  otherServices: number;
  returns: number;
  payout: number; // ödəniləcək məbləğ (realizasiya deyil, sifariş məbləği deyil)
}

export interface RealizationDay {
  date: string;
  saleAmount: number;
  commission: number;
  delivery: number;
  payout: number;
}

export interface RealizationMonth {
  month: string; // YYYY-MM
  saleAmount: number;
  commission: number;
  delivery: number;
  payout: number;
  reconciled: boolean;
}

export interface AnalyticsDaily {
  date: string;
  orders: number;
  orderedUnits: number;
  saleAmount: number;
  returns: number;
  fbo: number;
  fbs: number;
}

export interface ProductDailyMetrics {
  date: string;
  productId: string;
  orderedUnits: number;
  saleAmount: number;
  returns: number;
}

export type SyncStatus = 'success' | 'partial' | 'error';

export interface SyncRun {
  endpointId: number;
  endpointName: string;
  path: string;
  lastSuccessAt: string | null;
  latestRunAt: string;
  status: SyncStatus;
  objectsFetched: number;
  latencyMs: number;
  message: string;
  page: string; // hansı frontend səhifəsini doldurur
}

export type AlertRuleType =
  | 'low_stock'
  | 'sales_drop_pct'
  | 'return_rate_pct'
  | 'sync_failed';

export interface AlertRule {
  id: string;
  type: AlertRuleType;
  productId: string | null; // sync_failed üçün null ola bilər
  threshold: number;
  periodDays: number;
  active: boolean;
  cooldownHours: number;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export type EmailFrequency = 'daily' | 'weekly';

export interface EmailSubscription {
  recipient: string;
  watchedProductIds: string[];
  frequency: EmailFrequency;
  hour: number; // 0-23
  timezone: string;
  metrics: Array<'sales' | 'stock' | 'returns' | 'alerts'>;
  includeAiSummary: boolean;
  active: boolean;
}

export interface AiInsight {
  query: string;
  answer: string;
  method: string; // hansı hesablama metodundan istifadə olundu
  rangeStart: string;
  rangeEnd: string;
  sourcedProductIds: string[];
  isDemo: true;
  generatedAt: string;
}

export interface DateRange {
  start: string; // ISO date (YYYY-MM-DD)
  end: string;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus[];
  warehouseType?: FulfilmentType[];
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortField?: keyof Product;
  sortOrder?: 'ascend' | 'descend';
}

export interface PostingFilters {
  type?: FulfilmentType;
  status?: PostingStatus[];
  productId?: string;
  range?: DateRange;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ReturnFilters {
  range?: DateRange;
  sku?: string;
  type?: FulfilmentType;
  reason?: ReturnReason[];
  status?: ReturnStatus[];
  page?: number;
  pageSize?: number;
}

export interface InventoryFilters {
  warehouseId?: string;
  type?: FulfilmentType;
  criticalOnly?: boolean;
  criticalDaysThreshold?: number; // default 7
}

export interface AnalyticsFilters {
  range: DateRange;
  type?: FulfilmentType;
  productId?: string;
  warehouseId?: string;
}

export interface OverviewData {
  range: DateRange;
  kpis: {
    ordersCount: number;
    orderedUnits: number;
    saleAmount: number;
    returnedAmount: number;
    commissionAndServiceCost: number;
    netPayout: number;
    criticalStockCount: number;
  };
  trend: AnalyticsDaily[];
  fboFbsSplit: { type: FulfilmentType; orderedUnits: number }[];
  topProducts: { productId: string; name: string; orderedUnits: number }[];
  criticalAlerts: { productId: string; name: string; message: string }[];
  recentPostings: Posting[];
  lastSync: SyncRun[];
}
