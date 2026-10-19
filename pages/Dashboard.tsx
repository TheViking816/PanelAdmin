import React, { useEffect, useState } from 'react';
import { Activity, Crown, Users } from 'lucide-react';
import { Card } from '../components/UI';
import { CampaignMetrics, fetchCampaignMetrics } from '../services/chatMonitor';
import { fetchCurrentPremiumChapas } from '../services/supabaseClient';

const StatCard: React.FC<{
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, description, icon, color }) => (
  <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <div>
      <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <div className={`rounded-lg p-3 text-white ${color}`}>{icon}</div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [campaign, setCampaign] = useState<CampaignMetrics | null>(null);
  const [premiumChapas, setPremiumChapas] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadSummary = async () => {
      try {
        const [metrics, activeChapas] = await Promise.all([
          fetchCampaignMetrics(),
          fetchCurrentPremiumChapas(),
        ]);
        if (!mounted) return;
        setCampaign(metrics);
        setPremiumChapas(new Set(activeChapas));
        setError('');
      } catch {
        if (mounted) setError('No se pudo cargar el resumen.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadSummary();
    return () => { mounted = false; };
  }, []);

  const visitors = campaign?.visitors || [];
  const withoutPremium = visitors.filter(({ chapa }) => !premiumChapas.has(String(chapa))).length;
  const subscriptionsAfterTrial = (campaign?.new_subscriptions || [])
    .filter(({ visited_trial }) => visited_trial).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
          <Activity size={20} className="text-port-600 dark:text-port-400" />
          Resumen del Sueldómetro
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Semana de prueba Premium</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando resumen...</p>
      ) : error || !campaign ? (
        <Card className="min-w-0">
          <p className="text-sm text-red-600">{error || 'No hay datos de la prueba.'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Probaron el Sueldómetro"
            value={visitors.length}
            description="Usuarios distintos durante la prueba"
            icon={<Users size={22} />}
            color="bg-blue-600"
          />
          <StatCard
            title="Siguen sin Premium"
            value={withoutPremium}
            description="Lo probaron y no tienen suscripción activa"
            icon={<Users size={22} />}
            color="bg-slate-600"
          />
          <StatCard
            title="Altas tras la prueba"
            value={subscriptionsAfterTrial}
            description="Se suscribieron después de entrar al Sueldómetro"
            icon={<Crown size={22} />}
            color="bg-amber-500"
          />
        </div>
      )}
    </div>
  );
};
