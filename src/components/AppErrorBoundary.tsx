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
      message: error instanceof Error ? error.message : 'Gözlənilməyən xəta baş verdi.',
    };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Result
        status="error"
      title="Səhifə yüklənmədi"
        subTitle={this.state.message}
        extra={[
          <Button key="reload" type="primary" onClick={() => window.location.reload()}>
            Yenidən yüklə
          </Button>,
          <Button key="home" onClick={() => { window.location.href = '/'; }}>
            Əsas səhifəyə qayıt
          </Button>,
        ]}
      />
    );
  }
}
