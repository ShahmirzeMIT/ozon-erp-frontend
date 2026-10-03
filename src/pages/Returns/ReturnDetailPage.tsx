import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Card, Descriptions, Image, Result, Skeleton, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useDataSource } from '../../hooks/useDataSource';
import { formatRub } from '../../components/format';
import type { ReturnReason, ReturnStatus } from '../../types';

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

function dateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('az-AZ') : 'Məlumat yoxdur';
}

function valueOf(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Məlumat yoxdur';
  if (typeof value === 'boolean') return value ? 'Bəli' : 'Xeyr';
  return String(value);
}

export function ReturnDetailPage() {
  const { returnId = '' } = useParams();
  const navigate = useNavigate();
  const ds = useDataSource();
  const { data: item, isLoading } = useQuery({
    queryKey: ['return', returnId],
    queryFn: () => ds.getReturn(returnId),
    enabled: !!returnId,
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!item) {
    return (
      <Result
        status="404"
        title="Qaytarma tapılmadı"
        extra={<Button type="primary" onClick={() => navigate('/returns')}>Qaytarmalara qayıt</Button>}
      />
    );
  }

  const status = STATUS_LABEL[item.status] || STATUS_LABEL.requested;
  const returnReasonName = item.reasonName || String(item.source?.return_reason_name || '');
  const source = item.source || {};
  const sourceProduct = (source.product || {}) as Record<string, unknown>;
  const sourcePrice = (sourceProduct.price || {}) as Record<string, unknown>;
  const sourcePriceWithoutCommission = (sourceProduct.price_without_commission || {}) as Record<string, unknown>;
  const sourceCommission = (sourceProduct.commission || {}) as Record<string, unknown>;
  const sourceStorage = (source.storage || {}) as Record<string, unknown>;
  const sourceStorageSum = (sourceStorage.sum || {}) as Record<string, unknown>;
  const sourceStorageUtilization = (sourceStorage.utilization_sum || {}) as Record<string, unknown>;
  const sourceLogistic = (source.logistic || {}) as Record<string, unknown>;
  const sourceVisual = (source.visual || {}) as Record<string, unknown>;
  const sourceVisualStatus = (sourceVisual.status || {}) as Record<string, unknown>;
  const sourcePlace = (source.place || {}) as Record<string, unknown>;
  const sourceTargetPlace = (source.target_place || {}) as Record<string, unknown>;
  const sourceAdditional = (source.additional_info || {}) as Record<string, unknown>;
  const sourceExemplars = Array.isArray(source.exemplars) ? source.exemplars : [];

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/returns')}>Geri</Button>
      </Space>

      <Alert
        type="warning"
        showIcon
        message={`Qaytarma ID-si: ${item.returnId}`}
        description={(
          <Space direction="vertical" size={2}>
            <span>{returnReasonName || 'Ozon cavabında qaytarma səbəbi göstərilməyib'}</span>
            <span>
              Tip: <strong>{item.returnType || item.type}</strong> · Status: <strong>{status.text}</strong> · Əlaqəli posting: <strong>{item.postingNumber || 'Məlumat yoxdur'}</strong>
            </span>
          </Space>
        )}
        style={{ marginBottom: 12 }}
      />

      <Card size="small" className="section-card" title={`Qaytarma ${item.returnId}`}>
        <Descriptions bordered size="small" column={3}>
          <Descriptions.Item label="Qaytarma ID-si">{item.returnId}</Descriptions.Item>
          <Descriptions.Item label="Əlaqəli posting">
            {item.postingNumber ? <Link to={`/orders/${item.postingNumber}`}>{item.postingNumber}</Link> : 'Məlumat yoxdur'}
          </Descriptions.Item>
          <Descriptions.Item label="Tip"><Tag>{item.returnType || item.type}</Tag></Descriptions.Item>
          <Descriptions.Item label="Səbəb">{returnReasonName || REASON_LABEL[item.reason] || 'Məlumat yoxdur'}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={status.color}>{status.text}</Tag></Descriptions.Item>
          <Descriptions.Item label="Ozon statusu">{valueOf(sourceVisualStatus.display_name || item.visualStatus)}</Descriptions.Item>
          <Descriptions.Item label="Məbləğ">{formatRub(item.amount)}</Descriptions.Item>
          <Descriptions.Item label="Tarix">{dateTime(item.returnDate || item.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Sifariş nömrəsi">{item.orderNumber || 'Məlumat yoxdur'}</Descriptions.Item>
        </Descriptions>
      </Card>

  

      <div className="return-location-grid">
        <Card size="small" title="Qaytarılma yeri" className="section-card">
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="ID">{valueOf(sourcePlace.id || item.place?.id)}</Descriptions.Item>
            <Descriptions.Item label="Ad">{valueOf(sourcePlace.name || item.place?.name)}</Descriptions.Item>
            <Descriptions.Item label="Ünvan">{valueOf(sourcePlace.address || item.place?.address)}</Descriptions.Item>
          </Descriptions>
        </Card>
        <Card size="small" title="Hədəf yeri" className="section-card">
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="ID">{valueOf(sourceTargetPlace.id || item.targetPlace?.id)}</Descriptions.Item>
            <Descriptions.Item label="Ad">{valueOf(sourceTargetPlace.name || item.targetPlace?.name)}</Descriptions.Item>
            <Descriptions.Item label="Ünvan">{valueOf(sourceTargetPlace.address || item.targetPlace?.address)}</Descriptions.Item>
          </Descriptions>
        </Card>
      </div>

      <Card size="small" title="Ozon məhsul və ödəniş məlumatları" className="section-card">
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="Məhsul adı">{valueOf(sourceProduct.name || item.productName)}</Descriptions.Item>
          <Descriptions.Item label="SKU">{valueOf(sourceProduct.sku || item.sku)}</Descriptions.Item>
          <Descriptions.Item label="Offer ID">{valueOf(sourceProduct.offer_id || item.productOfferId)}</Descriptions.Item>
          <Descriptions.Item label="Qiymət">{valueOf(sourcePrice.price)} {valueOf(sourcePrice.currency_code)}</Descriptions.Item>
          <Descriptions.Item label="Komissiyasız qiymət">{valueOf(sourcePriceWithoutCommission.price)} {valueOf(sourcePriceWithoutCommission.currency_code)}</Descriptions.Item>
          <Descriptions.Item label="Komissiya faizi">{valueOf(sourceProduct.commission_percent)}%</Descriptions.Item>
          <Descriptions.Item label="Komissiya məbləği">{valueOf(sourceCommission.price)} {valueOf(sourceCommission.currency_code)}</Descriptions.Item>
          <Descriptions.Item label="Miqdar">{valueOf(sourceProduct.quantity || item.quantity)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="Logistika və saxlama məlumatları" className="section-card">
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="Qaytarma tarixi">{dateTime(String(sourceLogistic.return_date || ''))}</Descriptions.Item>
          <Descriptions.Item label="Yekun tarix">{dateTime(String(sourceLogistic.final_moment || ''))}</Descriptions.Item>
          <Descriptions.Item label="Texniki qaytarma">{dateTime(String(sourceLogistic.technical_return_moment || ''))}</Descriptions.Item>
          <Descriptions.Item label="Barkod">{valueOf(sourceLogistic.barcode || item.barcode)}</Descriptions.Item>
          <Descriptions.Item label="Saxlama günləri">{valueOf(sourceStorage.days ?? item.storageDays)}</Descriptions.Item>
          <Descriptions.Item label="Saxlama məbləği">{valueOf(sourceStorageSum.price)} {valueOf(sourceStorageSum.currency_code)}</Descriptions.Item>
          <Descriptions.Item label="Tarifikasiya ilk tarixi">{dateTime(String(sourceStorage.tariffication_first_date || ''))}</Descriptions.Item>
          <Descriptions.Item label="Tarifikasiya başlanğıcı">{dateTime(String(sourceStorage.tariffication_start_date || ''))}</Descriptions.Item>
          <Descriptions.Item label="Məhsulun çatma anı">{dateTime(String(sourceStorage.arrived_moment || ''))}</Descriptions.Item>
          <Descriptions.Item label="Utilizasiya məbləği">{valueOf(sourceStorageUtilization.price)} {valueOf(sourceStorageUtilization.currency_code)}</Descriptions.Item>
          <Descriptions.Item label="Utilizasiya proqnozu">{dateTime(String(sourceStorage.utilization_forecast_date || ''))}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="Status və texniki məlumatlar" className="section-card">
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="Status ID">{valueOf(sourceVisualStatus.id)}</Descriptions.Item>
          <Descriptions.Item label="Sistem statusu">{valueOf(sourceVisualStatus.sys_name)}</Descriptions.Item>
          <Descriptions.Item label="Status dəyişmə vaxtı">{dateTime(String(sourceVisual.change_moment || ''))}</Descriptions.Item>
          <Descriptions.Item label="Sifariş ID-si">{valueOf(source.order_id || item.orderId)}</Descriptions.Item>
          <Descriptions.Item label="Şirkət ID-si">{valueOf(source.company_id)}</Descriptions.Item>
          <Descriptions.Item label="Clearing ID">{valueOf(source.clearing_id)}</Descriptions.Item>
          <Descriptions.Item label="Return clearing ID">{valueOf(source.return_clearing_id)}</Descriptions.Item>
          <Descriptions.Item label="Source ID">{valueOf(source.source_id)}</Descriptions.Item>
          <Descriptions.Item label="Kompensasiya statusu">{valueOf(source.compensation_status || item.compensationStatus)}</Descriptions.Item>
          <Descriptions.Item label="Məhsul açılıb?">{valueOf(sourceAdditional.is_opened)}</Descriptions.Item>
          <Descriptions.Item label="Super ekonom?">{valueOf(sourceAdditional.is_super_econom)}</Descriptions.Item>
          <Descriptions.Item label="Exemplar">{sourceExemplars.length ? JSON.stringify(sourceExemplars) : 'Məlumat yoxdur'}</Descriptions.Item>
        </Descriptions>
      </Card>

   

      <Card size="small" title="Qaytarılan məhsul" className="section-card">
        <Space align="start">
          {item.imageUrl ? <Image src={item.imageUrl} width={120} height={120} preview style={{ objectFit: 'cover', borderRadius: 10 }} /> : <span style={{ fontSize: 48 }}>📦</span>}
          <div>
            <Typography.Text strong>{item.productName || item.productId}</Typography.Text>
            <div className="muted">Məhsul ID-si: {item.productId}</div>
          </div>
        </Space>
      </Card>

   
    </div>
  );
}
