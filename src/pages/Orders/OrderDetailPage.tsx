import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, Table, Tag, Space, Skeleton, Result, Steps, Alert, Image } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDataSource } from '../../hooks/useDataSource';
import { formatRub } from '../../components/format';
import type { PostingStatus } from '../../types';

const STEP_ORDER: PostingStatus[] = ['awaiting_packaging', 'awaiting_deliver', 'delivering', 'delivered'];
const STEP_LABEL: Record<PostingStatus, string> = {
  awaiting_packaging: 'Yığılır',
  awaiting_deliver: 'Göndərilməyə hazırdır',
  delivering: 'Yoldadır',
  delivered: 'Çatdırılıb',
  cancelled: 'Ləğv edilib',
};

export function OrderDetailPage() {
  const { postingNumber = '' } = useParams();
  const navigate = useNavigate();
  const ds = useDataSource();

  const { data: posting, isLoading } = useQuery({
    queryKey: ['posting', postingNumber],
    queryFn: () => ds.getPosting(postingNumber),
  });
  const { data: finance } = useQuery({
    queryKey: ['posting-finance', postingNumber],
    queryFn: () => ds.getFinanceTransactions({ start: '2000-01-01', end: '2100-01-01' }),
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!posting) {
    return (
      <Result
        status="404"
        title="Sifariş tapılmadı"
        extra={
          <Button type="primary" onClick={() => navigate('/orders')}>
            Sifarişlərə qayıt
          </Button>
        }
      />
    );
  }

  const relatedFinance = (finance ?? []).filter((t) => t.postingNumber === posting.postingNumber);
  const currentStepIndex = STEP_ORDER.indexOf(posting.status);

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          Geri
        </Button>
      </Space>

      {posting.status === 'cancelled' && (
        <Alert type="error" showIcon message="Bu sifariş ləğv edilib" style={{ marginBottom: 12 }} />
      )}

      <Card size="small" className="section-card" title={`Posting ${posting.postingNumber}`}>
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="Sifariş nömrəsi">{posting.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="Тип"><Tag>{posting.type}</Tag></Descriptions.Item>
          <Descriptions.Item label="Anbar">{posting.warehouseId}</Descriptions.Item>
          <Descriptions.Item label="Tarix">{dayjs(posting.createdAt).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Sifariş edilmiş vahidlər">{posting.orderedUnits}</Descriptions.Item>
          <Descriptions.Item label="Məbləğ">{formatRub(posting.amount)}</Descriptions.Item>
        </Descriptions>

        {posting.status !== 'cancelled' && (
          <Steps
            style={{ marginTop: 20 }}
            current={currentStepIndex}
            items={STEP_ORDER.map((s) => ({ title: STEP_LABEL[s] }))}
          />
        )}
      </Card>

      <Card size="small" title="Məhsullar" className="section-card">
        <Table
          size="small"
          rowKey={(r) => r.productId}
          pagination={false}
          dataSource={posting.items}
          columns={[
            { title: 'Şəkil', dataIndex: 'imageUrl', width: 116, render: (url: string | undefined) => url ? <Image src={url} width={96} height={96} preview style={{ objectFit: 'cover', borderRadius: 8 }} /> : '📦' },
            { title: 'Ad', dataIndex: 'name' },
            { title: 'Offer ID', dataIndex: 'offerId' },
            { title: 'Miqdar', dataIndex: 'quantity' },
            { title: 'Qiymət', dataIndex: 'price', render: (v: number) => formatRub(v) },
            {
              title: 'Cəmi',
              render: (_: unknown, r) => formatRub(r.quantity * r.price),
            },
          ]}
        />
      </Card>

      <Card size="small" title="Əlaqəli maliyyə əməliyyatları" className="section-card">
        <Table
          size="small"
          rowKey="transactionId"
          pagination={false}
          dataSource={relatedFinance}
          columns={[
            { title: 'ID', dataIndex: 'transactionId' },
            { title: 'Tip', dataIndex: 'category' },
            { title: 'Tarix', dataIndex: 'date' },
            {
              title: 'Məbləğ',
              dataIndex: 'amount',
              render: (v: number) => (
                <span style={{ color: v < 0 ? 'var(--danger)' : 'var(--success)' }}>{formatRub(v)}</span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
