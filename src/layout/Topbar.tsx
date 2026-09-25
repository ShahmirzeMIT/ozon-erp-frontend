import { Avatar, Badge, Button, Dropdown, Space, DatePicker, Grid } from 'antd';
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppState } from '../hooks/useAppState';
import { DemoTag } from '../components/DemoTag';

const { useBreakpoint } = Grid;

export function Topbar() {
  const { dateRange, setDateRange, theme, toggleTheme, storeName, setMobileMenuOpen } = useAppState();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        padding: '0 16px',
        borderBottom: '1px solid var(--border-soft)',
        background: 'var(--surface-card)',
        gap: 12,
      }}
    >
      <Space size={12}>
        {isMobile && (
          <Button icon={<MenuOutlined />} type="text" onClick={() => setMobileMenuOpen(true)} aria-label="Menyu" />
        )}
        <DemoTag />
        {!isMobile && <span style={{ fontWeight: 600 }}>{storeName}</span>}
      </Space>

      <Space size={12} wrap>
        {!isMobile && (
          <DatePicker.RangePicker
            value={[dayjs(dateRange.start), dayjs(dateRange.end)]}
            allowClear={false}
            onChange={(vals) => {
              if (vals && vals[0] && vals[1]) {
                setDateRange({ start: vals[0].format('YYYY-MM-DD'), end: vals[1].format('YYYY-MM-DD') });
              }
            }}
          />
        )}
        <Button
          shape="circle"
          type="text"
          aria-label="Tema"
          icon={theme === 'light' ? <BulbOutlined /> : <BulbFilled />}
          onClick={toggleTheme}
        />
        <Badge count={3} size="small">
            <Button shape="circle" type="text" icon={<BellOutlined />} aria-label="Уведомления" />
        </Badge>
        <Dropdown
          menu={{
            items: [
              { key: 'profile', label: 'Profil' },
              { key: 'logout', label: 'Backend не подключён', disabled: true },
            ],
          }}
        >
          <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer', background: 'var(--brand-blue)' }} />
        </Dropdown>
      </Space>
    </div>
  );
}
