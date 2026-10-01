import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Tag, Typography } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
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
      text: 'Salam! Sualınızı yazın — cavablar seçilmiş tarix aralığındakı Ozon məlumatlarından hesablanır.',
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
    const insight = await ds.getAiInsight(query, dateRange);
    setMessages((m) => [...m, { role: 'assistant', text: insight.answer, insight }]);
    setLoading(false);
  };

  return (
    <div>
      <Card size="small" className="section-card">
        <Space wrap>
          <span className="muted">
            Cavablar lokal backend-də saxlanılan son Ozon sinxronizasiyası və seçilmiş tarix aralığı əsasında hesablanır.
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
                <Space size={4} wrap>
                  <Tag>Metod: {m.insight.method}</Tag>
                  <Tag>Dövr: {m.insight.rangeStart} — {m.insight.rangeEnd}</Tag>
                </Space>
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
