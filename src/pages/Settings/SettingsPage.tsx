import { Card, Switch, Space, Descriptions, Button, Popconfirm, message, Alert, Input, Tooltip, Select } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useAppState } from '../../hooks/useAppState';
import { DemoPreferencesStore } from '../../services/DemoPreferencesStore';
import { DemoTag } from '../../components/DemoTag';
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { theme, toggleTheme, storeName } = useAppState();
  const { t, i18n } = useTranslation();

  const resetDemoData = () => {
    DemoPreferencesStore.resetAll();
    message.success('Демо-настройки сброшены. Страница перезагружается...');
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div>
      <Alert
        type="info"
        showIcon
        className="section-card"
        message="Эта ERP работает в демо-режиме только на frontend"
        description="Ozon Client-Id / Api-Key, планирование cron, отправка email и интеграция AI (Gemini) будут выполняться только на backend. Секретные ключи на этой странице не запрашиваются и не сохраняются."
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

      <Card size="small" className="section-card" title="Данные магазина (демо, только чтение)">
        <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Магазин">{storeName}</Descriptions.Item>
        <Descriptions.Item label="Валюта">RUB (₽)</Descriptions.Item>
        <Descriptions.Item label="Часовой пояс">Asia/Baku</Descriptions.Item>
          <Descriptions.Item
            label={
              <span>
                Ozon Client-Id{' '}
                <Tooltip title="В целях безопасности ключи должны храниться только на backend">
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

      <Card size="small" className="section-card" title="Сбросить демо-данные" extra={<DemoTag label="Только это устройство" />}>
        <p className="muted">
          Избранные товары, правила оповещений, подписка на email, изменения себестоимости и тема хранятся в
          браузере этого устройства (localStorage). Кнопка ниже удаляет эти данные и возвращает демо-набор в исходное состояние.
        </p>
        <Popconfirm title="Удалить все демо-настройки?" onConfirm={resetDemoData} okText="Да, сбросить" cancelText="Отмена">
          <Button danger>Сбросить демо-настройки</Button>
        </Popconfirm>
      </Card>
    </div>
  );
}
