import { Layout, Drawer, Breadcrumb, Grid } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarMenu, NAV_ITEMS } from './SidebarMenu';
import { Topbar } from './Topbar';
import { useAppState } from '../hooks/useAppState';
import { useTranslation } from 'react-i18next';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

function useCurrentTitle(): string {
  const location = useLocation();
  const { t } = useTranslation();
  const match = NAV_ITEMS.find((i) => (i.key === '/' ? location.pathname === '/' : location.pathname.startsWith(i.key)));
  return (match?.label as string) ?? t('overview');
}

export function AppLayout() {
  const { sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useAppState();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const title = useCurrentTitle();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          width={232}
          style={{ background: 'var(--navy-900)' }}
        >
          <div
            style={{
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {sidebarCollapsed ? 'OZ' : 'Ozon ERP'}
          </div>
          <SidebarMenu />
        </Sider>
      )}

      {isMobile && (
        <Drawer
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          styles={{ body: { padding: 0, background: 'var(--navy-900)' } }}
          width={240}
          closable={false}
        >
          <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
            Ozon ERP
          </div>
          <SidebarMenu onNavigate={() => setMobileMenuOpen(false)} />
        </Drawer>
      )}

      <Layout>
        <Topbar />
        <Content style={{ padding: 20 }}>
          <Breadcrumb
            items={[{ title: 'Ozon ERP' }, { title }]}
            style={{ marginBottom: 8 }}
          />
          <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>{title}</h2>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
