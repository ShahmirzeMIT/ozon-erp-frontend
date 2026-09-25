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

const ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'Обзор' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Товары' },
  { key: '/orders', icon: <FileTextOutlined />, label: 'Заказы' },
  { key: '/inventory', icon: <DatabaseOutlined />, label: 'Склад и остатки' },
  { key: '/returns', icon: <RollbackOutlined />, label: 'Возвраты' },
  { key: '/finance', icon: <DollarOutlined />, label: 'Финансы' },
  { key: '/analytics', icon: <LineChartOutlined />, label: 'Аналитика' },
  { key: '/ai', icon: <RobotOutlined />, label: 'AI-аналитик' },
  { key: '/alerts', icon: <BellOutlined />, label: 'Оповещения и email' },
  { key: '/sync', icon: <SyncOutlined />, label: 'Синхронизация' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Настройки' },
];

export function SidebarMenu({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey =
    ITEMS.find((i) => i.key !== '/' && location.pathname.startsWith(i.key))?.key ??
    (location.pathname === '/' ? '/' : '/');

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={ITEMS}
      style={{ background: 'transparent', borderInlineEnd: 'none' }}
      onClick={({ key }) => {
        navigate(key);
        onNavigate?.();
      }}
    />
  );
}

export const NAV_ITEMS = ITEMS;
