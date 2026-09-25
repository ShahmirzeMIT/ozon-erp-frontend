import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Descriptions, Table, Tag, Space, Skeleton, Result, Steps, Alert } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDataSource } from '../../hooks/useDataSource';
import { formatRub } from '../../components/format';
import type { PostingStatus } from '../../types';

const STEP_ORDER: PostingStatus[] = ['awaiting_packaging', 'awaiting_deliver', 'delivering', 'delivered'];
const STEP_LABEL: Record<PostingStatus, string> = {
  awaiting_packaging: 'Собирается',
  awaiting_deliver: 'Готов к отправке',
  delivering: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
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
        title="Заказ не найден"
        extra={
          <Button type="primary" onClick={() => navigate('/orders')}>
            Вернуться к заказам
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
        <Alert type="error" showIcon message="Этот заказ отменён" style={{ marginBottom: 12 }} />
      )}

      <Card size="small" className="section-card" title={`Posting ${posting.postingNumber}`}>
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="Номер заказа">{posting.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="Тип"><Tag>{posting.type}</Tag></Descriptions.Item>
          <Descriptions.Item label="Склад">{posting.warehouseId}</Descriptions.Item>
          <Descriptions.Item label="Дата">{dayjs(posting.createdAt).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Заказанные единицы">{posting.orderedUnits}</Descriptions.Item>
          <Descriptions.Item label="Сумма">{formatRub(posting.amount)}</Descriptions.Item>
        </Descriptions>

        {posting.status !== 'cancelled' && (
          <Steps
            style={{ marginTop: 20 }}
            current={currentStepIndex}
            items={STEP_ORDER.map((s) => ({ title: STEP_LABEL[s] }))}
          />
        )}
      </Card>

      <Card size="small" title="Товары" className="section-card">
        <Table
          size="small"
          rowKey={(r) => r.productId}
          pagination={false}
          dataSource={posting.items}
          columns={[
            { title: 'Ad', dataIndex: 'name' },
            { title: 'Offer ID', dataIndex: 'offerId' },
            { title: 'Miqdar', dataIndex: 'quantity' },
            { title: 'Цена', dataIndex: 'price', render: (v: number) => formatRub(v) },
            {
              title: 'Итого',
              render: (_: unknown, r) => formatRub(r.quantity * r.price),
            },
          ]}
        />
      </Card>

      <Card size="small" title="Связанные финансовые операции" className="section-card">
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
              title: 'Сумма',
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
