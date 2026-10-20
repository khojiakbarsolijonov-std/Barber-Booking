export function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ').format(price ?? 0) + " so'm";
}

export function formatPhone(phone: string): string {
  return phone ?? '';
}

export function formatDuration(min: number): string {
  if (!min) return '0 daq';
  if (min < 60) return `${min} daq`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} soat ${m} daq` : `${h} soat`;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'Yangi',
    confirmed: 'Tasdiqlangan',
    in_progress: 'Xizmat ko\'rsatilmoqda',
    completed: 'Xizmat ko\'rsatildi',
    cancelled: 'Bekor qilingan',
    no_show: 'Kelmagan',
  };
  return map[status ?? ''] ?? status ?? '';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-500',
    confirmed: 'bg-emerald-500',
    in_progress: 'bg-amber-500',
    completed: 'bg-green-600',
    cancelled: 'bg-red-500',
    no_show: 'bg-gray-500',
  };
  return map[status ?? ''] ?? 'bg-gray-400';
}
