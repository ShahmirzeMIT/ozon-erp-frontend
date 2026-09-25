import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  InputNumber,
  Switch,
  Input,
  TimePicker,
  Empty,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined, StarFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { DemoTag } from '../../components/DemoTag';
import { DemoPreferencesStore } from '../../services/DemoPreferencesStore';
import { useWatchlist } from '../../hooks/useWatchlist';
import { getMockDataset } from '../../data/mock';
import type { AlertRule, AlertRuleType, EmailFrequency, EmailSubscription } from '../../types';

const RULE_TYPE_LABEL: Record<AlertRuleType, string> = {
  low_stock: 'Малый остаток (шт.)',
  sales_drop_pct: 'Снижение продаж (%)',
  return_rate_pct: 'Доля возвратов (%)',
  sync_failed: 'Ошибка синхронизации',
};

export function AlertsPage() {
  const [watchlist] = useWatchlist();
  const dataset = getMockDataset();
  const [rules, setRules] = useState<AlertRule[]>(() => DemoPreferencesStore.getAlertRules());
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [emailForm] = Form.useForm<EmailSubscription>();
  const [emailSub, setEmailSub] = useState<EmailSubscription>(() => DemoPreferencesStore.getEmailSubscription());

  const watchedProducts = dataset.products.filter((p) => watchlist.includes(p.productId));

  const persistRules = (next: AlertRule[]) => {
    setRules(next);
    DemoPreferencesStore.saveAlertRules(next);
  };

  const addRule = (values: {
    type: AlertRuleType;
    productId?: string;
    threshold: number;
    periodDays: number;
    cooldownHours: number;
  }) => {
    const rule: AlertRule = {
      id: `RULE-${Date.now()}`,
      type: values.type,
      productId: values.type === 'sync_failed' ? null : values.productId ?? null,
      threshold: values.threshold,
      periodDays: values.periodDays,
      active: true,
      cooldownHours: values.cooldownHours,
      lastTriggeredAt: null,
      createdAt: new Date().toISOString(),
    };
    persistRules([...rules, rule]);
    setModalOpen(false);
    form.resetFields();
    message.success('Правило оповещения добавлено (сохраняется только на этом устройстве)');
  };

  const removeRule = (id: string) => {
    persistRules(rules.filter((r) => r.id !== id));
  };

  const toggleRuleActive = (id: string) => {
    persistRules(rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const saveEmail = (values: EmailSubscription & { hourDayjs?: dayjs.Dayjs }) => {
    const { hourDayjs, ...rest } = values;
    const next: EmailSubscription = {
      ...emailSub,
      ...rest,
      watchedProductIds: watchlist,
      hour: hourDayjs ? hourDayjs.hour() : emailSub.hour,
    };
    setEmailSub(next);
    DemoPreferencesStore.saveEmailSubscription(next);
    message.success('Настройки email-уведомлений сохранены (демо — письма не отправляются)');
  };

  return (
    <div>
      <Card
        size="small"
        className="section-card"
        title="Избранные товары"
        extra={<DemoTag label="Хранится только на этом устройстве" />}
      >
        {watchedProducts.length === 0 ? (
          <Empty description="Избранных товаров пока нет. Нажмите на звезду на странице товаров." />
        ) : (
          <Space wrap>
            {watchedProducts.map((p) => (
              <Tag key={p.productId} icon={<StarFilled style={{ color: '#f0a020' }} />}>
                <Link to={`/products/${p.productId}`}>{p.name}</Link>
              </Tag>
            ))}
          </Space>
        )}
      </Card>

      <Card
        size="small"
        className="section-card"
        title="Правила оповещений"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Новое правило
          </Button>
        }
      >
        <Table
          size="small"
          rowKey="id"
          dataSource={rules}
          locale={{ emptyText: <Empty description="Правил оповещений пока нет" /> }}
          pagination={false}
          columns={[
            { title: 'Tip', dataIndex: 'type', render: (v: AlertRuleType) => RULE_TYPE_LABEL[v] },
            {
              title: 'Товар',
              dataIndex: 'productId',
              render: (v: string | null) =>
                v ? (
                  <Link to={`/products/${v}`}>{dataset.products.find((p) => p.productId === v)?.name}</Link>
                ) : (
                  '— (вся система)'
                ),
            },
            { title: 'Порог', dataIndex: 'threshold' },
            { title: 'Период (дни)', dataIndex: 'periodDays' },
            { title: 'Пауза (часы)', dataIndex: 'cooldownHours' },
            {
              title: 'Активно',
              dataIndex: 'active',
              render: (v: boolean, r) => <Switch checked={v} size="small" onChange={() => toggleRuleActive(r.id)} />,
            },
            {
              title: '',
              render: (_: unknown, r) => (
                <Popconfirm title="Qayda silinsin?" onConfirm={() => removeRule(r.id)}>
                  <Button danger type="text" icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
            },
          ]}
        />
      </Card>

      <Card size="small" className="section-card" title="Подписка на email-уведомления" extra={<DemoTag label="Email не отправляется" />}>
        <Form
          form={emailForm}
          layout="vertical"
          initialValues={{ ...emailSub, hourDayjs: dayjs().hour(emailSub.hour).minute(0) }}
          onFinish={saveEmail}
        >
          <Space wrap align="start" size={24}>
            <Form.Item name="recipient" label="Email получателя" rules={[{ type: 'email', message: 'Введите корректный email' }]}>
              <Input placeholder="siz@example.com" style={{ width: 240 }} />
            </Form.Item>
            <Form.Item name="frequency" label="Частота">
              <Select
                style={{ width: 160 }}
                options={
                  [
                    { value: 'daily', label: 'Ежедневно' },
                    { value: 'weekly', label: 'Еженедельно' },
                  ] as { value: EmailFrequency; label: string }[]
                }
              />
            </Form.Item>
            <Form.Item name="hourDayjs" label="Время (Asia/Baku)">
              <TimePicker format="HH:00" />
            </Form.Item>
            <Form.Item name="metrics" label="Показатели в письме">
              <Select
                mode="multiple"
                style={{ width: 280 }}
                options={[
                  { value: 'sales', label: 'Продажи' },
                  { value: 'stock', label: 'Остатки' },
                  { value: 'returns', label: 'Возвраты' },
                  { value: 'alerts', label: 'Оповещения' },
                ]}
              />
            </Form.Item>
            <Form.Item name="includeAiSummary" label="Добавлять сводку AI" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="active" label="Активно" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Сохранить
            </Button>
          </Form.Item>
        </Form>
        <div className="muted">
          Избранных товаров: {watchlist.length}. Уведомления формируются только по избранным товарам (в демо не отправляются).
        </div>
      </Card>

      <Modal
        title="Новое правило оповещения"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Добавить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={addRule} initialValues={{ periodDays: 7, cooldownHours: 24, threshold: 10 }}>
          <Form.Item name="type" label="Тип оповещения" rules={[{ required: true }]}> 
            <Select options={Object.entries(RULE_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item shouldUpdate={(prev, cur) => prev.type !== cur.type} noStyle>
            {({ getFieldValue }) =>
              getFieldValue('type') && getFieldValue('type') !== 'sync_failed' ? (
                <Form.Item name="productId" label="Товар" rules={[{ required: true, message: 'Выберите товар' }]}> 
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={dataset.products.map((p) => ({ value: p.productId, label: p.name }))}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="threshold" label="Порог" rules={[{ required: true }]}> 
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="periodDays" label="Период (дни)" rules={[{ required: true }]}> 
            <InputNumber min={1} max={90} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cooldownHours" label="Пауза между уведомлениями (часы)" rules={[{ required: true }]}> 
            <InputNumber min={1} max={168} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
