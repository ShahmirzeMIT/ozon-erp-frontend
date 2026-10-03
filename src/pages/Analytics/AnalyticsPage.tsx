import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, DatePicker, Table, Tag, Space, Statistic, Row, Col, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { useDataSource } from '../../hooks/useDataSource';
import { formatRub } from '../../components/format';
import type { AnalyticsFilters, FulfilmentType } from '../../types';

function shiftRangeBack(range: { start: string; end: string }) {
  const start = dayjs(range.start);
  const end = dayjs(range.end);
  const lengthDays = end.diff(start, 'day') + 1;
  return {
    start: start.subtract(lengthDays, 'day').format('YYYY-MM-DD'),
    end: start.subtract(1, 'day').format('YYYY-MM-DD'),
  };
}

export function AnalyticsPage() {
  const { dateRange } = useAppState();
  const ds = useDataSource();
  const [range, setRange] = useState(dateRange);
  const [type, setType] = useState<FulfilmentType | undefined>();
  const [productId, setProductId] = useState<string | undefined>();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();

  const filters: AnalyticsFilters = useMemo(
    () => ({ range, type, productId, warehouseId }),
    [range, type, productId, warehouseId],
  );
  const previousFilters: AnalyticsFilters = useMemo(
    () => ({ ...filters, range: shiftRangeBack(range) }),
    [filters, range],
  );

  const { data: current, isLoading } = useQuery({ queryKey: ['analytics', filters], queryFn: () => ds.getAnalytics(filters) });
  const { data: previous } = useQuery({ queryKey: ['analytics-prev', previousFilters], queryFn: () => ds.getAnalytics(previousFilters) });
  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => ds.getWarehouses() });
  const { data: productPage } = useQuery({ queryKey: ['analytics-products'], queryFn: () => ds.getProducts({ page: 1, pageSize: 10000 }) });

  useEffect(() => setRange(dateRange), [dateRange]);

  const currentTotals = (current ?? []).reduce(
    (acc, d) => ({ orders: acc.orders + d.orders, units: acc.units + d.orderedUnits, sale: acc.sale + d.saleAmount, returns: acc.returns + d.returns }),
    { orders: 0, units: 0, sale: 0, returns: 0 },
  );
  const previousTotals = (previous ?? []).reduce(
    (acc, d) => ({ orders: acc.orders + d.orders, units: acc.units + d.orderedUnits, sale: acc.sale + d.saleAmount, returns: acc.returns + d.returns }),
    { orders: 0, units: 0, sale: 0, returns: 0 },
  );

  const pctChange = (cur: number, prev: number) => (prev === 0 ? null : Math.round(((cur - prev) / prev) * 1000) / 10);

  const products = productPage?.items ?? [];
  const topAndWeak = [...products].sort((a, b) => b.orders30d - a.orders30d);
  const top5 = topAndWeak.slice(0, 5);
  const weak5 = [...topAndWeak].reverse().slice(0, 5);

  const stockRisk = products
    .filter((p) => p.fboStock + p.fbsStock < 20)
    .sort((a, b) => a.fboStock + a.fbsStock - (b.fboStock + b.fbsStock))
    .slice(0, 8);

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap>
          <DatePicker.RangePicker
            value={[dayjs(range.start), dayjs(range.end)]}
            allowClear={false}
            onChange={(vals) => {
              if (vals && vals[0] && vals[1]) setRange({ start: vals[0].format('YYYY-MM-DD'), end: vals[1].format('YYYY-MM-DD') });
            }}
          />
          <Select placeholder="FBO/FBS" allowClear style={{ minWidth: 140 }} options={[{ value: 'FBO', label: 'FBO' }, { value: 'FBS', label: 'FBS' }]} onChange={setType} />
          <Select
            placeholder="Məhsul"
            allowClear
            showSearch
            style={{ width: 320, maxWidth: '100%' }}
            optionFilterProp="label"
            listHeight={280}
            popupMatchSelectWidth
            optionRender={(option) => (
              <div
                title={String(option.label ?? '')}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {option.label}
              </div>
            )}
            options={products.map((p) => ({ value: p.productId, label: p.name }))}
            onChange={setProductId}
          />
          <Select
            placeholder="Anbar"
            allowClear
            style={{ minWidth: 200 }}
            options={(warehouses ?? []).map((w) => ({ value: w.warehouseId, label: w.name }))}
            onChange={setWarehouseId}
          />
        </Space>
      </Card>

      <Row gutter={12} className="section-card">
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Sifariş sayı"
              value={currentTotals.orders}
              suffix={
                pctChange(currentTotals.orders, previousTotals.orders) !== null && (
                  <span className="muted" style={{ fontSize: 12 }}>
                    ({pctChange(currentTotals.orders, previousTotals.orders)! >= 0 ? '+' : ''}
                    {pctChange(currentTotals.orders, previousTotals.orders)}% əvvəlki dövrlə müqayisədə)
                  </span>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Sifariş edilmiş vahidlər" value={currentTotals.units} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Satış məbləği" value={formatRub(currentTotals.sale)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Qaytarma məbləği" value={formatRub(currentTotals.returns)} valueStyle={{ color: 'var(--danger)' }} />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        className="section-card"
        title={
          <span>
            Gündəlik sifariş və satış trendi{' '}
            <Tooltip title="Göstərici seçilmiş filtrlərə uyğun göndərişlər üzrə toplanır. Mənbə: sifarişlər dəsti">
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        }
      >
        <Line
          loading={isLoading}
          data={(current ?? []).flatMap((d) => [
            { date: d.date, value: d.orderedUnits, type: 'Sifariş edilmiş vahidlər' },
            { date: d.date, value: d.orders, type: 'Sifariş sayı' },
          ])}
          xField="date"
          yField="value"
          seriesField="type"
          height={260}
        />
      </Card>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Ən yaxşı 5 məhsul (30 gün)" className="section-card">
            <Table
              size="small"
              rowKey="productId"
              pagination={false}
              dataSource={top5}
              columns={[
                { title: 'Məhsul', dataIndex: 'name', render: (v: string, r) => <Link to={`/products/${r.productId}`}>{v}</Link> },
                { title: '30 günlük vahid', dataIndex: 'orders30d' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Ən zəif 5 məhsul (30 gün)" className="section-card">
            <Table
              size="small"
              rowKey="productId"
              pagination={false}
              dataSource={weak5}
              columns={[
                { title: 'Məhsul', dataIndex: 'name', render: (v: string, r) => <Link to={`/products/${r.productId}`}>{v}</Link> },
                { title: '30 günlük vahid', dataIndex: 'orders30d' },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Qıtlıq riski" className="section-card">
            <Table
              size="small"
              rowKey="productId"
              pagination={false}
              dataSource={stockRisk}
              columns={[
                { title: 'Məhsul', dataIndex: 'name', render: (v: string, r) => <Link to={`/products/${r.productId}`}>{v}</Link> },
                {
                  title: 'Ümumi qalıq',
                  render: (_: unknown, r) => r.fboStock + r.fbsStock,
                },
                {
                  title: 'Vəziyyət',
                  render: (_: unknown, r) => (
                  <Tag color={r.fboStock + r.fbsStock <= 2 ? 'red' : 'orange'}>{r.fboStock + r.fbsStock <= 2 ? 'Kritik' : 'Risk altında'}</Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Konversiya" className="section-card">
            <Tag color="default">Konversiya üçün baxış və klik məlumatı Ozon API-dən verilmir</Tag>
          </Card>
          <Card size="small" title="Qaytarmaların dinamikası" className="section-card">
            <div className="muted">
              Cari dövr üzrə qaytarmalar: {formatRub(currentTotals.returns)}, əvvəlki dövr üzrə: {formatRub(previousTotals.returns)}
              {pctChange(currentTotals.returns, previousTotals.returns) !== null && (
                <> ({pctChange(currentTotals.returns, previousTotals.returns)! >= 0 ? '+' : ''}{pctChange(currentTotals.returns, previousTotals.returns)}%)</>
              )}
              .
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
