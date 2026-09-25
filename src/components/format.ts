export function formatRub(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(Math.round(value));
  return `${sign}${abs.toLocaleString('ru-RU')} ₽`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ru-RU');
}

export function formatPct(value: number): string {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}
