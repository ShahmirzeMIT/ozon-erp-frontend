import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Col, List, Row, Table, Tag, Skeleton, Empty } from 'antd';
import { Line, Column, Pie } from '@ant-design/charts';
import { Link } from 'react-router-dom';
import { useAppState } from '../../hooks/useAppState';
import { useDataSource } from '../../hooks/useDataSource';
import { KpiCard } from '../../components/KpiCard';
import { formatRub, formatNumber } from '../../components/format';
import { DemoTag } from '../../components/DemoTag';
import type { Posting, PostingStatus } from '../../types';

const STATUS_LABEL: Record<PostingStatus, { text: string; color: string }> = {
  awaiting_packaging: { text: 'Собирается', color: 'blue' },
  awaiting_deliver: { text: 'Готов к отправке', color: 'geekblue' },
  delivering: { text: 'В пути', color: 'gold' },
  delivered: { text: 'Доставлен', color: 'green' },
  cancelled: { text: 'Отменён', color: 'red' },
};

export function OverviewPage() {
  const { dateRange } = useAppState();
  const ds = useDataSource();

  const { data, isLoading } = useQuery({
    queryKey: ['overview', dateRange],
    queryFn: () => ds.getOverview(dateRange),
  });

  if (isLoading || !data) {
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

  const postingColumns = [
    {
      title: 'Номер отправления',
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
    { title: 'Сумма', dataIndex: 'amount', render: (v: number) => formatRub(v) },
  ];

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard title="Количество заказов" value={kpis.ordersCount} />
        <KpiCard title="Заказанные единицы" value={kpis.orderedUnits} tooltip="ordered_units — заказанное количество, а не доставленные продажи" />
        <KpiCard title="Сумма продаж" value={formatRub(kpis.saleAmount)} />
        <KpiCard title="Сумма возвратов" value={formatRub(kpis.returnedAmount)} valueColor="var(--danger)" />
        <KpiCard title="Комиссии и услуги" value={formatRub(kpis.commissionAndServiceCost)} />
        <KpiCard title="Чистая выплата" value={formatRub(kpis.netPayout)} valueColor="var(--success)" />
        <KpiCard title="Критический остаток (товаров)" value={kpis.criticalStockCount} valueColor={kpis.criticalStockCount > 0 ? 'var(--danger)' : undefined} />
      </div>

      <div className="chart-grid-2">
        <Card size="small" title="Тренд продаж и заказов (30 дней)" className="section-card">
          <Line
            data={trend.flatMap((t) => [
              { date: t.date, value: t.saleAmount, type: 'Продажи (₽)' },
              { date: t.date, value: t.orders, type: 'Количество заказов' },
            ])}
            xField="date"
            yField="value"
            seriesField="type"
            height={280}
            legend={{ position: 'top' }}
            tooltip={{ title: (d: any) => d.date }}
          />
        </Card>
        <Card size="small" title="Распределение FBO/FBS" className="section-card">
          <Pie
            data={fboFbsSplit.map((f) => ({ type: f.type, value: f.orderedUnits }))}
            angleField="value"
            colorField="type"
            height={280}
            label={{ text: 'value', style: { fontWeight: 600 } }}
            legend={{ position: 'bottom' }}
          />
        </Card>
      </div>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Топ-5 товаров по продажам" className="section-card">
            {topProducts.length === 0 ? (
              <Empty description="Заказов за выбранный период нет" />
            ) : (
              <Column
                data={topProducts}
                xField="name"
                yField="orderedUnits"
                height={260}
                axis={{ x: { labelAutoRotate: true } }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Критические оповещения" className="section-card">
            {criticalAlerts.length === 0 ? (
              <Empty description="Активных оповещений нет" />
            ) : (
              <List
                dataSource={criticalAlerts}
                renderItem={(item) => (
                  <List.Item>
                    <Alert
                      type="warning"
                      showIcon
                      style={{ width: '100%' }}
                      message={<Link to={`/products/${item.productId}`}>{item.name}</Link>}
                      description={item.message}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col xs={24} lg={16}>
            <Card size="small" title="Последние заказы" className="section-card">
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
                Son sinxronizasiya statusu <DemoTag />
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
                        {run.status === 'success' ? 'Успешно' : run.status === 'partial' ? 'Частично' : 'Ошибка'}
                      </Tag>
                    </div>
                    <span className="muted">{formatNumber(run.objectsFetched)} объектов • {run.latencyMs} мс</span>
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
