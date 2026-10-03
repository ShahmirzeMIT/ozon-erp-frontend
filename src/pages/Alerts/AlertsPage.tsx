import { useEffect, useState } from 'react';
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
import { DemoPreferencesStore } from '../../services/DemoPreferencesStore';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useDataSource } from '../../hooks/useDataSource';
import { useQuery } from '@tanstack/react-query';
import type { AlertRule, AlertRuleType, AlertSchedule } from '../../types';

const RULE_TYPE_LABEL: Record<AlertRuleType, string> = {
  low_stock: 'Az qalıq (ədəd)',
  sales_drop_pct: 'Satışların azalması (%)',
  return_rate_pct: 'Qaytarma faizi (%)',
  sync_failed: 'Sinxronizasiya xətası',
};

export function AlertsPage() {
  const [watchlist] = useWatchlist();
  const ds = useDataSource();
  const { data: productPage } = useQuery({ queryKey: ['alerts-products'], queryFn: () => ds.getProducts({ page: 1, pageSize: 10000 }) });
  const { data: scheduleData } = useQuery({ queryKey: ['alert-schedule'], queryFn: () => ds.getAlertSchedule() });
  const products = productPage?.items ?? [];
  const [rules, setRules] = useState<AlertRule[]>(() => DemoPreferencesStore.getAlertRules());
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [emailForm] = Form.useForm<AlertSchedule & { hourDayjs?: dayjs.Dayjs }>();
  const [schedule, setSchedule] = useState<AlertSchedule>({
    active: false,
    email: '',
    telegram: '',
    hour: 9,
    minute: 0,
    timezone: 'Asia/Baku',
    prompt: 'Dünən nə qədər satış oldu və əvvəlki günlə müqayisədə nəticə necədir?',
    includeAiSummary: true,
    metrics: ['sales', 'stock', 'returns'],
    lastSentDate: null,
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!scheduleData) return;
    setSchedule(scheduleData);
    emailForm.setFieldsValue({ ...scheduleData, hourDayjs: dayjs().hour(scheduleData.hour).minute(scheduleData.minute) });
  }, [emailForm, scheduleData]);

  const watchedProducts = products.filter((p) => watchlist.includes(p.productId));

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
    message.success('Bildiriş qaydası əlavə edildi (yalnız bu cihazda saxlanılır)');
  };

  const removeRule = (id: string) => {
    persistRules(rules.filter((r) => r.id !== id));
  };

  const toggleRuleActive = (id: string) => {
    persistRules(rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const saveEmail = async (values: AlertSchedule & { hourDayjs?: dayjs.Dayjs }) => {
    const { hourDayjs, ...rest } = values;
    const next: AlertSchedule = {
      ...schedule,
      ...rest,
      hour: hourDayjs ? hourDayjs.hour() : schedule.hour,
      minute: hourDayjs ? hourDayjs.minute() : schedule.minute,
    };
    try {
      const saved = await ds.saveAlertSchedule(next);
      setSchedule(saved);
      message.success('Gündəlik AI bildirişi saxlanıldı');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Bildiriş ayarları saxlanılmadı');
    }
  };

  const testSchedule = async () => {
    setTesting(true);
    try {
      const result = await ds.testAlertSchedule();
      if (result.errors?.length) message.warning(result.errors.join(' | '));
      else message.success('Test bildirişi göndərildi');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Test bildirişi göndərilmədi');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <Card
        size="small"
        className="section-card"
        title="İzlənilən məhsullar"
      >
        {watchedProducts.length === 0 ? (
          <Empty description="Hələ izlənilən məhsul yoxdur. Məhsullar səhifəsində ulduz işarəsinə klikləyin." />
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
        title="Bildiriş qaydaları"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Yeni qayda
          </Button>
        }
      >
        <Table
          size="small"
          rowKey="id"
          dataSource={rules}
          locale={{ emptyText: <Empty description="Hələ bildiriş qaydası yoxdur" /> }}
          pagination={false}
          columns={[
            { title: 'Tip', dataIndex: 'type', render: (v: AlertRuleType) => RULE_TYPE_LABEL[v] },
            {
              title: 'Məhsul',
              dataIndex: 'productId',
              render: (v: string | null) =>
                v ? (
                  <Link to={`/products/${v}`}>{products.find((p) => p.productId === v)?.name ?? v}</Link>
                ) : (
                  '— (bütün sistem)'
                ),
            },
            { title: 'Hədd', dataIndex: 'threshold' },
            { title: 'Dövr (gün)', dataIndex: 'periodDays' },
            { title: 'Fasilə (saat)', dataIndex: 'cooldownHours' },
            {
              title: 'Aktiv',
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

      <Card size="small" className="section-card" title="E-poçt bildirişləri">
        <Form
          form={emailForm}
          layout="vertical"
          initialValues={{ ...schedule, hourDayjs: dayjs().hour(schedule.hour).minute(schedule.minute) }}
          onFinish={saveEmail}
        >
          <Space wrap align="start" size={24}>
            <Form.Item name="email" label="Qəbul edənin e-poçtu" rules={[{ type: 'email', message: 'Düzgün e-poçt ünvanı daxil edin' }]}> 
              <Input placeholder="siz@example.com" style={{ width: 240 }} />
            </Form.Item>
            <Form.Item name="telegram" label="Telegram chat ID" extra="Botu Telegram-da /start etdikdən sonra chat ID-ni yazın">
              <Input placeholder="Məsələn: 123456789" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="hourDayjs" label="Hər gün göndərilmə vaxtı (Asia/Baku)">
              <TimePicker format="HH:mm" minuteStep={5} />
            </Form.Item>
            <Form.Item name="metrics" label="E-poçtda göstəriləcək göstəricilər">
              <Select
                mode="multiple"
                style={{ width: 280 }}
                options={[
                  { value: 'sales', label: 'Satışlar' },
                  { value: 'stock', label: 'Qalıqlar' },
                  { value: 'returns', label: 'Qaytarmalar' },
                  { value: 'alerts', label: 'Bildirişlər' },
                ]}
              />
            </Form.Item>
            <Form.Item name="includeAiSummary" label="AI xülasəsi əlavə edilsin" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="active" label="Aktiv" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="prompt" label="AI analiz sualı">
            <Input.TextArea rows={2} placeholder="Məsələn: Dünən nə qədər satış oldu və əvvəlki günlə müqayisədə necə dəyişdi?" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Yadda saxla</Button>
              <Button onClick={testSchedule} loading={testing}>İndi test göndər</Button>
            </Space>
          </Form.Item>
        </Form>
        <div className="muted">
          Hesabat hər gün seçilmiş saatda backend tərəfindən hazırlanır. Son göndəriş: {schedule.lastSentDate || 'hələ yoxdur'}.
        </div>
      </Card>

      <Modal
        title="Yeni bildiriş qaydası"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Əlavə et"
        cancelText="Ləğv et"
      >
        <Form form={form} layout="vertical" onFinish={addRule} initialValues={{ periodDays: 7, cooldownHours: 24, threshold: 10 }}>
          <Form.Item name="type" label="Bildiriş növü" rules={[{ required: true }]}> 
            <Select options={Object.entries(RULE_TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item shouldUpdate={(prev, cur) => prev.type !== cur.type} noStyle>
            {({ getFieldValue }) =>
              getFieldValue('type') && getFieldValue('type') !== 'sync_failed' ? (
                <Form.Item name="productId" label="Məhsul" rules={[{ required: true, message: 'Məhsul seçin' }]}> 
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={products.map((p) => ({ value: p.productId, label: p.name }))}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="threshold" label="Hədd" rules={[{ required: true }]}> 
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="periodDays" label="Dövr (gün)" rules={[{ required: true }]}> 
            <InputNumber min={1} max={90} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cooldownHours" label="Bildirişlərarası fasilə (saat)" rules={[{ required: true }]}> 
            <InputNumber min={1} max={168} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
