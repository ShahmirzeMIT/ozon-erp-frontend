import { ConfigProvider } from 'antd';
import ru_RU from 'antd/locale/ru_RU';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/az';
import 'dayjs/locale/ru';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { AppStateProvider, useAppState } from './hooks/useAppState';
import { getAntdTheme } from './styles/theme';
import { AppLayout } from './layout/AppLayout';

import { OverviewPage } from './pages/Overview/OverviewPage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { ProductDetailPage } from './pages/Products/ProductDetailPage';
import { OrdersPage } from './pages/Orders/OrdersPage';
import { OrderDetailPage } from './pages/Orders/OrderDetailPage';
import { InventoryPage } from './pages/Inventory/InventoryPage';
import { ReturnsPage } from './pages/Returns/ReturnsPage';
import { FinancePage } from './pages/Finance/FinancePage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { AiAnalystPage } from './pages/AiAnalyst/AiAnalystPage';
import { AlertsPage } from './pages/Alerts/AlertsPage';
import { SyncPage } from './pages/Sync/SyncPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { AppErrorBoundary } from './components/AppErrorBoundary';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ru');
dayjs.tz.setDefault('Asia/Baku');

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function ThemedApp() {
  const { theme } = useAppState();
  return (
    <ConfigProvider locale={ru_RU} theme={getAntdTheme(theme)}>
      <BrowserRouter>
        <AppErrorBoundary>
          <Routes>
            <Route element={<AppLayout />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:postingNumber" element={<OrderDetailPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai" element={<AiAnalystPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppErrorBoundary>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateProvider>
        <ThemedApp />
      </AppStateProvider>
    </QueryClientProvider>
  );
}
