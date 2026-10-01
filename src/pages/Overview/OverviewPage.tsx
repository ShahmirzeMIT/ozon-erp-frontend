import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, List, Row, Table, Tag, Skeleton, Empty } from 'antd';
import { Line, Column, Pie } from '@ant-design/charts';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppState } from '../../hooks/useAppState';
import { useDataSource } from '../../hooks/useDataSource';
import { KpiCard } from '../../components/KpiCard';
import { formatRub, formatNumber } from '../../components/format';
import type { Posting, PostingStatus } from '../../types';

const STATUS_LABEL: Record<PostingStatus, { text: string; color: string }> = {
  awaiting_packaging: { text: 'Yığılır', color: 'blue' },
  awaiting_deliver: { text: 'Göndərilməyə hazırdır', color: 'geekblue' },
  delivering: { text: 'Yoldadır', color: 'gold' },
  delivered: { text: 'Çatdırılıb', color: 'green' },
  cancelled: { text: 'Ləğv edilib', color: 'red' },
};

export function OverviewPage() {
  const { dateRange } = useAppState();
  const ds = useDataSource();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['overview', dateRange],
    queryFn: () => ds.getOverview(dateRange),
  });

  if (isLoading || !data || !data.kpis) {
    return (
      <div>
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} size="small">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          ))}
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const { kpis, trend, fboFbsSplit, topProducts, criticalAlerts, recentPostings, lastSync } = data;
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
  const sameMonth = dateRange.start.slice(0, 7) === dateRange.end.slice(0, 7);
  const selectedPeriod = sameMonth
    ? `${months[dayjs(dateRange.start).month()]} ${dayjs(dateRange.start).year()}`
    : `${dayjs(dateRange.start).format('DD.MM.YYYY')} – ${dayjs(dateRange.end).format('DD.MM.YYYY')}`;

  const postingColumns = [
    {
      title: 'Göndəriş nömrəsi',
      dataIndex: 'postingNumber',
      render: (v: string) => <Link to={`/orders/${v}`}>{v}</Link>,
    },
    { title: 'Tip', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: PostingStatus) => <Tag color={STATUS_LABEL[v].color}>{STATUS_LABEL[v].text}</Tag>,
    },
    { title: 'Vahid', dataIndex: 'orderedUnits' },
    { title: 'Məbləğ', dataIndex: 'amount', render: (v: number) => formatRub(v) },
  ];

  return (
    <div className="overview-page">
      <div className="kpi-grid">
        <KpiCard title="Sifariş sayı" value={kpis.ordersCount} />
        <KpiCard title="Sifariş edilmiş vahidlər" value={kpis.orderedUnits} tooltip="ordered_units — sifariş edilmiş miqdar, çatdırılmış satış deyil" />
        <KpiCard title="Satış məbləği" value={formatRub(kpis.saleAmount)} />
        <KpiCard title="Qaytarma məbləği" value={formatRub(kpis.returnedAmount)} valueColor="var(--danger)" />
        <KpiCard title="Komissiya" value={kpis.commission === null ? 'Ozon hesabatı hazırlanmayıb' : formatRub(kpis.commission)} tooltip="Ozon-un xam realizasiya sətrlərindəki standart komissiyadan hesablanıb." />
        <KpiCard title="Xidmətlər və çatdırılma" value={kpis.serviceCost === null ? 'Ozon hesabatı hazırlanmayıb' : formatRub(kpis.serviceCost)} tooltip="Ozon-un xam realizasiya sətrlərindəki ümumi xidmət və standart komissiya fərqindən hesablanıb." />
        <KpiCard title="Xalis ödəniş" value={kpis.netPayout === null ? 'Ozon hesabatı hazırlanmayıb' : formatRub(kpis.netPayout)} valueColor="var(--success)" tooltip="Xam realizasiya sətrlərindən hesablanmış göstəricidir; Ozon-un hazır yekun field-i deyil." />
        <KpiCard title="Kritik qalıq (məhsullar)" value={kpis.criticalStockCount} valueColor={kpis.criticalStockCount > 0 ? 'var(--danger)' : undefined} />
      </div>

      <div className="chart-grid-2">
        <Card size="small" title={`${selectedPeriod} üzrə satış və sifariş trendi`} className="section-card">
          <Line
            data={trend.flatMap((t) => [
              { date: t.date, value: t.saleAmount, type: 'Satış (₽)' },
              { date: t.date, value: t.orders, type: 'Sifariş sayı' },
            ])}
            xField="date"
            yField="value"
            seriesField="type"
            height={220}
            legend={{ position: 'top' }}
            tooltip={{ title: (d: any) => d.date }}
          />
        </Card>
        <Card size="small" title="FBO/FBS bölgüsü" className="section-card">
          <Pie
            data={fboFbsSplit.map((f) => ({ type: f.type, value: f.orderedUnits }))}
            angleField="value"
            colorField="type"
            height={220}
            label={{ text: 'value', style: { fontWeight: 600 } }}
            legend={{ position: 'bottom' }}
          />
        </Card>
      </div>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
            <Card size="small" title="Satış üzrə ən yaxşı 10 məhsul" className="section-card">
            {topProducts.length === 0 ? (
              <Empty description="Seçilmiş dövr üçün sifariş yoxdur" />
            ) : (
              <Column
                data={topProducts}
                xField="name"
                yField="orderedUnits"
                height={260}
                axis={{ x: { labelAutoRotate: true } }}
                tooltip={{
                  items: [{ channel: 'y', name: 'Sifariş edilmiş vahidlər' }],
                }}
                onReady={(chart) => {
                  chart.on('element:click', (event: any) => {
                    const eventData = event?.data?.data ?? event?.data;
                    const datum = Array.isArray(eventData) ? eventData[0] : eventData;
                    const productName =
                      datum?.name ??
                      datum?.x ??
                      datum?.data?.name ??
                      datum?.data?.x ??
                      datum?.data?.data?.name;
                    const product = topProducts.find((item) => item.name === productName);
                    if (product) navigate(`/products/${product.productId}`);
                  });
                }}
                onEvent={(_chart, event) => {
                  if (event.type !== 'element:click') return;
                  const eventData = event.data?.data ?? event.data;
                  const datum = Array.isArray(eventData) ? eventData[0] : eventData;
                  const productId = datum?.productId ?? datum?.data?.productId ?? datum?.data?.data?.productId;
                  const productName = datum?.name ?? datum?.data?.name ?? datum?.data?.data?.name;
                  const clickedProduct = topProducts.find((item) => item.name === productName);
                  if (productId || clickedProduct?.productId) navigate(`/products/${productId ?? clickedProduct?.productId}`);
                }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Kritik bildirişlər" className="section-card overview-alerts">
            {criticalAlerts.length === 0 ? (
              <Empty description="Aktiv bildiriş yoxdur" />
            ) : (
              <List
                dataSource={criticalAlerts}
                renderItem={(item) => (
                  <List.Item>
                    {(() => {
                      const parsedStock = String(item.message || '').match(/\d+(?:[.,]\d+)?/);
                      const stock = item.currentStock ?? (parsedStock ? Number(parsedStock[0].replace(',', '.')) : 0);
                      return (
                    <Alert
                      type="error"
                      showIcon
                      style={{ width: '100%', border: '1px solid #ffccc7', background: '#fff1f0', borderRadius: 14 }}
                      message={<Link className="overview-alert-name overview-critical-name" style={{ color: '#cf1322' }} to={`/products/${item.productId}`}>{item.name}</Link>}
                      description={<span style={{ color: '#a8071a', fontWeight: 600 }}>Kritik qalıq ({stock})</span>}
                    />
                      );
                    })()}
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col xs={24} lg={16}>
            <Card size="small" title="Son sifarişlər" className="section-card">
            <div className="table-scroll-wrap">
              <Table
                size="small"
                rowKey="postingNumber"
                columns={postingColumns}
                dataSource={recentPostings as Posting[]}
                pagination={false}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            size="small"
            title={
              <span>
                Son sinxronizasiya statusu
              </span>
            }
            className="section-card"
          >
            <List
              size="small"
              dataSource={lastSync}
              renderItem={(run) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b>{run.endpointName}</b>
                      <Tag color={run.status === 'success' ? 'green' : run.status === 'partial' ? 'gold' : 'red'}>
                        {run.status === 'success' ? 'Uğurlu' : run.status === 'partial' ? 'Qismən' : 'Xəta'}
                      </Tag>
                    </div>
                    <span className="muted">{formatNumber(run.objectsFetched)} obyekt • {run.latencyMs} ms</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
