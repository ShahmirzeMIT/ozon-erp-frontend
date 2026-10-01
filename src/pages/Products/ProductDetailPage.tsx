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
  Image,
} from 'antd';
import { ArrowLeftOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import { useDataSource } from '../../hooks/useDataSource';
import { useAppState } from '../../hooks/useAppState';
import { useWatchlist } from '../../hooks/useWatchlist';
import { formatRub, formatPct } from '../../components/format';

const STATUS_LABEL = {
  active: { text: 'Aktiv', color: 'green' },
  archived: { text: 'Arxivdə', color: 'default' },
  low_stock: { text: 'Anbarda azdır', color: 'orange' },
  out_of_stock: { text: 'Stokda yoxdur', color: 'red' },
} as const;

const RETURN_STATUS_LABEL: Record<string, string> = {
  received: 'Qəbul edilib',
  rejected: 'Rədd edilib',
  refunded: 'Məbləğ qaytarılıb',
  requested: 'Sorğu göndərilib',
};

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const ds = useDataSource();
  const { dateRange } = useAppState();
  const queryClient = useQueryClient();
  const [watchlist, toggleWatch] = useWatchlist();
  const [costDraft, setCostDraft] = useState<number | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => ds.getProduct(id),
  });
  const { data: postings } = useQuery({
    queryKey: ['product-postings', id, dateRange],
    queryFn: () => ds.getPostings({ productId: id, range: dateRange, page: 1, pageSize: 5 }),
    enabled: !!id,
  });
  const { data: returns } = useQuery({
    queryKey: ['product-returns', id, dateRange],
    queryFn: () => ds.getReturns({ productId: id, range: dateRange, page: 1, pageSize: 5 }),
    enabled: !!id,
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!product) {
    return (
      <Result
        status="404"
        title="Məhsul tapılmadı"
        extra={
          <Button type="primary" onClick={() => navigate('/products')}>
            Məhsullara qayıt
          </Button>
        }
      />
    );
  }

  const isWatched = watchlist.includes(product.productId);
  const productReturns = (returns?.items ?? []).filter((r) => r.productId === product.productId);

  const saveCost = async () => {
    if (costDraft === null) return;
    await ds.setProductCost(product.productId, costDraft);
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
            {product.imageUrl ? <Image src={product.imageUrl} width={120} height={120} preview style={{ objectFit: 'cover', borderRadius: 10 }} /> : <span style={{ fontSize: 32 }}>{product.imageEmoji}</span>}
            {product.name}
          </Space>
        }
        extra={
          <Space>
            <span>Seçilmişlərə əlavə et</span>
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
          <Descriptions.Item label="Cari qiymət">{formatRub(product.currentPrice)}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={product.status === 'active' ? 'green' : product.status === 'low_stock' ? 'orange' : 'red'}>
              {STATUS_LABEL[product.status]?.text || product.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Qaytarma faizi">{formatPct(product.returnRatePct)}</Descriptions.Item>
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
          <Statistic title="7 günlük sifarişlər" value={product.orders7d} />
        </Card>
        <Card size="small">
          <Statistic title="30 günlük sifarişlər" value={product.orders30d} />
        </Card>
      </div>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Stok müqayisəsi" className="section-card">
            <Column
              data={[
                { type: 'FBO stok', value: product.fboStock },
                { type: 'FBS stok', value: product.fbsStock },
              ]}
              xField="type"
              yField="value"
              height={220}
              color={['#1677ff', '#13c2c2']}
              label={{ text: 'value', position: 'top' }}
              axis={{ y: { title: 'Miqdar' } }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Sifariş müqayisəsi" className="section-card">
            <Column
              data={[
                { type: 'Son 7 gün', value: product.orders7d },
                { type: 'Son 30 gün', value: product.orders30d },
              ]}
              xField="type"
              yField="value"
              height={220}
              color="#722ed1"
              label={{ text: 'value', position: 'top' }}
              axis={{ y: { title: 'Sifariş sayı' } }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" title="Maya dəyəri (manual sahə)" className="section-card">
        {product.costPrice === null ? (
          <Space direction="vertical">
          <Tag color="default">Maya dəyəri göstərilməyib</Tag>
            <Space>
              <InputNumber
                min={0}
                placeholder="Maya dəyəri (₽)"
                value={costDraft ?? undefined}
                onChange={(v) => setCostDraft(v)}
              />
              <Button type="primary" onClick={saveCost} disabled={costDraft === null}>
                Yadda saxla
              </Button>
            </Space>
          </Space>
        ) : (
          <Space>
            <span>Cari maya dəyəri: {formatRub(product.costPrice)}</span>
            <span className="muted">
              Bir məhsul üzrə təxmini mənfəət: {formatRub(product.currentPrice - product.costPrice)}
            </span>
            <InputNumber min={0} placeholder="Yeni dəyər" onChange={(v) => setCostDraft(v)} />
            <Button onClick={saveCost} disabled={costDraft === null}>
              Yenilə
            </Button>
          </Space>
        )}
      </Card>

      <Row gutter={12}>
        <Col xs={24} lg={12}>
          <Card size="small" title="Əlaqəli sifarişlər" className="section-card">
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
                { title: 'Məbləğ', dataIndex: 'amount', render: (v: number) => formatRub(v) },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title="Əlaqəli qaytarmalar" className="section-card">
            <Table
              size="small"
              rowKey="returnId"
              pagination={false}
              dataSource={productReturns}
              columns={[
                { title: 'ID', dataIndex: 'returnId' },
                { title: 'Səbəb', dataIndex: 'reason' },
                { title: 'Status', dataIndex: 'status', render: (v: string) => RETURN_STATUS_LABEL[v] || v },
                { title: 'Məbləğ', dataIndex: 'amount', render: (v: number) => formatRub(v) },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
