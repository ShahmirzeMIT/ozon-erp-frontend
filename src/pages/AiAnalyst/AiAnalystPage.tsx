import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Tag, Typography } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
import { useAppState } from '../../hooks/useAppState';
import { useDataSource } from '../../hooks/useDataSource';
import { DemoTag } from '../../components/DemoTag';
import type { AiInsight } from '../../types';

const QUICK_QUESTIONS = [
  'У какого товара снизились продажи?',
  'У какого товара запас закончится за 7 дней?',
  'Почему выросла доля возвратов?',
  'Лучшие товары за последние 30 дней',
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
      text: 'Здравствуйте! Я демо AI-аналитик. Выберите готовый вопрос ниже или напишите свой — ответы рассчитываются на текущем демо-наборе данных.',
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
          <DemoTag label="Демо-анализ" />
          <span className="muted">
            В этой версии запросы к Gemini API с frontend не выполняются. Ответы — детерминированные результаты демо-набора данных.
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
                  <RobotOutlined /> <b>AI-аналитик</b>
                </div>
              )}
              <Typography.Paragraph style={{ marginBottom: m.insight ? 8 : 0 }}>{m.text}</Typography.Paragraph>
              {m.insight && (
                <Space size={4} wrap>
                  <DemoTag label="Демо-анализ" />
                  <Tag>Metod: {m.insight.method}</Tag>
                  <Tag>Период: {m.insight.rangeStart} — {m.insight.rangeEnd}</Tag>
                </Space>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Введите вопрос..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => ask(input)}
            disabled={loading}
          />
          <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={() => ask(input)}>
            Отправить
          </Button>
        </Space.Compact>
      </Card>
    </div>
  );
}
