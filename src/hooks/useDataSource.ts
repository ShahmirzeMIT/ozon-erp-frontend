import type { ErpDataSource } from '../services/ErpDataSource';
import { mockErpDataSource } from '../services/MockErpDataSource';

// Backend hazır olanda bu sətri `new HttpErpDataSource()` ilə əvəz edin.
// UI komponentləri `ErpDataSource` interfeysinə bağlı olduğu üçün
// heç bir başqa dəyişiklik tələb olunmur.
const activeDataSource: ErpDataSource = mockErpDataSource;

export function useDataSource(): ErpDataSource {
  return activeDataSource;
}
