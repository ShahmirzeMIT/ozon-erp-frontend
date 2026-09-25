import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Input, Select, Switch, Table, Tag, Button, Space, Tooltip } from 'antd';
import { DownloadOutlined, StarFilled, StarOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../hooks/useDataSource';
import { useWatchlist } from '../../hooks/useWatchlist';
import { formatRub, formatPct } from '../../components/format';
import type { Product, ProductFilters, ProductStatus } from '../../types';

const STATUS_LABEL: Record<ProductStatus, { text: string; color: string }> = {
  active: { text: 'Aktiv', color: 'green' },
  archived: { text: 'В архиве', color: 'default' },
  low_stock: { text: 'Мало на складе', color: 'orange' },
  out_of_stock: { text: 'Нет в наличии', color: 'red' },
};

function toCsv(rows: Product[]): string {
  const header = ['Название', 'Offer ID', 'SKU', 'Цена', 'FBO остаток', 'FBS остаток', 'Заказы 7д', 'Заказы 30д', 'Возвраты %', 'Статус'];
  const lines = rows.map((p) =>
    [p.name, p.offerId, p.sku, p.currentPrice, p.fboStock, p.fbsStock, p.orders7d, p.orders30d, p.returnRatePct, p.status]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function ProductsPage() {
  const ds = useDataSource();
  const [watchlist, toggleWatch] = useWatchlist();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus[]>([]);
  const [warehouseType, setWarehouseType] = useState<Array<'FBO' | 'FBS'>>([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<ProductFilters['sortField']>();
  const [sortOrder, setSortOrder] = useState<ProductFilters['sortOrder']>();

  const filters: ProductFilters = useMemo(
    () => ({ search, status, warehouseType, lowStockOnly, page, pageSize, sortField, sortOrder }),
    [search, status, warehouseType, lowStockOnly, page, pageSize, sortField, sortOrder],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => ds.getProducts(filters),
  });

  const handleExport = async () => {
    const all = await ds.getProducts({ ...filters, page: 1, pageSize: 10000 });
    const csv = toCsv(all.items);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mehsullar.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: '',
      dataIndex: 'isWatched',
      width: 40,
      render: (_: unknown, record: Product) => (
        <Tooltip title={record.isWatched ? 'Убрать из избранного' : 'Добавить в избранное'}>
          <Button
            type="text"
            size="small"
            icon={record.isWatched ? <StarFilled style={{ color: '#f0a020' }} /> : <StarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              toggleWatch(record.productId);
            }}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Товар',
      dataIndex: 'name',
      sorter: true,
      render: (name: string, record: Product) => (
        <Link to={`/products/${record.productId}`}>
          <span style={{ marginRight: 6 }}>{record.imageEmoji}</span>
          {name}
        </Link>
      ),
    },
    { title: 'Offer ID', dataIndex: 'offerId' },
    { title: 'SKU', dataIndex: 'sku' },
    { title: 'Цена', dataIndex: 'currentPrice', sorter: true, render: (v: number) => formatRub(v) },
    { title: 'FBO остаток', dataIndex: 'fboStock', sorter: true },
    { title: 'FBS остаток', dataIndex: 'fbsStock', sorter: true },
    { title: 'Заказы 7 дней', dataIndex: 'orders7d', sorter: true },
    { title: 'Заказы 30 дней', dataIndex: 'orders30d', sorter: true },
    { title: 'Возвраты %', dataIndex: 'returnRatePct', sorter: true, render: (v: number) => formatPct(v) },
    {
      title: 'Статус',
      dataIndex: 'status',
      render: (v: ProductStatus) => <Tag color={STATUS_LABEL[v].color}>{STATUS_LABEL[v].text}</Tag>,
    },
  ];

  return (
    <Card size="small">
      <div className="page-header-row">
        <Space wrap>
          <Input
            placeholder="Поиск по названию, offer ID или SKU"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            mode="multiple"
            placeholder="Статус"
            style={{ minWidth: 180 }}
            allowClear
            options={Object.entries(STATUS_LABEL).map(([value, meta]) => ({ value, label: meta.text }))}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <Select
            mode="multiple"
            placeholder="Тип склада"
            style={{ minWidth: 160 }}
            allowClear
            options={[
              { value: 'FBO', label: 'FBO' },
              { value: 'FBS', label: 'FBS' },
            ]}
            onChange={(v) => {
              setWarehouseType(v);
              setPage(1);
            }}
          />
          <Space size={4}>
            <Switch
              checked={lowStockOnly}
              onChange={(v) => {
                setLowStockOnly(v);
                setPage(1);
              }}
            />
            <span>Только товары с малым остатком</span>
          </Space>
        </Space>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          CSV export
        </Button>
      </div>

      <div className="table-scroll-wrap">
        <Table
          rowKey="productId"
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
          onChange={(_pagination, _filters, sorter) => {
            const s = Array.isArray(sorter) ? sorter[0] : sorter;
            if (s?.order) {
              setSortField(s.field as ProductFilters['sortField']);
              setSortOrder(s.order as ProductFilters['sortOrder']);
            } else {
              setSortField(undefined);
              setSortOrder(undefined);
            }
          }}
        />
      </div>
      {watchlist.length > 0 && (
        <div className="muted" style={{ marginTop: 8 }}>
          Товаров в избранном: {watchlist.length} — настройте оповещения на странице оповещений
        </div>
      )}
    </Card>
  );
}
