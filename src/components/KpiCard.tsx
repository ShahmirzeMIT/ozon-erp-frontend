import { Card, Statistic, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: ReactNode;
  precision?: number;
  valueColor?: string;
  tooltip?: string;
  loading?: boolean;
}

export function KpiCard({ title, value, suffix, prefix, precision, valueColor, tooltip, loading }: KpiCardProps) {
  return (
    <Card size="small" className="section-card" loading={loading}>
      <Statistic
        title={
          tooltip ? (
            <span>
              {title}{' '}
              <Tooltip title={tooltip}>
                <InfoCircleOutlined style={{ color: 'var(--text-secondary)' }} />
              </Tooltip>
            </span>
          ) : (
            title
          )
        }
        value={value}
        suffix={suffix}
        prefix={prefix}
        precision={precision}
        valueStyle={valueColor ? { color: valueColor } : undefined}
      />
    </Card>
  );
}
