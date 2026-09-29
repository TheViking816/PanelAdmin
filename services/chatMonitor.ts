export const MONITOR_API = import.meta.env.VITE_PORTAL_MONITOR_API || 'https://portal-estiba-vlc.vercel.app/api/portal';
const handoff = window.location.hash.startsWith('#monitor_token=') ? decodeURIComponent(window.location.hash.slice('#monitor_token='.length)) : '';
if (handoff) {
  if (/^[0-9a-f]{64}$/.test(handoff)) sessionStorage.setItem('portal-monitor-session', handoff);
  window.history.replaceState(null, '', window.location.pathname + window.location.search + '#DASHBOARD');
}
let token = sessionStorage.getItem('portal-monitor-session') || '';
export function hasMonitorSession() { return Boolean(token); }
export async function monitorRequest(action: string, data: Record<string, unknown> = {}) {
  const response = await fetch(MONITOR_API, {
    method: 'POST', cache: 'no-store', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Portal-Request': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ action, ...data }), signal: AbortSignal.timeout(15000)
  });
  const result = await response.json();
  if (!response.ok) {
    if (result.code === 'UNAUTHORIZED') { token = ''; sessionStorage.removeItem('portal-monitor-session'); window.dispatchEvent(new Event('monitor-session-expired')); }
    throw new Error(result.error || 'No se pudo cargar la monitorización');
  }
  return result.data;
}
export async function monitorLogin(chapa: string, password: string) {
  const result = await monitorRequest('monitor_login', { chapa, password });
  token = result.token; sessionStorage.setItem('portal-monitor-session', token);
}
export async function monitorLogout() {
  await monitorRequest('monitor_logout'); token = ''; sessionStorage.removeItem('portal-monitor-session');
}
export async function fetchMonitorUsers(): Promise<any[]> { return monitorRequest('monitor_users'); }
export interface MonitoredMessage {
  message_id: string; conversation_id: string; sender_chapa: string; recipient_chapa: string;
  body: string; sent_at: string; delivered_at: string | null; read_at: string | null;
}
