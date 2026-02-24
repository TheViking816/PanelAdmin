import React, { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw, Search, Clock3, Users as UsersIcon, MapPinned } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { fetchDescansosUsage } from '../services/descansosUsageClient';
import { DescansosUsageRow } from '../types';

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRelative(value: string) {
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return '-';
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `Hace ${diffD} d`;
}

function getSectionLabel(path: string | null) {
  if (!path) return 'Sin seccion';
  switch (path) {
    case '/dashboard': return 'Tablon';
    case '/crear': return 'Publicar';
    case '/mis-ofertas': return 'Mis ofertas';
    case '/perfil': return 'Perfil';
    case '/login': return 'Login';
    case '/register': return 'Registro';
    default: return path;
  }
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; hint?: string }> = ({ title, value, icon, hint }) => (
  <Card className="p-0">
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
        <div className="text-port-700 dark:text-port-300">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      {hint ? <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</div> : null}
    </div>
  </Card>
);

export const DescansosPage: React.FC = () => {
  const [rows, setRows] = useState<DescansosUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const loadRows = async () => {
    setLoading(true);
    const data = await fetchDescansosUsage(2000);
    setRows(data);
    setLastRefresh(new Date().toISOString());
    setLoading(false);
  };

  useEffect(() => {
    loadRows();
    const interval = window.setInterval(loadRows, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) =>
      r.chapa.toLowerCase().includes(term) ||
      (r.seccion || '').toLowerCase().includes(term) ||
      getSectionLabel(r.seccion).toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  const kpis = useMemo(() => {
    const now = Date.now();
    const active5m = rows.filter((r) => now - new Date(r.ultima_actualizacion).getTime() <= 5 * 60_000).length;
    const active1h = rows.filter((r) => now - new Date(r.ultima_actualizacion).getTime() <= 60 * 60_000).length;
    const sections = new Set(rows.map((r) => r.seccion || '(vacío)'));
    return {
      total: rows.length,
      active5m,
      active1h,
      uniqueSections: sections.size,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-port-900 dark:text-white">Descansos CPE · Uso App</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Seguimiento de usuarios activos (chapa, ultima actualizacion y seccion visitada).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lastRefresh ? `Actualizado: ${formatRelative(lastRefresh)}` : 'Sin actualizar'}
          </span>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadRows}>
            Recargar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Usuarios trackeados" value={kpis.total} icon={<UsersIcon size={18} />} hint="1 fila por chapa" />
        <KpiCard title="Activos 5 min" value={kpis.active5m} icon={<Activity size={18} />} hint="Heartbeat visible" />
        <KpiCard title="Activos 1 h" value={kpis.active1h} icon={<Clock3 size={18} />} />
        <KpiCard title="Secciones distintas" value={kpis.uniqueSections} icon={<MapPinned size={18} />} />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por chapa o sección..."
              className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-port-500 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Auto-refresh cada 30s
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Chapa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Ultima actualización</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Sección</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Cargando actividad de Descansos...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Sin datos (o sin permisos de lectura en `uso_app`).</td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const ageMs = Date.now() - new Date(row.ultima_actualizacion).getTime();
                  const isActive = ageMs <= 5 * 60_000;
                  const isWarm = ageMs <= 60 * 60_000;
                  return (
                    <tr key={row.chapa} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {row.chapa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700 dark:text-slate-200">{formatDateTime(row.ultima_actualizacion)}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{formatRelative(row.ultima_actualizacion)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge color="blue">{getSectionLabel(row.seccion)}</Badge>
                          {row.seccion && row.seccion !== getSectionLabel(row.seccion) ? (
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{row.seccion}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isActive ? (
                          <Badge color="green">Activo</Badge>
                        ) : isWarm ? (
                          <Badge color="yellow">Reciente</Badge>
                        ) : (
                          <Badge color="gray">Inactivo</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filteredRows.length} filas visibles · {rows.length} totales
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Fuente: `public.uso_app` (Descansos)
          </span>
        </div>
      </Card>
    </div>
  );
};
