import { theme as antdTheme, type ThemeConfig } from 'antd';

export function getAntdTheme(mode: 'light' | 'dark'): ThemeConfig {
  const isDark = mode === 'dark';
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1f6feb',
      colorSuccess: '#12805c',
      colorWarning: '#b7791f',
      colorError: '#c53030',
      borderRadius: 8,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      colorBgLayout: isDark ? '#0d1526' : '#f5f7fb',
      colorBgContainer: isDark ? '#121d33' : '#ffffff',
      colorBorder: isDark ? '#22304a' : '#e6eaf2',
      colorText: isDark ? '#eef2f9' : '#101828',
      colorTextSecondary: isDark ? '#97a4bd' : '#5c6b82',
    },
    components: {
      Layout: {
        siderBg: '#0b1f3a',
        headerBg: isDark ? '#121d33' : '#ffffff',
        bodyBg: isDark ? '#0d1526' : '#f5f7fb',
      },
      Menu: {
        darkItemBg: '#0b1f3a',
        darkItemSelectedBg: '#1a3660',
        darkItemHoverBg: '#122a4d',
      },
      Table: {
        headerBg: isDark ? '#16223c' : '#f7f9fc',
      },
      Card: {
        colorBorderSecondary: isDark ? '#22304a' : '#e6eaf2',
      },
    },
  };
}
