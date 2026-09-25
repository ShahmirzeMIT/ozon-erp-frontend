import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Table, Tag, Button, Select, Space, Alert, Tooltip, Progress } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDataSource } from '../../hooks/useDataSource';
import { DemoTag } from '../../components/DemoTag';
import { DemoPreferencesStore, type SyncDemoMode } from '../../services/DemoPreferencesStore';
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
  const [mode, setMode] = useState<SyncDemoMode>(() => DemoPreferencesStore.getSyncDemoMode());
  const [refreshing, setRefreshing] = useState(false);

  const { data: runs, isLoading } = useQuery({ queryKey: ['sync', mode], queryFn: () => ds.getSyncRuns() });

  const changeMode = (next: SyncDemoMode) => {
    setMode(next);
    DemoPreferencesStore.setSyncDemoMode(next);
    queryClient.invalidateQueries({ queryKey: ['sync'] });
  };

  const simulateRefresh = () => {
    setRefreshing(true);
    DemoPreferencesStore.setSyncOverrideTimestamp(new Date().toISOString());
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['sync'] });
      setRefreshing(false);
    }, 900);
  };

  const successCount = (runs ?? []).filter((r) => r.status === 'success').length;
  const total = runs?.length ?? 0;

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap align="center">
          <DemoTag label="Демо-симуляция — реальные вызовы Ozon API не выполняются" />
          <Tooltip title="После подключения backend эта панель будет связана с мониторингом cron/job">
            <InfoCircleOutlined />
          </Tooltip>
          <span className="muted">Режим демо:</span>
          <Select
            value={mode}
            style={{ width: 220 }}
            onChange={changeMode}
            options={[
              { value: 'normal', label: 'Normal (16 endpoint)' },
              { value: 'empty', label: 'Пустой результат (empty state)' },
              { value: 'all_error', label: 'Ошибка всех endpoint' },
            ]}
          />
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={simulateRefresh}>
            Синхронизировать сейчас (симуляция)
          </Button>
        </Space>
      </Card>

      {mode === 'all_error' && (
        <Alert
          type="error"
          showIcon
          className="section-card"
          message="Демо-режим: симулируются ошибки всех endpoint"
          description="Это не ошибка реального backend — демонстрация отображения состояния ошибки в UI."
        />
      )}
      {mode === 'empty' && (
        <Alert
          type="info"
          showIcon
          className="section-card"
          message="Демо-режим: симуляция пустого результата"
          description="Отображается состояние, будто backend ещё не запускал синхронизацию."
        />
      )}

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
            locale={{ emptyText: 'Задач синхронизации не найдено (пустой демо-режим)' }}
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
