import { Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  RollbackOutlined,
  DollarOutlined,
  LineChartOutlined,
  RobotOutlined,
  BellOutlined,
  SyncOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'overview' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'products' },
  { key: '/orders', icon: <FileTextOutlined />, label: 'orders' },
  { key: '/inventory', icon: <DatabaseOutlined />, label: 'inventory' },
  { key: '/returns', icon: <RollbackOutlined />, label: 'returns' },
  { key: '/finance', icon: <DollarOutlined />, label: 'finance' },
  { key: '/analytics', icon: <LineChartOutlined />, label: 'analytics' },
  { key: '/ai', icon: <RobotOutlined />, label: 'ai' },
  { key: '/alerts', icon: <BellOutlined />, label: 'alerts' },
  { key: '/sync', icon: <SyncOutlined />, label: 'sync' },
  { key: '/settings', icon: <SettingOutlined />, label: 'settings' },
];

export function SidebarMenu({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const selectedKey =
    ITEMS.find((i) => i.key !== '/' && location.pathname.startsWith(i.key))?.key ??
    (location.pathname === '/' ? '/' : '/');

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={ITEMS.map((item) => ({ ...item, label: t(item.label) }))}
      style={{ background: 'transparent', borderInlineEnd: 'none' }}
      onClick={({ key }) => {
        navigate(key);
        onNavigate?.();
      }}
    />
  );
}

export const NAV_ITEMS = ITEMS;
