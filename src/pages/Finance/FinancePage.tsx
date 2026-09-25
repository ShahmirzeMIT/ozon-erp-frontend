import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tabs, Table, Tag, DatePicker, Button, Space, Alert } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Column } from '@ant-design/charts';
import { useAppState } from '../../hooks/useAppState';
import { useDataSource } from '../../hooks/useDataSource';
import { KpiCard } from '../../components/KpiCard';
import { formatRub } from '../../components/format';
import type { FinanceTransaction, FinanceTransactionType } from '../../types';

const TYPE_LABEL: Record<FinanceTransactionType, { text: string; color: string }> = {
  sale: { text: 'Продажа', color: 'green' },
  commission: { text: 'Комиссия', color: 'volcano' },
  delivery: { text: 'Доставка', color: 'blue' },
  return: { text: 'Возврат', color: 'red' },
  other_service: { text: 'Прочая услуга', color: 'default' },
};

function toCsv(rows: FinanceTransaction[]): string {
  const header = ['ID', 'Дата', 'Отправление', 'Тип', 'Категория', 'Сумма'];
  const lines = rows.map((t) =>
    [t.transactionId, t.date, t.postingNumber ?? '', t.type, t.category, t.amount].map((v) => `"${v}"`).join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export function FinancePage() {
  const { dateRange } = useAppState();
  const ds = useDataSource();
  const [range, setRange] = useState(dateRange);

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['finance-tx', range],
    queryFn: () => ds.getFinanceTransactions(range),
  });
  const { data: totals } = useQuery({
    queryKey: ['finance-totals', range],
    queryFn: () => ds.getFinanceTotals(range),
  });
  const { data: dailyRealization } = useQuery({
    queryKey: ['finance-daily', range],
    queryFn: () => ds.getDailyRealization(range),
  });
  const { data: monthlyRealization } = useQuery({
    queryKey: ['finance-monthly'],
    queryFn: () => ds.getMonthlyRealization(),
  });

  const handleExport = () => {
    const csv = toCsv(transactions ?? []);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maliyye-emeliyyatlari.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryBreakdown = totals
    ? [
        { category: 'Сумма заказа (наличные)', amount: totals.saleAmount },
        { category: 'Комиссия', amount: totals.commission },
        { category: 'Доставка', amount: totals.delivery },
        { category: 'Прочие услуги', amount: totals.otherServices },
        { category: 'Возвраты', amount: totals.returns },
      ]
    : [];

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap>
          <DatePicker.RangePicker
            value={[dayjs(range.start), dayjs(range.end)]}
            allowClear={false}
            onChange={(vals) => {
              if (vals && vals[0] && vals[1]) setRange({ start: vals[0].format('YYYY-MM-DD'), end: vals[1].format('YYYY-MM-DD') });
            }}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Экспорт CSV (операции)
          </Button>
        </Space>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="Сумма заказа, реализация и сумма к выплате — разные показатели"
        description="«Сумма заказа» — сумма, уплаченная покупателем. «Реализация» — отчёт Ozon за период за вычетом комиссии и доставки. «Сумма к выплате» — сумма всех операций в этом демо-наборе."
      />

      {totals && (
        <div className="kpi-grid">
          <KpiCard title="Сумма заказа" value={formatRub(totals.saleAmount)} />
          <KpiCard title="Комиссия" value={formatRub(totals.commission)} />
          <KpiCard title="Доставка" value={formatRub(totals.delivery)} />
          <KpiCard title="Прочие услуги" value={formatRub(totals.otherServices)} />
          <KpiCard title="Возвраты" value={formatRub(totals.returns)} />
          <KpiCard title="Сумма к выплате" value={formatRub(totals.payout)} valueColor="var(--success)" />
        </div>
      )}

      <Tabs
        items={[
          {
            key: 'tx',
            label: 'Операции',
            children: (
              <Card size="small">
                <div className="table-scroll-wrap">
                  <Table
                    size="small"
                    rowKey="transactionId"
                    loading={txLoading}
                    dataSource={transactions ?? []}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    columns={[
                      { title: 'ID', dataIndex: 'transactionId' },
                      { title: 'Дата', dataIndex: 'date' },
                      { title: 'Posting', dataIndex: 'postingNumber' },
                      {
                        title: 'Тип',
                        dataIndex: 'type',
                        render: (v: FinanceTransactionType) => <Tag color={TYPE_LABEL[v].color}>{TYPE_LABEL[v].text}</Tag>,
                      },
                      { title: 'Категория', dataIndex: 'category' },
                      {
                        title: 'Сумма',
                        dataIndex: 'amount',
                        render: (v: number) => (
                          <span style={{ color: v < 0 ? 'var(--danger)' : 'var(--success)' }}>{formatRub(v)}</span>
                        ),
                      },
                    ]}
                  />
                </div>
              </Card>
            ),
          },
          {
            key: 'totals',
            label: 'Итоги',
            children: (
              <Card size="small">
                <Column data={categoryBreakdown} xField="category" yField="amount" height={300} axis={{ x: { labelAutoRotate: true } }} />
              </Card>
            ),
          },
          {
            key: 'daily',
            label: 'Ежедневная реализация',
            children: (
              <Card size="small">
                <div className="table-scroll-wrap">
                  <Table
                    size="small"
                    rowKey="date"
                    dataSource={dailyRealization ?? []}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      { title: 'Дата', dataIndex: 'date' },
                      { title: 'Сумма заказа', dataIndex: 'saleAmount', render: (v: number) => formatRub(v) },
                      { title: 'Komissiya', dataIndex: 'commission', render: (v: number) => formatRub(v) },
                      { title: 'Доставка', dataIndex: 'delivery', render: (v: number) => formatRub(v) },
                      { title: 'Сумма к выплате', dataIndex: 'payout', render: (v: number) => formatRub(v) },
                    ]}
                  />
                </div>
              </Card>
            ),
          },
          {
            key: 'monthly',
            label: 'Ежемесячная реализация',
            children: (
              <Card size="small">
                <Table
                  size="small"
                  rowKey="month"
                  dataSource={monthlyRealization ?? []}
                  pagination={false}
                  columns={[
                    { title: 'Месяц', dataIndex: 'month' },
                    { title: 'Сумма заказа', dataIndex: 'saleAmount', render: (v: number) => formatRub(v) },
                    { title: 'Komissiya', dataIndex: 'commission', render: (v: number) => formatRub(v) },
                    { title: 'Доставка', dataIndex: 'delivery', render: (v: number) => formatRub(v) },
                    { title: 'Сумма к выплате', dataIndex: 'payout', render: (v: number) => formatRub(v) },
                    {
                      title: 'Статус сверки',
                      dataIndex: 'reconciled',
                      render: (v: boolean) => <Tag color={v ? 'green' : 'gold'}>{v ? 'Сверено' : 'Текущий месяц'}</Tag>,
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
