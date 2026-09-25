import { Tag } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';

export function DemoTag({ label = 'Демо-данные' }: { label?: string }) {
  return (
    <Tag className="demo-tag" color="gold" icon={<ExperimentOutlined />}>
      {label}
    </Tag>
  );
}
