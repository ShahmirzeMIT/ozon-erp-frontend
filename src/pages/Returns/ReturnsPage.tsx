import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, DatePicker, Table, Tag, Drawer, Descriptions, Space, Input, Image } from 'antd';
import { Link } from 'react-router-dom';
import { Line } from '@ant-design/charts';
import { useDataSource } from '../../hooks/useDataSource';
import { useAppState } from '../../hooks/useAppState';
import { formatRub, formatPct } from '../../components/format';
import type { FulfilmentType, ReturnFilters, ReturnReason, ReturnRecord, ReturnStatus } from '../../types';

const REASON_LABEL: Record<ReturnReason, string> = {
  defect: 'Qüsur',
  wrong_item: 'Səhv məhsul',
  not_needed: 'Lazım deyil',
  size_mismatch: 'Ölçü uyğun deyil',
  other: 'Digər',
};
const STATUS_LABEL: Record<ReturnStatus, { text: string; color: string }> = {
  requested: { text: 'Sorğu yaradılıb', color: 'blue' },
  approved: { text: 'Təsdiqlənib', color: 'geekblue' },
  received: { text: 'Qəbul edilib', color: 'gold' },
  refunded: { text: 'Məbləğ qaytarılıb', color: 'green' },
  rejected: { text: 'Rədd edilib', color: 'red' },
};

export function ReturnsPage() {
  const ds = useDataSource();
  const { dateRange } = useAppState();
  const [sku, setSku] = useState('');
  const [type, setType] = useState<FulfilmentType | undefined>();
  const [reason, setReason] = useState<ReturnReason[]>([]);
  const [status, setStatus] = useState<ReturnStatus[]>([]);
  const [range, setRange] = useState<[string, string] | null>([dateRange.start, dateRange.end]);
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

  const { data: allReturns } = useQuery({
    queryKey: ['returns-all', range],
    queryFn: () => ds.getReturns({ range: range ? { start: range[0], end: range[1] } : undefined, page: 1, pageSize: 10000 }),
  });
  const { data: products } = useQuery({ queryKey: ['returns-products'], queryFn: () => ds.getProducts({ page: 1, pageSize: 10000 }) });

  useEffect(() => setRange([dateRange.start, dateRange.end]), [dateRange]);

  const trendMap = new Map<string, number>();
  (allReturns?.items ?? []).forEach((item) => {
    const date = item.createdAt.slice(0, 10);
    trendMap.set(date, (trendMap.get(date) ?? 0) + item.amount);
  });
  const trend = [...trendMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, returnRatePct: amount }));

  const byProduct = new Map<string, number>();
  (allReturns?.items ?? []).forEach((r) => byProduct.set(r.productId, (byProduct.get(r.productId) ?? 0) + 1));
  const topReturned = Array.from(byProduct.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, count]) => ({
      name: products?.items.find((p) => p.productId === productId)?.name ?? productId,
      count,
    }));
  const maxReturnedCount = Math.max(...topReturned.map((item) => item.count), 1);

  return (
    <div>
      <div className="chart-grid-2">
        <Card size="small" title="Qaytarmaların dinamikası" className="section-card">
          <Line data={trend} xField="date" yField="returnRatePct" height={240} />
        </Card>
        <Card size="small" title="Ən çox qaytarılan məhsullar" className="section-card">
          {topReturned.length === 0 ? (
            <div className="returns-ranking-empty">Seçilmiş dövr üçün qaytarma yoxdur</div>
          ) : (
            <div className="returns-ranking">
              {topReturned.map((item, index) => (
                <div className="returns-ranking-row" key={item.name} title={item.name}>
                  <div className="returns-ranking-meta">
                    <span className="returns-ranking-rank">{index + 1}</span>
                    <span className="returns-ranking-name">{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="returns-ranking-track">
                    <div className="returns-ranking-fill" style={{ width: `${(item.count / maxReturnedCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
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
              placeholder="Səbəb"
              allowClear
              style={{ minWidth: 200 }}
              options={Object.entries(REASON_LABEL).map(([value, label]) => ({ value, label }))}
              onChange={setReason}
            />
            <Select
              mode="multiple"
              placeholder="Status"
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
              { title: 'Şəkil', dataIndex: 'imageUrl', width: 116, render: (url: string | undefined) => url ? <Image src={url} width={96} height={96} preview style={{ objectFit: 'cover', borderRadius: 8 }} /> : '📦' },
              { title: 'ID', dataIndex: 'returnId', render: (v: string) => <Link to={`/returns/${v}`} onClick={(e) => e.stopPropagation()}>{v}</Link> },
              {
                title: 'Əlaqəli posting',
                dataIndex: 'postingNumber',
                render: (v: string) => <Link to={`/orders/${v}`} onClick={(e) => e.stopPropagation()}>{v}</Link>,
              },
              { title: 'SKU', dataIndex: 'sku' },
              { title: 'Tip', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
              { title: 'Səbəb', dataIndex: 'reasonName', render: (v: string | null, r: ReturnRecord) => v || REASON_LABEL[r.reason] },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (v: ReturnStatus) => <Tag color={STATUS_LABEL[v].color}>{STATUS_LABEL[v].text}</Tag>,
              },
              { title: 'Məbləğ', dataIndex: 'amount', render: (v: number) => formatRub(v) },
              { title: 'Tarix', dataIndex: 'createdAt', render: (v: string) => v.slice(0, 10) },
            ]}
          />
        </div>
      </Card>

      <Drawer title="Qaytarma detalları" open={!!selected} onClose={() => setSelected(null)} width={420}>
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Qaytarma ID-si">{selected.returnId}</Descriptions.Item>
            <Descriptions.Item label="Posting">
              <Link to={`/orders/${selected.postingNumber}`}>{selected.postingNumber}</Link>
            </Descriptions.Item>
            <Descriptions.Item label="Məhsul">
              <Link to={`/products/${selected.productId}`}>
                {products?.items.find((p) => p.productId === selected.productId)?.name ?? selected.productId}
              </Link>
            </Descriptions.Item>
            <Descriptions.Item label="SKU">{selected.sku}</Descriptions.Item>
            <Descriptions.Item label="Tip">{selected.type}</Descriptions.Item>
            <Descriptions.Item label="Səbəb">{REASON_LABEL[selected.reason]}</Descriptions.Item>
            <Descriptions.Item label="Status">{STATUS_LABEL[selected.status].text}</Descriptions.Item>
            <Descriptions.Item label="Məbləğ">{formatRub(selected.amount)}</Descriptions.Item>
            <Descriptions.Item label="Tarix">{selected.createdAt.slice(0, 10)}</Descriptions.Item>
            <Descriptions.Item label="Bu məhsulun qaytarma faizi">
              {formatPct(products?.items.find((p) => p.productId === selected.productId)?.returnRatePct ?? 0)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
