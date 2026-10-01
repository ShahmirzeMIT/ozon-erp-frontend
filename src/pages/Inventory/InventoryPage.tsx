import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, Switch, Table, Tag, Space, InputNumber, Tooltip, Image } from 'antd';
import { Column } from '@ant-design/charts';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../hooks/useDataSource';
import { formatNumber } from '../../components/format';
import type { FulfilmentType, InventoryFilters } from '../../types';

export function InventoryPage() {
  const ds = useDataSource();
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [type, setType] = useState<FulfilmentType | undefined>();
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [criticalDaysThreshold, setCriticalDaysThreshold] = useState(7);

  const filters: InventoryFilters = useMemo(
    () => ({ warehouseId, type, criticalOnly, criticalDaysThreshold }),
    [warehouseId, type, criticalOnly, criticalDaysThreshold],
  );

  const { data: warehouses } = useQuery({ queryKey: ['warehouses'], queryFn: () => ds.getWarehouses() });
  const { data: products } = useQuery({ queryKey: ['inventory-products'], queryFn: () => ds.getProducts({ page: 1, pageSize: 10000 }) });
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => ds.getInventory(filters),
  });

  const productMap = new Map((products?.items ?? []).map((product) => [product.productId, product]));

  const rows = (snapshots ?? []).flatMap((s) => {
    const product = productMap.get(s.productId);
    if (!product) return [];
    const velocity = Math.max(product.orders30d / 30, 0.01);
    const daysLeft = s.available > 0 ? Math.round(s.available / velocity) : 0;
    return [{ ...s, productName: product.name, velocity, daysLeft }];
  });

  const topLowStock = [...rows].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 8);

  const warehouseTotals = (warehouses ?? []).map((w) => ({
    warehouseId: w.warehouseId,
    warehouse: w.name,
    present: (snapshots ?? []).filter((s) => s.warehouseId === w.warehouseId).reduce((s, i) => s + i.present, 0),
  }));

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap>
          <Select
            placeholder="Anbar"
            allowClear
            style={{ minWidth: 220 }}
            value={warehouseId}
            options={(warehouses ?? []).map((w) => ({ value: w.warehouseId, label: `${w.name} (${w.type})` }))}
            onChange={setWarehouseId}
          />
          <Select
            placeholder="Tip"
            allowClear
            style={{ minWidth: 140 }}
            options={[
              { value: 'FBO', label: 'FBO' },
              { value: 'FBS', label: 'FBS' },
            ]}
            onChange={setType}
          />
          <Space size={4}>
            <Switch checked={criticalOnly} onChange={setCriticalOnly} />
            <span>Kritiklik filtri</span>
          </Space>
          {criticalOnly && (
            <Tooltip title="Qalığı göstərilən müddətdən tez bitəcək məhsullar göstərilir">
              <Space size={4}>
              <span>Hədd (gün):</span>
                <InputNumber min={1} max={60} value={criticalDaysThreshold} onChange={(v) => setCriticalDaysThreshold(v ?? 7)} />
              </Space>
            </Tooltip>
          )}
        </Space>
      </Card>

      <div className="chart-grid-2">
        <Card size="small" title="Az qalıq — təxmini bitmə müddəti" className="section-card">
          <Table
            size="small"
            rowKey={(r) => `${r.productId}-${r.warehouseId}`}
            loading={isLoading}
            pagination={false}
            scroll={{ y: 360 }}
            dataSource={topLowStock}
            columns={[
              {
                title: 'Şəkil',
                dataIndex: 'productId',
                width: 116,
                render: (_: string, r) => { const product = productMap.get(r.productId); return product?.imageUrl ? <Image src={product.imageUrl} width={96} height={96} preview style={{ objectFit: 'cover', borderRadius: 8 }} /> : product?.imageEmoji; },
              },
              {
                title: 'Məhsul',
                dataIndex: 'productName',
                render: (v: string, r) => <Link to={`/products/${r.productId}`}>{v}</Link>,
              },
              { title: 'Tip', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
              { title: 'Mövcud', dataIndex: 'available' },
              {
                title: 'Bitməsinə (gün)',
                dataIndex: 'daysLeft',
                render: (v: number) =>
                  v === 0 ? '—' : <span style={{ color: v <= 7 ? 'var(--danger)' : undefined }}>{v}</span>,
              },
            ]}
          />
        </Card>
        <Card size="small" title="Anbarların müqayisəsi" className="section-card">
          <Column
            data={warehouseTotals}
            xField="warehouse"
            yField="present"
            height={280}
            onReady={(chart) => {
              chart.on('element:click', (event: any) => {
                const eventData = event?.data?.data ?? event?.data;
                const datum = Array.isArray(eventData) ? eventData[0] : eventData;
                const name = datum?.warehouse ?? datum?.x ?? datum?.data?.warehouse;
                const id = datum?.warehouseId ?? datum?.data?.warehouseId;
                const clicked = warehouseTotals.find((item) => item.warehouse === name);
                if (id || clicked) setWarehouseId(id ?? clicked?.warehouseId);
              });
            }}
            onEvent={(_chart, event) => {
              if (event.type !== 'element:click') return;
              const eventData = event.data?.data ?? event.data;
              const datum = Array.isArray(eventData) ? eventData[0] : eventData;
              const name = datum?.warehouse ?? datum?.x ?? datum?.data?.warehouse;
              const id = datum?.warehouseId ?? datum?.data?.warehouseId;
              const clicked = warehouseTotals.find((item) => item.warehouse === name);
              if (id || clicked) setWarehouseId(id ?? clicked?.warehouseId);
            }}
          />
        </Card>
      </div>

      <Card size="small" title="Bütün qalıqlar" className="section-card">
        <div className="table-scroll-wrap">
          <Table
            size="small"
            rowKey={(r) => `${r.productId}-${r.warehouseId}`}
            loading={isLoading}
            dataSource={rows}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            columns={[
              {
                title: 'Şəkil',
                dataIndex: 'productId',
                width: 116,
                render: (_: string, r) => { const product = productMap.get(r.productId); return product?.imageUrl ? <Image src={product.imageUrl} width={96} height={96} preview style={{ objectFit: 'cover', borderRadius: 8 }} /> : product?.imageEmoji; },
              },
              {
                title: 'Məhsul',
                dataIndex: 'productName',
                render: (v: string, r) => <Link to={`/products/${r.productId}`}>{v}</Link>,
              },
              { title: 'Tip', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
              { title: 'Cəmi (present)', dataIndex: 'present' },
              { title: 'Rezerv (reserved)', dataIndex: 'reserved' },
              { title: 'Mövcud (available)', dataIndex: 'available' },
              { title: 'Son yenilənmə', dataIndex: 'date' },
              {
                title: 'Bitməsinə (gün)',
                dataIndex: 'daysLeft',
                render: (v: number) => (v === 0 ? '—' : formatNumber(v)),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
