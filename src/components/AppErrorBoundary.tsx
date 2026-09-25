import React from 'react';
import { Button, Result } from 'antd';

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Произошла непредвиденная ошибка.',
    };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Result
        status="error"
        title="Страница не загрузилась"
        subTitle={this.state.message}
        extra={[
          <Button key="reload" type="primary" onClick={() => window.location.reload()}>
            Перезагрузить
          </Button>,
          <Button key="home" onClick={() => { window.location.href = '/'; }}>
            На главную
          </Button>,
        ]}
      />
    );
  }
}
