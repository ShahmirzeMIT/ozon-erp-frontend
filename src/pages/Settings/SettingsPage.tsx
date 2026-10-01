import { Card, Switch, Space, Descriptions, Button, Popconfirm, message, Alert, Input, Tooltip, Select } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useAppState } from '../../hooks/useAppState';
import { DemoPreferencesStore } from '../../services/DemoPreferencesStore';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { theme, toggleTheme, storeName } = useAppState();
  const { t, i18n } = useTranslation();

  const resetDemoData = () => {
    DemoPreferencesStore.resetAll();
        message.success('Lokal ayarlar sıfırlandı. Səhifə yenilənir...');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="section-card"
        message="Bu ERP real rejimdə frontend və backend ilə işləyir"
        description="Ozon Client-Id və Api-Key yalnız backend-də saxlanılır. Məxfi açarlar bu səhifədə tələb olunmur və saxlanılmır."
      />

      <Card size="small" className="section-card" title={t('appearance')}>
        <Space>
          <span>{t('darkTheme')}</span>
          <Switch checked={theme === 'dark'} onChange={toggleTheme} />
        </Space>
        <Space style={{ marginInlineStart: 24 }}>
          <span>{t('language')}</span>
          <Select
            value={i18n.language === 'az' ? 'az' : 'ru'}
            onChange={(language: 'az' | 'ru') => {
              DemoPreferencesStore.setLanguage(language);
              void i18n.changeLanguage(language);
            }}
            options={[
              { value: 'az', label: t('azerbaijani') },
              { value: 'ru', label: t('russian') },
            ]}
            style={{ width: 180 }}
          />
        </Space>
      </Card>

      <Card size="small" className="section-card" title="Mağaza məlumatları (yalnız oxu)">
        <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Mağaza">{storeName}</Descriptions.Item>
        <Descriptions.Item label="Valyuta">RUB (₽)</Descriptions.Item>
        <Descriptions.Item label="Saat qurşağı">Asia/Baku</Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                Ozon Client-Id{' '}
              <Tooltip title="Təhlükəsizlik üçün açarlar yalnız backend-də saxlanılmalıdır">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
          >
            <Input.Password value="••••••••••••" disabled style={{ maxWidth: 240 }} />
          </Descriptions.Item>
          <Descriptions.Item label="Ozon Api-Key">
            <Input.Password value="••••••••••••" disabled style={{ maxWidth: 240 }} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" className="section-card" title="Lokal ayarları sıfırla">
        <p className="muted">
          Seçilmiş məhsullar, bildiriş qaydaları, e-poçt abunəliyi, maya dəyəri dəyişiklikləri və mövzu
          bu cihazın brauzerində saxlanılır. Aşağıdakı düymə bu məlumatları silir.
        </p>
        <Popconfirm title="Bütün lokal ayarlar silinsin?" onConfirm={resetDemoData} okText="Bəli, sıfırla" cancelText="Ləğv et">
          <Button danger>Lokal ayarları sıfırla</Button>
        </Popconfirm>
      </Card>
    </div>
  );
}
