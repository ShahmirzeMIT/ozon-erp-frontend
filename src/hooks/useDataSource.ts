import type { ErpDataSource } from '../services/ErpDataSource';
import { HttpErpDataSource } from '../services/HttpErpDataSource';

// Tətbiq yalnız lokal backend-dən gələn real Ozon cache məlumatından istifadə edir.
const activeDataSource: ErpDataSource = new HttpErpDataSource();

export function useDataSource(): ErpDataSource {
  return activeDataSource;
}
