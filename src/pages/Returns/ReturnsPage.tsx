import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, DatePicker, Table, Tag, Drawer, Descriptions, Space, Input } from 'antd';
import { Link } from 'react-router-dom';
import { Line, Column } from '@ant-design/charts';
import { useDataSource } from '../../hooks/useDataSource';
import { formatRub, formatPct } from '../../components/format';
import { getMockDataset } from '../../data/mock';
import type { FulfilmentType, ReturnFilters, ReturnReason, ReturnRecord, ReturnStatus } from '../../types';

const REASON_LABEL: Record<ReturnReason, string> = {
  defect: 'Дефект',
  wrong_item: 'Неверный товар',
  not_needed: 'Не нужен',
  size_mismatch: 'Несоответствие размера',
  other: 'Другое',
};
const STATUS_LABEL: Record<ReturnStatus, { text: string; color: string }> = {
  requested: { text: 'Запрошен', color: 'blue' },
  approved: { text: 'Одобрен', color: 'geekblue' },
  received: { text: 'Получен', color: 'gold' },
  refunded: { text: 'Возвращены деньги', color: 'green' },
  rejected: { text: 'Отклонён', color: 'red' },
};

export function ReturnsPage() {
  const ds = useDataSource();
  const dataset = getMockDataset();
  const [sku, setSku] = useState('');
  const [type, setType] = useState<FulfilmentType | undefined>();
  const [reason, setReason] = useState<ReturnReason[]>([]);
  const [status, setStatus] = useState<ReturnStatus[]>([]);
  const [range, setRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<ReturnRecord | null>(null);

  const filters: ReturnFilters = useMemo(
    () => ({
      sku: sku || undefined,
      type,
      reason,
      status,
      range: range ? { start: range[0], end: range[1] } : undefined,
      page,
      pageSize,
    }),
    [sku, type, reason, status, range, page, pageSize],
  );

  const { data, isLoading } = useQuery({ queryKey: ['returns', filters], queryFn: () => ds.getReturns(filters) });

  const trend = dataset.analyticsDaily.map((a) => ({
    date: a.date,
    returnRatePct: a.saleAmount > 0 ? Math.round((a.returns / a.saleAmount) * 1000) / 10 : 0,
  }));

  const byProduct = new Map<string, number>();
  dataset.returns.forEach((r) => byProduct.set(r.productId, (byProduct.get(r.productId) ?? 0) + 1));
  const topReturned = Array.from(byProduct.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, count]) => ({
      name: dataset.products.find((p) => p.productId === productId)?.name ?? productId,
      count,
    }));

  return (
    <div>
      <div className="chart-grid-2">
        <Card size="small" title="Динамика возвратов" className="section-card">
          <Line data={trend} xField="date" yField="returnRatePct" height={240} />
        </Card>
        <Card size="small" title="Самые возвращаемые товары" className="section-card">
          <Column data={topReturned} xField="name" yField="count" height={240} axis={{ x: { labelAutoRotate: true } }} />
        </Card>
      </div>

      <Card size="small">
        <div className="page-header-row">
          <Space wrap>
            <Input.Search placeholder="SKU" allowClear style={{ width: 160 }} onSearch={setSku} />
            <Select
              placeholder="FBO/FBS"
              allowClear
              style={{ minWidth: 140 }}
              options={[
                { value: 'FBO', label: 'FBO' },
                { value: 'FBS', label: 'FBS' },
              ]}
              onChange={setType}
            />
            <Select
              mode="multiple"
              placeholder="Причина"
              allowClear
              style={{ minWidth: 200 }}
              options={Object.entries(REASON_LABEL).map(([value, label]) => ({ value, label }))}
              onChange={setReason}
            />
            <Select
              mode="multiple"
              placeholder="Статус"
              allowClear
              style={{ minWidth: 200 }}
              options={Object.entries(STATUS_LABEL).map(([value, meta]) => ({ value, label: meta.text }))}
              onChange={setStatus}
            />
            <DatePicker.RangePicker
              onChange={(vals) => setRange(vals && vals[0] && vals[1] ? [vals[0].format('YYYY-MM-DD'), vals[1].format('YYYY-MM-DD')] : null)}
            />
          </Space>
        </div>
        <div className="table-scroll-wrap">
          <Table
            rowKey="returnId"
            loading={isLoading}
            dataSource={data?.items ?? []}
            onRow={(record) => ({ onClick: () => setSelected(record), style: { cursor: 'pointer' } })}
            pagination={{
              current: page,
              pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            columns={[
              { title: 'ID', dataIndex: 'returnId' },
              {
                title: 'Posting',
                dataIndex: 'postingNumber',
                render: (v: string) => <Link to={`/orders/${v}`} onClick={(e) => e.stopPropagation()}>{v}</Link>,
              },
              { title: 'SKU', dataIndex: 'sku' },
              { title: 'Tip', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
              { title: 'Причина', dataIndex: 'reason', render: (v: ReturnReason) => REASON_LABEL[v] },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (v: ReturnStatus) => <Tag color={STATUS_LABEL[v].color}>{STATUS_LABEL[v].text}</Tag>,
              },
              { title: 'Сумма', dataIndex: 'amount', render: (v: number) => formatRub(v) },
              { title: 'Дата', dataIndex: 'createdAt', render: (v: string) => v.slice(0, 10) },
            ]}
          />
        </div>
      </Card>

      <Drawer title="Детали возврата" open={!!selected} onClose={() => setSelected(null)} width={420}>
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID возврата">{selected.returnId}</Descriptions.Item>
            <Descriptions.Item label="Posting">
              <Link to={`/orders/${selected.postingNumber}`}>{selected.postingNumber}</Link>
            </Descriptions.Item>
            <Descriptions.Item label="Товар">
              <Link to={`/products/${selected.productId}`}>
                {dataset.products.find((p) => p.productId === selected.productId)?.name}
              </Link>
            </Descriptions.Item>
            <Descriptions.Item label="SKU">{selected.sku}</Descriptions.Item>
            <Descriptions.Item label="Tip">{selected.type}</Descriptions.Item>
            <Descriptions.Item label="Причина">{REASON_LABEL[selected.reason]}</Descriptions.Item>
            <Descriptions.Item label="Status">{STATUS_LABEL[selected.status].text}</Descriptions.Item>
            <Descriptions.Item label="Сумма">{formatRub(selected.amount)}</Descriptions.Item>
            <Descriptions.Item label="Дата">{selected.createdAt.slice(0, 10)}</Descriptions.Item>
            <Descriptions.Item label="Доля возвратов этого товара">
              {formatPct(dataset.products.find((p) => p.productId === selected.productId)?.returnRatePct ?? 0)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
