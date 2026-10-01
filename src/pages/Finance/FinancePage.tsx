import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, DatePicker, Button, Space, Alert, Empty } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppState } from '../../hooks/useAppState';
import { useDataSource } from '../../hooks/useDataSource';
import type { OzonRealizationRow } from '../../services/ErpDataSource';

function toCsv(rows: OzonRealizationRow[]): string {
  const header = ['Sətir', 'Hesabat tarixi', 'Məhsul', 'Offer ID', 'SKU', 'Ozon xam JSON'];
  const lines = rows.map((row) => {
    const item = (row.item as Record<string, unknown>) || {};
    return [row.rowNumber, row.reportDate, item.name, item.offer_id, item.sku, JSON.stringify(row)]
      .map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`)
      .join(',');
  });
  return [header.join(','), ...lines].join('\n');
}

export function FinancePage() {
  const { dateRange } = useAppState();
  const ds = useDataSource();
  const [range, setRange] = useState(dateRange);
  useEffect(() => setRange(dateRange), [dateRange]);

  const { data: rawRealization, isLoading: rawLoading } = useQuery({
    queryKey: ['finance-realization-raw', range],
    queryFn: () => ds.getRawRealization(range),
  });

  const handleExport = () => {
    const csv = toCsv(rawRealization ?? []);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ozon-xam-realizasiya.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const rawValue = (row: OzonRealizationRow, key: string) => row[key] as string | number | null | undefined;
  const commission = (row: OzonRealizationRow) => (row.delivery_commission || {}) as Record<string, unknown>;

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
            Ozon xam məlumatını CSV yüklə
          </Button>
        </Space>
      </Card>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="Burada yalnız Ozon API-dən gələn məlumat göstərilir"
        description="Backend və frontend bu sətrlərin məbləğlərini toplamır, dəyişmir və yeni maliyyə rəqəmi yaratmır. Bütün əlavə field-lərə sətrin ox işarəsindən daxil ola bilərsiniz."
      />

      <Card size="small" title="Ozon-dan gələn xam realizasiya məlumatları">
        <Alert type="info" showIcon message="Hesablanma yoxdur" description="Field-lər Ozon-un /v2/finance/realization cavabından olduğu kimi göstərilir. Seçilmiş ay üçün hesabat hazır deyilsə, aşağıdakı mesaj görünəcək." style={{ marginBottom: 12 }} />
        {!rawLoading && !(rawRealization ?? []).length ? <Empty description="Seçilmiş ay üçün Ozon hesabatı hələ hazırlanmayıb" /> : (
          <div className="table-scroll-wrap">
            <Table
              size="small"
              rowKey={(row) => String(row.rowNumber)}
              loading={rawLoading}
              dataSource={rawRealization ?? []}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              expandable={{
                expandedRowRender: (row) => <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(row, null, 2)}</pre>,
              }}
              columns={[
                      { title: 'Sətir', dataIndex: 'rowNumber' },
                      { title: 'Hesabat tarixi', dataIndex: 'reportDate' },
                      { title: 'Məhsul', render: (_: unknown, row) => String((row.item as Record<string, unknown>)?.name ?? '') },
                      { title: 'Offer ID', render: (_: unknown, row) => String((row.item as Record<string, unknown>)?.offer_id ?? '') },
                      { title: 'SKU', render: (_: unknown, row) => String((row.item as Record<string, unknown>)?.sku ?? '') },
                      { title: 'Satıcı qiyməti', render: (_: unknown, row) => String(rawValue(row, 'seller_price_per_instance') ?? '') },
                      { title: 'Miqdar', render: (_: unknown, row) => String(commission(row).quantity ?? '') },
                      { title: 'Standart komissiya', render: (_: unknown, row) => String(commission(row).standard_fee ?? '') },
                      { title: 'Ümumi xidmət', render: (_: unknown, row) => String(commission(row).total ?? '') },
                      { title: 'Komissiya faizi', render: (_: unknown, row) => String(rawValue(row, 'commission_ratio') ?? '') },
                    ]}
                  />
                </div>
        )}
      </Card>
    </div>
  );
}
