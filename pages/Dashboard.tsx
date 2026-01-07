import React, { useEffect, useState } from 'react';
import { Card } from '../components/UI';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { Users, Eye, Zap, Activity, Monitor, Smartphone, Globe, Calendar, Crown } from 'lucide-react';
import { DashboardData } from '../types';
import { fetchDashboardData } from '../services/supabaseClient';

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

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('1d');

  useEffect(() => {
    loadData();
  }, [timeFilter]);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchDashboardData(timeFilter);
    if (result) {
      setData(result);
    }
    setLoading(false);
  }

  const getTimeLabel = () => {
    switch(timeFilter) {
      case '1d': return 'Últimas 24h';
      case '3d': return 'Últimos 3 días';
      case '7d': return 'Últimos 7 días';
      case '30d': return 'Últimos 30 días';
      case 'all': return 'Histórico Total';
      default: return 'Periodo';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
         <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Activity size={20} className="text-port-600 dark:text-port-400"/>
               Activity Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Analítica de uso en tiempo real</p>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar size={14} /> Filtro:
            </span>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="form-select text-sm border-slate-300 rounded-md shadow-sm focus:border-port-500 focus:ring-port-500 bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 px-3 py-1.5 outline-none border"
            >
               <option value="1d">Últimas 24 horas</option>
               <option value="3d">Últimos 3 días</option>
               <option value="7d">Últimos 7 días</option>
               <option value="30d">Últimos 30 días</option>
               <option value="all">Histórico (Todo)</option>
            </select>
         </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-port-700 dark:border-port-400"></div>
            <p className="text-slate-400 text-sm">Procesando datos del periodo...</p>
          </div>
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-red-500">Error cargando datos.</div>
      ) : (
        <>
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title={`Usuarios Diferentes (${timeFilter})`}
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
              title="Usuarios Registrados" 
              value={data.kpi.totalUsers} 
              subtext="Base de datos completa (Total)"
              icon={<Users size={24} />}
              color="bg-blue-600"
            />
            <StatCard 
              title="Premium Activos" 
              value={data.kpi.premiumUsers} 
              subtext="Suscripciones vigentes"
              icon={<Zap size={24} />}
              color="bg-amber-500"
            />
          </div>

          {/* First Row: Top Users (Left) & Activity Chart (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Users Ranking */}
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
                             {idx < 3 ? <Crown size={14} className={idx === 0 ? 'fill-amber-700' : ''}/> : idx + 1}
                           </div>
                           <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                                {user.name}
                              </span>
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

            {/* Main Chart: Activity */}
            <Card className="lg:col-span-2 min-w-0" title={`Actividad: ${getTimeLabel()}`}>
              <div className="h-80 w-full relative">
                {data.activityData.length > 0 ? (
                  <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Area name="Usuarios Únicos" type="monotone" dataKey="usuarios" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                        <Area name="Páginas Vistas" type="monotone" dataKey="vistas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                    Sin datos de actividad reciente
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Second Row: Top Pages & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Pages Ranking (Dynamic Height) */}
            <Card title="Vistas por Página" className="min-w-0">
              <div className="w-full overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {data.topPages.length > 0 ? (
                  <div style={{ height: Math.max(300, data.topPages.length * 35 + 50), width: '100%', minHeight: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={data.topPages} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 11, fill: '#64748b'}} interval={0} />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                    Sin datos de navegación en este periodo
                  </div>
                )}
              </div>
            </Card>

             {/* Events Timeline */}
            <Card title="Últimos Accesos (En Tiempo Real)" className="lg:col-span-2">
              <div className="space-y-0 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {data.timelineEvents.length === 0 && (
                  <div className="text-center py-8 text-slate-400">No hay eventos recientes</div>
                )}
                {data.timelineEvents.map((event, idx) => {
                  let Icon = Globe;
                  let colorClass = "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300";
                  
                  const pageDetails = event.meta || '';

                  if (pageDetails.includes('home') || pageDetails === '/') {
                      Icon = Monitor;
                      colorClass = "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
                  } else if (pageDetails.includes('user')) {
                      Icon = Users;
                      colorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";
                  }

                  return (
                    <div key={idx} className="flex gap-4 relative group">
                      {idx !== data.timelineEvents.length - 1 && (
                        <div className="absolute left-[19px] top-8 bottom-[-16px] w-[2px] bg-slate-100 dark:bg-slate-700 group-last:hidden"></div>
                      )}
                      
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                          <Icon size={18} />
                        </div>
                      </div>
                      
                      <div className="pb-6 pt-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {event.details}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                            {event.meta || '/'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
