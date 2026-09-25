import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Select, Switch, Table, Tag, Space, InputNumber, Tooltip } from 'antd';
import { Column } from '@ant-design/charts';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../hooks/useDataSource';
import { formatNumber } from '../../components/format';
import type { FulfilmentType, InventoryFilters } from '../../types';
import { getMockDataset } from '../../data/mock';

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
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => ds.getInventory(filters),
  });

  const dataset = getMockDataset();

  const rows = (snapshots ?? []).flatMap((s) => {
    const product = dataset.products.find((p) => p.productId === s.productId);
    if (!product) return [];
    const velocity = product.velocityPerDay || 0.01;
    const daysLeft = s.available > 0 ? Math.round(s.available / velocity) : 0;
    return [{ ...s, productName: product.name, velocity, daysLeft }];
  });

  const topLowStock = [...rows].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 8);

  const warehouseTotals = (warehouses ?? []).map((w) => ({
    warehouse: w.name,
    present: dataset.inventorySnapshots.filter((s) => s.warehouseId === w.warehouseId).reduce((s, i) => s + i.present, 0),
  }));

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap>
          <Select
            placeholder="Склад"
            allowClear
            style={{ minWidth: 220 }}
            options={(warehouses ?? []).map((w) => ({ value: w.warehouseId, label: `${w.name} (${w.type})` }))}
            onChange={setWarehouseId}
          />
          <Select
            placeholder="Тип"
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
            <span>Фильтр критичности</span>
          </Space>
          {criticalOnly && (
            <Tooltip title="Показываются товары, запас которых закончится раньше указанного срока">
              <Space size={4}>
              <span>Порог (дни):</span>
                <InputNumber min={1} max={60} value={criticalDaysThreshold} onChange={(v) => setCriticalDaysThreshold(v ?? 7)} />
              </Space>
            </Tooltip>
          )}
        </Space>
      </Card>

      <div className="chart-grid-2">
        <Card size="small" title="Малый остаток — примерный срок окончания" className="section-card">
          <Table
            size="small"
            rowKey={(r) => `${r.productId}-${r.warehouseId}`}
            loading={isLoading}
            pagination={false}
            dataSource={topLowStock}
            columns={[
              {
                title: 'Товар',
                dataIndex: 'productName',
                render: (v: string, r) => <Link to={`/products/${r.productId}`}>{v}</Link>,
              },
              { title: 'Tip', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
              { title: 'Доступно', dataIndex: 'available' },
              {
                title: 'До окончания (дни)',
                dataIndex: 'daysLeft',
                render: (v: number) =>
                  v === 0 ? '—' : <span style={{ color: v <= 7 ? 'var(--danger)' : undefined }}>{v}</span>,
              },
            ]}
          />
        </Card>
        <Card size="small" title="Сравнение складов" className="section-card">
          <Column data={warehouseTotals} xField="warehouse" yField="present" height={280} />
        </Card>
      </div>

      <Card size="small" title="Все остатки" className="section-card">
        <div className="table-scroll-wrap">
          <Table
            size="small"
            rowKey={(r) => `${r.productId}-${r.warehouseId}`}
            loading={isLoading}
            dataSource={rows}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            columns={[
              {
                title: 'Товар',
                dataIndex: 'productName',
                render: (v: string, r) => <Link to={`/products/${r.productId}`}>{v}</Link>,
              },
              { title: 'Tip', dataIndex: 'type', render: (v: string) => <Tag>{v}</Tag> },
              { title: 'Всего (present)', dataIndex: 'present' },
              { title: 'Резерв (reserved)', dataIndex: 'reserved' },
              { title: 'Доступно (available)', dataIndex: 'available' },
              { title: 'Последнее обновление', dataIndex: 'date' },
              {
                title: 'До окончания (дни)',
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
