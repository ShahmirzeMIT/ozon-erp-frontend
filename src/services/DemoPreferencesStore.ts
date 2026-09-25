import type { AlertRule, EmailSubscription } from '../types';

/**
 * Bütün "demo əməliyyatları" YALNIZ bu cihazın localStorage-ında saxlanır.
 * Backend hazır olanda bu store'un yerini müvafiq API çağırışları tutacaq,
 * lakin indi heç bir şəbəkə sorğusu göndərilmir.
 */

const KEYS = {
  watchlist: 'ozon-erp-demo:watchlist',
  alertRules: 'ozon-erp-demo:alert-rules',
  emailSubscription: 'ozon-erp-demo:email-subscription',
  costOverrides: 'ozon-erp-demo:cost-overrides',
  theme: 'ozon-erp-demo:theme',
  language: 'ozon-erp-demo:language',
  syncDemoMode: 'ozon-erp-demo:sync-demo-mode',
  syncOverrideTimestamps: 'ozon-erp-demo:sync-timestamps',
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage əlçatan deyilsə (məs. private mode) sükutla keç
  }
}

export type SyncDemoMode = 'normal' | 'empty' | 'all_error';

export const DemoPreferencesStore = {
  getWatchlist(): string[] {
    return readJson<string[]>(KEYS.watchlist, []);
  },
  toggleWatch(productId: string): string[] {
    const cur = new Set(this.getWatchlist());
    if (cur.has(productId)) cur.delete(productId);
    else cur.add(productId);
    const next = Array.from(cur);
    writeJson(KEYS.watchlist, next);
    return next;
  },
  isWatched(productId: string): boolean {
    return this.getWatchlist().includes(productId);
  },

  getAlertRules(): AlertRule[] {
    return readJson<AlertRule[]>(KEYS.alertRules, []);
  },
  saveAlertRules(rules: AlertRule[]): void {
    writeJson(KEYS.alertRules, rules);
  },

  getEmailSubscription(): EmailSubscription {
    return readJson<EmailSubscription>(KEYS.emailSubscription, {
      recipient: '',
      watchedProductIds: [],
      frequency: 'daily',
      hour: 9,
      timezone: 'Asia/Baku',
      metrics: ['sales', 'stock', 'returns'],
      includeAiSummary: true,
      active: false,
    });
  },
  saveEmailSubscription(sub: EmailSubscription): void {
    writeJson(KEYS.emailSubscription, sub);
  },

  getCostOverrides(): Record<string, number | null> {
    return readJson<Record<string, number | null>>(KEYS.costOverrides, {});
  },
  setCostOverride(productId: string, cost: number | null): void {
    const cur = this.getCostOverrides();
    cur[productId] = cost;
    writeJson(KEYS.costOverrides, cur);
  },

  getTheme(): 'light' | 'dark' {
    return readJson<'light' | 'dark'>(KEYS.theme, 'light');
  },
  setTheme(theme: 'light' | 'dark'): void {
    writeJson(KEYS.theme, theme);
  },

  getLanguage(): 'az' | 'ru' {
    return readJson<'az' | 'ru'>(KEYS.language, 'az');
  },
  setLanguage(language: 'az' | 'ru'): void {
    writeJson(KEYS.language, language);
  },

  getSyncDemoMode(): SyncDemoMode {
    return readJson<SyncDemoMode>(KEYS.syncDemoMode, 'normal');
  },
  setSyncDemoMode(mode: SyncDemoMode): void {
    writeJson(KEYS.syncDemoMode, mode);
  },

  getSyncOverrideTimestamp(): string | null {
    return readJson<string | null>(KEYS.syncOverrideTimestamps, null);
  },
  setSyncOverrideTimestamp(iso: string): void {
    writeJson(KEYS.syncOverrideTimestamps, iso);
  },

  resetAll(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
