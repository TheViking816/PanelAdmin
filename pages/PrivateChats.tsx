import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { monitorRequest, MonitoredMessage } from '../services/chatMonitor';

const format = (value: string | null) => value ? new Date(value).toLocaleString('es-ES') : '—';
export const PrivateChatsPage: React.FC = () => {
  const [rows, setRows] = useState<MonitoredMessage[]>([]);
  const [chapa, setChapa] = useState('');
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const [applied, setApplied] = useState<Record<string, unknown>>({});
  async function load(append = false) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1);
      const filters = append ? applied : { chapa: chapa.trim(), from: new Date(`${from}T00:00:00`).toISOString(), to: end.toISOString() };
      const last = rows.at(-1);
      const result: MonitoredMessage[] = await monitorRequest('monitor_messages', { ...filters, ...(append && last ? { before: last.sent_at, before_id: last.message_id } : {}) });
      setRows(old => append ? [...old, ...result.slice(0, 100)] : result.slice(0, 100));
      setMore(result.length > 100); setApplied(filters);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  return <div className="space-y-5 text-slate-800 dark:text-slate-100">
    <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white flex gap-2 items-center"><MessageSquare /> Chats privados</h1>
      <p className="text-sm text-slate-500 mt-2">Mensajes, chapas y confirmaciones reales. Las consultas quedan registradas para auditoría.</p></div>
    <form onSubmit={e => { e.preventDefault(); void load(); }} className="flex flex-wrap gap-3 items-end bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
      <label className="text-sm">Chapa emisora o destinataria<input value={chapa} onChange={e => setChapa(e.target.value)} placeholder="Todas" maxLength={12} className="block border rounded-lg p-2 mt-1 dark:bg-slate-900" /></label>
      <label className="text-sm">Desde<input type="date" value={from} required onChange={e => setFrom(e.target.value)} className="block border rounded-lg p-2 mt-1 dark:bg-slate-900" /></label>
      <label className="text-sm">Hasta<input type="date" value={to} required onChange={e => setTo(e.target.value)} className="block border rounded-lg p-2 mt-1 dark:bg-slate-900" /></label>
      <button disabled={busy} className="bg-port-900 text-white rounded-lg px-4 py-2 flex gap-2 items-center"><RefreshCw size={16} />{busy ? 'Cargando…' : 'Actualizar'}</button>
    </form>
    {error && <p role="alert" className="bg-red-50 text-red-800 p-3 rounded-lg">{error}</p>}
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
      <table className="w-full text-sm text-left"><thead className="bg-slate-50 dark:bg-slate-900 text-slate-500"><tr>{['Enviado', 'Emisor', 'Destinatario', 'Mensaje', 'Entregado', 'Leído'].map(label => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.message_id} className="border-t border-slate-100 dark:border-slate-700"><td className="p-3 whitespace-nowrap">{format(row.sent_at)}</td><td className="p-3 font-semibold">{row.sender_chapa}</td><td className="p-3 font-semibold">{row.recipient_chapa}</td><td className="p-3 min-w-64 max-w-lg whitespace-pre-wrap break-words">{row.body}</td><td className="p-3 whitespace-nowrap">{format(row.delivered_at)}</td><td className="p-3 whitespace-nowrap">{format(row.read_at)}</td></tr>)}</tbody></table>
      {!rows.length && !busy && <p className="p-8 text-center text-slate-500">No hay mensajes en este intervalo.</p>}
    </div>
    {more && <button disabled={busy} onClick={() => void load(true)} className="bg-port-900 text-white rounded-lg px-4 py-2">Cargar más</button>}
  </div>;
};
