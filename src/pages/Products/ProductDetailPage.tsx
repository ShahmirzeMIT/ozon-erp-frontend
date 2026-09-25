import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Row,
  Col,
  Table,
  InputNumber,
  Space,
  Skeleton,
  Result,
  Statistic,
  Switch,
} from 'antd';
import { ArrowLeftOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/charts';
import { useDataSource } from '../../hooks/useDataSource';
import { useWatchlist } from '../../hooks/useWatchlist';
import { DemoPreferencesStore } from '../../services/DemoPreferencesStore';
import { formatRub, formatPct } from '../../components/format';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const ds = useDataSource();
  const queryClient = useQueryClient();
  const [watchlist, toggleWatch] = useWatchlist();
  const [costDraft, setCostDraft] = useState<number | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => ds.getProduct(id),
  });
  const { data: prices } = useQuery({
    queryKey: ['product-prices', id],
    queryFn: () => ds.getPrices(id),
    enabled: !!id,
  });
  const { data: history } = useQuery({
    queryKey: ['product-inventory-history', id],
    queryFn: () => ds.getInventoryHistory(id),
    enabled: !!id,
  });
  const { data: postings } = useQuery({
    queryKey: ['product-postings', id],
    queryFn: () => ds.getPostings({ productId: id, page: 1, pageSize: 5 }),
    enabled: !!id,
  });
  const { data: returns } = useQuery({
    queryKey: ['product-returns', id],
    queryFn: () => ds.getReturns({ page: 1, pageSize: 5 }),
    enabled: !!id,
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!product) {
    return (
      <Result
        status="404"
        title="Товар не найден"
        extra={
          <Button type="primary" onClick={() => navigate('/products')}>
            Вернуться к товарам
          </Button>
        }
      />
    );
  }

  const isWatched = watchlist.includes(product.productId);
  const productReturns = (returns?.items ?? []).filter((r) => r.productId === product.productId);

  const saveCost = () => {
    DemoPreferencesStore.setCostOverride(product.productId, costDraft);
    queryClient.invalidateQueries({ queryKey: ['product', id] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
          Geri
        </Button>
      </Space>

      <Card
        size="small"
        className="section-card"
        title={
          <Space>
            <span style={{ fontSize: 20 }}>{product.imageEmoji}</span>
            {product.name}
          </Space>
        }
        extra={
          <Space>
            <span>Добавить в избранное</span>
            <Switch
              checked={isWatched}
              checkedChildren={<StarFilled />}
              unCheckedChildren={<StarOutlined />}
              onChange={() => toggleWatch(product.productId)}
            />
          </Space>
        }
      >
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="Offer ID">{product.offerId}</Descriptions.Item>
          <Descriptions.Item label="SKU">{product.sku}</Descriptions.Item>
          <Descriptions.Item label="Kateqoriya">{product.category}</Descriptions.Item>
          <Descriptions.Item label="Текущая цена">{formatRub(product.currentPrice)}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={product.status === 'active' ? 'green' : product.status === 'low_stock' ? 'orange' : 'red'}>
              {product.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Доля возвратов">{formatPct(product.returnRatePct)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <div className="kpi-grid">
        <Card size="small">
          <Statistic title="FBO stok" value={product.fboStock} />
        </Card>
        <Card size="small">
          <Statistic title="FBS stok" value={product.fbsStock} />
        </Card>
        <Card size="small">
          <Statistic title="Заказы за 7 дней" value={product.orders7d} />
        </Card>
        <Card size="small">
          <Statistic title="Заказы за 30 дней" value={product.orders30d} />
        </Card>
      </div>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Остаток на складе за 60 дней" className="section-card">
            {history && history.length > 0 ? (
              <Line data={history} xField="date" yField="present" height={240} />
            ) : (
              <Skeleton active paragraph={{ rows: 4 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="История цен" className="section-card">
            {prices && prices.length > 0 ? (
              <Line data={prices} xField="date" yField="price" height={240} />
            ) : (
              <Skeleton active paragraph={{ rows: 4 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Card size="small" title="Себестоимость (демо-поле)" className="section-card">
        {product.costPrice === null ? (
          <Space direction="vertical">
            <Tag color="default">Себестоимость не указана</Tag>
            <Space>
              <InputNumber
                min={0}
                placeholder="Себестоимость (₽)"
                value={costDraft ?? undefined}
                onChange={(v) => setCostDraft(v)}
              />
              <Button type="primary" onClick={saveCost} disabled={costDraft === null}>
                Сохранить
              </Button>
            </Space>
          </Space>
        ) : (
          <Space>
            <span>Текущая себестоимость: {formatRub(product.costPrice)}</span>
            <span className="muted">
              Примерная прибыль с единицы: {formatRub(product.currentPrice - product.costPrice)}
            </span>
            <InputNumber min={0} placeholder="Новое значение" onChange={(v) => setCostDraft(v)} />
            <Button onClick={saveCost} disabled={costDraft === null}>
              Обновить
            </Button>
          </Space>
        )}
      </Card>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Связанные заказы" className="section-card">
            <Table
              size="small"
              rowKey="postingNumber"
              pagination={false}
              dataSource={postings?.items ?? []}
              columns={[
                {
                  title: 'Posting',
                  dataIndex: 'postingNumber',
                  render: (v: string) => <Link to={`/orders/${v}`}>{v}</Link>,
                },
                { title: 'Tip', dataIndex: 'type' },
                { title: 'Сумма', dataIndex: 'amount', render: (v: number) => formatRub(v) },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Связанные возвраты" className="section-card">
            <Table
              size="small"
              rowKey="returnId"
              pagination={false}
              dataSource={productReturns}
              columns={[
                { title: 'ID', dataIndex: 'returnId' },
                { title: 'Причина', dataIndex: 'reason' },
                { title: 'Status', dataIndex: 'status' },
                { title: 'Сумма', dataIndex: 'amount', render: (v: number) => formatRub(v) },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
