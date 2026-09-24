export const COLORS = Object.freeze({ primary: 0x7c3aed, clan: 0x16a34a, error: 0xdc2626 });

export function truncate(value, max = 1024) {
  const text = String(value ?? '—');
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}…`;
}

export function number(value) {
  return typeof value === 'number' && value >= 0 ? new Intl.NumberFormat('vi-VN').format(value) : 'Riêng tư';
}

export function discordTime(value, style = 'R') {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? `<t:${Math.floor(timestamp / 1000)}:${style}>` : '—';
}

export function uuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function roleChoice(entry) {
  if (entry.role) return entry.role;
  if (Array.isArray(entry.roles)) return entry.roles.join(' / ');
  return 'unknown';
}

export function statusLabel(status) {
  return ({ PLAY: 'Đang chơi', DEFAULT: 'Online', DND: 'Không làm phiền', OFFLINE: 'Offline' })[status] || status || '—';
}
