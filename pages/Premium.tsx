import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge, TableHeader } from '../components/UI';
import { RefreshCw, Zap, Calendar, Clock, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { PremiumSubscription } from '../types';
import { fetchActiveSubscriptions } from '../services/supabaseClient';

// Helper for sorting header
const SortableHeader: React.FC<{ 
  label: string; 
  sortKey: keyof PremiumSubscription; 
  currentSort: { key: string; direction: 'asc' | 'desc' }; 
  onSort: (key: keyof PremiumSubscription) => void;
}> = ({ label, sortKey, currentSort, onSort }) => (
  <th 
    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none"
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center gap-1">
      {label}
      {currentSort.key === sortKey ? (
        currentSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
      ) : (
        <ArrowUpDown size={14} className="opacity-30" />
      )}
    </div>
  </th>
);

export const PremiumPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<PremiumSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof PremiumSubscription; direction: 'asc' | 'desc' }>({
    key: 'periodo_inicio',
    direction: 'desc'
  });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    const data = await fetchActiveSubscriptions();
    setSubscriptions(data);
    setLoading(false);
  };

  const handleSort = (key: keyof PremiumSubscription) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedSubscriptions = useMemo(() => {
    const items = [...subscriptions];
    items.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [subscriptions, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Zap className="text-amber-500" fill="currentColor" />
            Suscripciones Activas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
             Usuarios con estado 'active'.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900 dark:text-amber-200 px-2 py-1 rounded">
            Total Activos: {sortedSubscriptions.length}
          </span>
          <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadSubscriptions}>
            Recargar Datos
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Usuario / Chapa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Email</th>
                
                {/* Sortable Headers */}
                <SortableHeader 
                  label="Plan" 
                  sortKey="plan_interval" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                />
                
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Estado</th>
                
                <SortableHeader 
                  label="Inicio Periodo (Hora)" 
                  sortKey="periodo_inicio" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                />
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                      Cargando suscriptores activos...
                    </div>
                  </td>
                </tr>
              ) : sortedSubscriptions.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No hay suscripciones activas en este momento.
                  </td>
                </tr>
              ) : (
                sortedSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{sub.user_name}</span>
                        {/* Only Number for Chapa */}
                        <span className="text-lg font-bold text-slate-600 dark:text-slate-400 font-mono tracking-wide">{sub.chapa}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {sub.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${sub.plan_interval === 'Anual' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                         {sub.plan_interval === 'Anual' && <Calendar size={10} />}
                         {sub.plan_interval}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <Badge color="green">Active</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {sub.periodo_inicio ? (
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-slate-400"/>
                           <span>{new Date(sub.periodo_inicio).toLocaleDateString()}</span>
                           <span className="text-slate-300 dark:text-slate-600">|</span>
                           <Clock size={14} className="text-slate-400"/>
                           <span className="font-mono">{new Date(sub.periodo_inicio).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
