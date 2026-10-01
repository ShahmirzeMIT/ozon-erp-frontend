import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Input, Select, Switch, Table, Tag, Button, Space, Tooltip, Image } from 'antd';
import { DownloadOutlined, StarFilled, StarOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../hooks/useDataSource';
import { useAppState } from '../../hooks/useAppState';
import { useWatchlist } from '../../hooks/useWatchlist';
import { formatRub, formatPct } from '../../components/format';
import type { Product, ProductFilters, ProductStatus } from '../../types';

const STATUS_LABEL: Record<ProductStatus, { text: string; color: string }> = {
  active: { text: 'Aktiv', color: 'green' },
  archived: { text: 'Arxivdə', color: 'default' },
  low_stock: { text: 'Anbarda azdır', color: 'orange' },
  out_of_stock: { text: 'Stokda yoxdur', color: 'red' },
};

function toCsv(rows: Product[]): string {
  const header = ['Ad', 'Offer ID', 'SKU', 'Qiymət', 'FBO qalığı', 'FBS qalığı', '7 günlük sifarişlər', '30 günlük sifarişlər', 'Qaytarma %', 'Status'];
  const lines = rows.map((p) =>
    [p.name, p.offerId, p.sku, p.currentPrice, p.fboStock, p.fbsStock, p.orders7d, p.orders30d, p.returnRatePct, p.status]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function ProductsPage() {
  const ds = useDataSource();
  const { dateRange } = useAppState();
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
    () => ({ search, status, warehouseType, lowStockOnly, page, pageSize, sortField, sortOrder, range: dateRange }),
    [search, status, warehouseType, lowStockOnly, page, pageSize, sortField, sortOrder, dateRange],
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
        <Tooltip title={record.isWatched ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et'}>
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
      title: 'Şəkil',
      dataIndex: 'imageUrl',
      width: 116,
      render: (url: string | undefined, record: Product) => url ? <Image src={url} width={96} height={96} preview style={{ objectFit: 'cover', borderRadius: 8 }} /> : record.imageEmoji,
    },
    {
      title: 'Məhsul',
      dataIndex: 'name',
      width: 380,
      sorter: true,
      render: (name: string, record: Product) => (
        <Link to={`/products/${record.productId}`} title={name} style={{ display: 'block', maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </Link>
      ),
    },
    { title: 'Offer ID', dataIndex: 'offerId' },
    { title: 'SKU', dataIndex: 'sku' },
    { title: 'Qiymət', dataIndex: 'currentPrice', sorter: true, render: (v: number) => formatRub(v) },
    { title: 'FBO qalığı', dataIndex: 'fboStock', sorter: true },
    { title: 'FBS qalığı', dataIndex: 'fbsStock', sorter: true },
    { title: '7 günlük sifarişlər', dataIndex: 'orders7d', sorter: true },
    { title: '30 günlük sifarişlər', dataIndex: 'orders30d', sorter: true },
    { title: 'Qaytarma %', dataIndex: 'returnRatePct', sorter: true, render: (v: number) => formatPct(v) },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: ProductStatus) => <Tag color={STATUS_LABEL[v].color}>{STATUS_LABEL[v].text}</Tag>,
    },
  ];

  return (
    <Card size="small">
      <div className="page-header-row">
        <Space wrap>
          <Input
            placeholder="Ad, offer ID və ya SKU ilə axtar"
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
            placeholder="Status"
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
            placeholder="Anbar tipi"
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
            <span>Yalnız az qalıqlı məhsullar</span>
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
          scroll={{ x: 1500 }}
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
          Seçilmiş məhsullar: {watchlist.length} — bildirişləri Bildirişlər səhifəsindən tənzimləyin
        </div>
      )}
    </Card>
  );
}
