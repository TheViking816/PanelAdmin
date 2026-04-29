import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../components/UI';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Line
} from 'recharts';
import { Users, Eye, Zap, Activity, Monitor, Globe, Clock, Crown } from 'lucide-react';
import { DashboardData } from '../types';
import { fetchDashboardData } from '../services/supabaseClient';

const MADRID_TIME_ZONE = 'Europe/Madrid';

const parseSupabaseDate = (value: string) => {
  const normalized = String(value || '').trim();
  if (!normalized) return null;

  // `timestamp without time zone` values from Supabase often arrive without an offset.
  // Treat them as UTC so the rendered hour is consistent in the admin.
  const hasExplicitOffset = /(?:[zZ]|[+-]\d{2}:\d{2})$/.test(normalized);
  const candidate = hasExplicitOffset ? normalized : normalized.replace(' ', 'T') + 'Z';
  const parsed = new Date(candidate);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatMadridDateTime = (value: string) => {
  const parsed = parseSupabaseDate(value);
  if (!parsed) return '--';

  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    timeZone: MADRID_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);

  const formattedTime = new Intl.DateTimeFormat('es-ES', {
    timeZone: MADRID_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);

  return `${formattedDate} ${formattedTime}`;
};

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; icon: React.ReactNode; color: string }> = ({ title, value, subtext, icon, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</h3>
      {subtext && <p className="text-xs mt-2 font-medium text-slate-400">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${color} text-white shadow-sm`}>
      {icon}
    </div>
  </div>
);

const NewChapaBadge: React.FC = () => (
  <Badge color="blue">Nueva</Badge>
);

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapaQuery, setChapaQuery] = useState('');
  const timeLabel = 'Últimas 24h';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchDashboardData();
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  const getTimeLabel = () => timeLabel;

  const isNewChapa = (value: string | null | undefined) => {
    const chapa = String(value || '').trim();
    return chapa.length > 0 && !!data?.newChapas?.includes(chapa);
  };

  const getTimelineEvents = () => {
    if (!data) return [];
    const normalized = chapaQuery.trim().toLowerCase();
    let events = data.timelineEvents;
    if (!normalized) return events;

    const last24Threshold = Date.now() - 24 * 60 * 60 * 1000;

    events = events.filter((event) => {
      const ts = new Date(event.date);
      if (Number.isNaN(ts.getTime())) return false;
      if (ts.getTime() < last24Threshold) return false;
      return (event.details || '').toLowerCase().includes(normalized);
    });

    return [...events].sort((a, b) => (
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  };

  const timelineEvents = getTimelineEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-port-600 dark:text-port-400" />
            Activity Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Analítica de uso en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1.5">
            <Clock size={14} /> {timeLabel}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-port-700 dark:border-port-400"></div>
            <p className="text-slate-400 text-sm">Procesando datos del período...</p>
          </div>
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-red-500">Error cargando datos.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <StatCard
              title="Usuarios Diferentes (24h)"
              value={data.kpi.monthlyActiveUsers}
              subtext="Han accedido a la PWA"
              icon={<Activity size={24} />}
              color="bg-indigo-600"
            />
            <StatCard
              title="Total Visualizaciones"
              value={data.kpi.totalViews}
              subtext={`Páginas vistas (${getTimeLabel()})`}
              icon={<Eye size={24} />}
              color="bg-emerald-500"
            />
            <StatCard
              title="Pico Usuarios Diferentes (1h)"
              value={data.kpi.peakHourlyUniqueUsers}
              subtext="Máx. usuarios distintos en una hora"
              icon={<Users size={24} />}
              color="bg-blue-600"
            />
            <StatCard
              title="Pico Visitas (1h)"
              value={data.kpi.peakHourlyViews}
              subtext="Máx. vistas en una hora"
              icon={<Eye size={24} />}
              color="bg-indigo-600"
            />
            <StatCard
              title="Usuarios medios / hora"
              value={data.kpi.averageHourlyUsers}
              subtext={`Promedio por hora (${getTimeLabel()})`}
              icon={<Users size={24} />}
              color="bg-teal-600"
            />
            <StatCard
              title="Premium Activos"
              value={data.kpi.premiumUsers}
              subtext="Suscripciones vigentes"
              icon={<Zap size={24} />}
              color="bg-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Usuarios Más Activos" className="min-w-0 h-full">
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {data.topUsers.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Sin actividad registrada</div>
                ) : (
                  data.topUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs flex-shrink-0 ${
                          idx === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200' :
                          idx === 1 ? 'bg-slate-200 text-slate-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-white dark:bg-slate-600 text-slate-400'
                        }`}>
                          {idx < 3 ? <Crown size={14} className={idx === 0 ? 'fill-amber-700' : ''} /> : idx + 1}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                              {user.name}
                            </span>
                            {isNewChapa(user.name) && <NewChapaBadge />}
                            {user.isPremium && <Badge color="yellow">Premium</Badge>}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase">Chapa / ID</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="block text-sm font-bold text-port-700 dark:text-port-400">{user.value}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card title="Últimos Registros Completados" className="min-w-0 h-full">
              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {data.latestCompletedRegistrations.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Sin registros completados recientes</div>
                ) : (
                  data.latestCompletedRegistrations.map((user, idx) => (
                    <div
                      key={`${user.chapa}-${user.updated_at}-${idx}`}
                      className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {user.nombre}
                          </span>
                          {isNewChapa(user.chapa) && <NewChapaBadge />}
                          {user.isPremium && <Badge color="yellow">Premium</Badge>}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user.chapa} · {user.email}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono text-right whitespace-nowrap">
                        {formatMadridDateTime(user.updated_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card
            className="min-w-0"
            title={`Actividad: ${getTimeLabel()}`}
            action={
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  Visitas
                </span>
                <span className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
                  Usuarios únicos
                </span>
              </div>
            }
          >
            <div className="h-[420px] w-full min-w-0">
              {data.activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.activityData} margin={{ top: 16, right: 24, left: 12, bottom: 8 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      minTickGap={24}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="views"
                      orientation="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#10b981', fontSize: 12 }}
                      width={56}
                    />
                    <YAxis
                      yAxisId="users"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#4f46e5', fontSize: 12 }}
                      width={56}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      yAxisId="views"
                      name="Páginas vistas"
                      type="monotone"
                      dataKey="vistas"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                    <Line
                      yAxisId="users"
                      name="Usuarios únicos"
                      type="monotone"
                      dataKey="usuarios"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                  Sin datos de actividad reciente
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Vistas por Página" className="min-w-0">
              <div className="w-full overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {data.topPages.length > 0 ? (
                  <div style={{ height: Math.max(300, data.topPages.length * 35 + 50), width: '100%', minHeight: 300 }} className="min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={data.topPages} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                    Sin datos de navegación en este período
                  </div>
                )}
              </div>
            </Card>

            <Card
              title="Últimos Accesos (En Tiempo Real)"
              className="lg:col-span-2"
              action={
                <div className="flex items-center gap-2">
                  <input
                    value={chapaQuery}
                    onChange={(e) => setChapaQuery(e.target.value)}
                    placeholder="Buscar chapa..."
                    className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:border-port-500 focus:ring-1 focus:ring-port-500"
                  />
                  {chapaQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setChapaQuery('')}
                      className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              }
            >
              {chapaQuery.trim().length > 0 && (
                <div className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                  Historial de las últimas 24h para la chapa "{chapaQuery.trim()}"
                </div>
              )}
              <div className="space-y-0 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {timelineEvents.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    {chapaQuery.trim().length > 0 ? 'Sin accesos en las últimas 24h para esa chapa' : 'No hay eventos recientes'}
                  </div>
                )}
                {timelineEvents.map((event, idx) => {
                  let Icon = Globe;
                  let colorClass = 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300';

                  const pageDetails = event.meta || '';

                  if (pageDetails.includes('home') || pageDetails === '/') {
                    Icon = Monitor;
                    colorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
                  } else if (pageDetails.includes('user')) {
                    Icon = Users;
                    colorClass = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
                  }

                  return (
                    <div key={idx} className="flex gap-4 relative group">
                      {idx !== timelineEvents.length - 1 && (
                        <div className="absolute left-[19px] top-8 bottom-[-16px] w-[2px] bg-slate-100 dark:bg-slate-700 group-last:hidden"></div>
                      )}

                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                          <Icon size={18} />
                        </div>
                      </div>

                      <div className="pb-6 pt-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {event.details}
                          </p>
                          {isNewChapa(event.details) && <NewChapaBadge />}
                          {event.isPremium && <Badge color="yellow">Premium</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                            {event.meta || '/'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {formatMadridDateTime(event.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
