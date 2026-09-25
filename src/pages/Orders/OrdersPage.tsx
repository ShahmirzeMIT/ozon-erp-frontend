import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tabs, Input, Select, DatePicker, Table, Tag } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useDataSource } from '../../hooks/useDataSource';
import { formatRub } from '../../components/format';
import type { FulfilmentType, PostingFilters, PostingStatus } from '../../types';

const STATUS_LABEL: Record<PostingStatus, { text: string; color: string }> = {
  awaiting_packaging: { text: 'Собирается', color: 'blue' },
  awaiting_deliver: { text: 'Готов к отправке', color: 'geekblue' },
  delivering: { text: 'В пути', color: 'gold' },
  delivered: { text: 'Доставлен', color: 'green' },
  cancelled: { text: 'Отменён', color: 'red' },
};

export function OrdersPage() {
  const ds = useDataSource();
  const [type, setType] = useState<FulfilmentType>('FBO');
  const [status, setStatus] = useState<PostingStatus[]>([]);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters: PostingFilters = useMemo(
    () => ({
      type,
      status,
      search,
      range: range ? { start: range[0], end: range[1] } : undefined,
      page,
      pageSize,
    }),
    [type, status, search, range, page, pageSize],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['postings', filters],
    queryFn: () => ds.getPostings(filters),
  });

  const columns = [
    {
      title: 'Номер отправления',
      dataIndex: 'postingNumber',
      render: (v: string) => <Link to={`/orders/${v}`}>{v}</Link>,
    },
    { title: 'Номер заказа', dataIndex: 'orderNumber' },
    { title: 'Дата', dataIndex: 'createdAt', render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm') },
    { title: 'Количество', dataIndex: 'orderedUnits' },
    { title: 'Сумма', dataIndex: 'amount', render: (v: number) => formatRub(v) },
    {
      title: 'Статус',
      dataIndex: 'status',
      render: (v: PostingStatus) => <Tag color={STATUS_LABEL[v].color}>{STATUS_LABEL[v].text}</Tag>,
    },
  ];

  return (
    <Card size="small">
      <Tabs
        activeKey={type}
        onChange={(k) => {
          setType(k as FulfilmentType);
          setPage(1);
        }}
        items={[
          { key: 'FBO', label: 'FBO' },
          { key: 'FBS', label: 'FBS' },
        ]}
      />
      <div className="page-header-row">
        <Input.Search
          placeholder="Номер заказа / отправления"
          allowClear
          style={{ width: 260 }}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Select
          mode="multiple"
          placeholder="Статус"
          allowClear
          style={{ minWidth: 220 }}
          options={Object.entries(STATUS_LABEL).map(([value, meta]) => ({ value, label: meta.text }))}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <DatePicker.RangePicker
          onChange={(vals) => {
            if (vals && vals[0] && vals[1]) {
              setRange([vals[0].format('YYYY-MM-DD'), vals[1].format('YYYY-MM-DD')]);
            } else {
              setRange(null);
            }
            setPage(1);
          }}
        />
      </div>
      <div className="table-scroll-wrap">
        <Table
          rowKey="postingNumber"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
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
        />
      </div>
    </Card>
  );
}
