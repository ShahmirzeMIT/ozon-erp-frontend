import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Tag, Button, Space, Tooltip, Progress } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDataSource } from '../../hooks/useDataSource';
import { formatNumber } from '../../components/format';
import type { SyncRun } from '../../types';

const STATUS_META: Record<SyncRun['status'], { text: string; color: string }> = {
  success: { text: 'Успешно', color: 'green' },
  partial: { text: 'Частично', color: 'gold' },
  error: { text: 'Ошибка', color: 'red' },
};

export function SyncPage() {
  const ds = useDataSource();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: runs, isLoading } = useQuery({ queryKey: ['sync'], queryFn: () => ds.getSyncRuns() });

  const refresh = async () => {
    setRefreshing(true);
    try { await ds.syncNow(); await queryClient.invalidateQueries(); } finally { setRefreshing(false); }
  };

  const successCount = (runs ?? []).filter((r) => r.status === 'success').length;
  const total = runs?.length ?? 0;

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap align="center">
          <Tooltip title="Sinxronizasiya nəticələri backend cache-dən göstərilir">
            <InfoCircleOutlined />
          </Tooltip>
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={refresh}>
            Ozon ilə indi sinxronlaşdır
          </Button>
        </Space>
      </Card>

      {total > 0 && (
        <Card size="small" className="section-card">
          <Space direction="vertical" style={{ width: '100%' }}>
            <span>
              Общее состояние: {successCount}/{total} endpoint успешны
            </span>
            <Progress percent={Math.round((successCount / total) * 100)} status={successCount === total ? 'success' : 'active'} />
          </Space>
        </Card>
      )}

      <Card size="small" title="Статус 16 endpoint Ozon">
        <div className="table-scroll-wrap">
          <Table
            size="small"
            rowKey="endpointId"
            loading={isLoading}
            dataSource={runs ?? []}
            locale={{ emptyText: 'Sinxronizasiya məlumatı yoxdur' }}
            pagination={false}
            columns={[
              { title: '#', dataIndex: 'endpointId', width: 40 },
              { title: 'Endpoint', dataIndex: 'endpointName' },
              { title: 'Path', dataIndex: 'path', render: (v: string) => <code>{v}</code> },
              { title: 'Какую страницу заполняет', dataIndex: 'page' },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (v: SyncRun['status']) => <Tag color={STATUS_META[v].color}>{STATUS_META[v].text}</Tag>,
              },
              { title: 'Объектов', dataIndex: 'objectsFetched', render: (v: number) => formatNumber(v) },
              { title: 'Latency (ms)', dataIndex: 'latencyMs' },
              {
                title: 'Последний успех',
                dataIndex: 'lastSuccessAt',
                render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
              },
              {
                title: 'Последняя попытка',
                dataIndex: 'latestRunAt',
                render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
              },
              { title: 'Mesaj', dataIndex: 'message' },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
