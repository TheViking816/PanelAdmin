import { createClient } from '@supabase/supabase-js';
import { DescansosUsageRow } from '../types';

const DESCANSOS_SUPABASE_URL =
  (import.meta as any).env?.VITE_DESCANSOS_SUPABASE_URL ||
  'https://xwouicfsrljxdeihpzll.supabase.co';

const DESCANSOS_SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_DESCANSOS_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3b3VpY2ZzcmxqeGRlaWhwemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTk3NDYsImV4cCI6MjA4NjI3NTc0Nn0.WdvTUVz5jaV29Gj6LRI_JTfdcOkTKEj0EKq6_3sZLfc';

// Fallback sane check: if a valid key is not configured, return empty data instead of crashing the whole panel.
const looksLikeJwt = typeof DESCANSOS_SUPABASE_ANON_KEY === 'string' && DESCANSOS_SUPABASE_ANON_KEY.split('.').length === 3;

const descansosSupabase = looksLikeJwt
  ? createClient(DESCANSOS_SUPABASE_URL, DESCANSOS_SUPABASE_ANON_KEY)
  : null;

export async function fetchDescansosUsage(limit: number = 1000): Promise<DescansosUsageRow[]> {
  if (!descansosSupabase) {
    console.warn('Descansos Supabase anon key missing. Set VITE_DESCANSOS_SUPABASE_ANON_KEY in Panel Admin.');
    return [];
  }

  try {
    const { data, error } = await descansosSupabase
      .from('uso_app')
      .select('chapa, ultima_actualizacion, seccion')
      .order('ultima_actualizacion', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Error fetching 'uso_app' from Descansos:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      chapa: String(row.chapa || ''),
      ultima_actualizacion: row.ultima_actualizacion || new Date(0).toISOString(),
      seccion: row.seccion ? String(row.seccion) : null,
    }));
  } catch (error) {
    console.error('Critical error fetching Descansos usage:', error);
    return [];
  }
}
