import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Tag, Typography, Table } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/charts';
import { useAppState } from '../../hooks/useAppState';
import { useDataSource } from '../../hooks/useDataSource';
import type { AiInsight } from '../../types';

const QUICK_QUESTIONS = [
  'Hansı məhsulun satışları azalıb?',
  'Hansı məhsulun qalığı 7 günə bitəcək?',
  'Qaytarma faizi niyə artıb?',
  'Son 30 günün ən yaxşı məhsulları',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  insight?: AiInsight;
}

export function AiAnalystPage() {
  const { dateRange } = useAppState();
  const ds = useDataSource();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Salam! Sualınızı yazın — Gemini yalnız backend vasitəsilə Ozon-dan gələn real məlumatları axtaracaq və uyğun cədvəl/diaqram göstərəcək.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (query: string) => {
    if (!query.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setInput('');
    setLoading(true);
    try {
      const insight = await ds.getAiInsight(query, dateRange);
      setMessages((m) => [...m, { role: 'assistant', text: insight.answer, insight }]);
    } catch (error) {
      setMessages((m) => [...m, { role: 'assistant', text: error instanceof Error ? error.message : 'AI sorğusu icra olunmadı.' }]);
    }
    setLoading(false);
  };

  const renderVisualization = (insight: AiInsight) => {
    const visualization = insight.visualization;
    if (!visualization || visualization.type === 'none') return null;
    if (visualization.type === 'table') {
      const dataSource = visualization.rows.map((row, rowIndex) => ({
        key: rowIndex,
        ...Object.fromEntries(row.map((value, index) => [`column${index}`, value])),
      }));
      return (
        <Card size="small" title={visualization.title} style={{ marginTop: 12 }}>
          <Table
            size="small"
            pagination={false}
            scroll={{ x: true }}
            dataSource={dataSource}
            columns={visualization.columns.map((title, index) => ({ title, dataIndex: `column${index}`, key: `column${index}` }))}
          />
        </Card>
      );
    }
    return (
      <Card size="small" title={visualization.title} style={{ marginTop: 12 }}>
        <Column
          data={visualization.data}
          xField="label"
          yField="value"
          colorField="series"
          height={260}
          axis={{
            x: { title: visualization.xAxis },
            y: { title: visualization.yAxis },
          }}
        />
      </Card>
    );
  };

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap>
          <span className="muted">
            Gemini backend-də icazəli funksiyalarla yalnız son Ozon sinxronizasiyasından gələn real məlumatları axtarır.
          </span>
        </Space>
      </Card>

      <Card size="small" className="section-card">
        <Space wrap style={{ marginBottom: 16 }}>
          {QUICK_QUESTIONS.map((q) => (
            <Tag
              key={q}
              color="blue"
              style={{ cursor: 'pointer', padding: '4px 10px' }}
              onClick={() => ask(q)}
            >
              {q}
            </Tag>
          ))}
        </Space>

        <div style={{ minHeight: 320, maxHeight: 480, overflowY: 'auto', marginBottom: 16 }}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-bubble ${m.role}`}>
              {m.role === 'assistant' && (
                <div style={{ marginBottom: 4 }}>
                  <RobotOutlined /> <b>AI analitik</b>
                </div>
              )}
              <Typography.Paragraph style={{ marginBottom: m.insight ? 8 : 0 }}>{m.text}</Typography.Paragraph>
              {m.insight && (
                <>
                <Space size={4} wrap>
                  <Tag>Metod: {m.insight.method}</Tag>
                  <Tag>Dövr: {m.insight.rangeStart} — {m.insight.rangeEnd}</Tag>
                </Space>
                {renderVisualization(m.insight)}
                </>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Sualınızı yazın..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => ask(input)}
            disabled={loading}
          />
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => ask(input)}>
            Göndər
          </Button>
        </Space.Compact>
      </Card>
    </div>
  );
}
