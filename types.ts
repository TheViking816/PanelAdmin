export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  SOPORTE = 'SOPORTE',
  LECTURA = 'LECTURA'
}

export interface UserProfile {
  id: string;
  chapa?: string; 
  nombre?: string;
  email?: string;
  rol?: UserRole | string;
  estado?: string;
  premium?: boolean;
  last_seen?: string;
  created_at: string;
  updated_at?: string; // New field
}

export interface PremiumSubscription {
  id: string;
  // user_id might not exist in premium table, we map it from the joined user
  user_id?: string; 
  chapa?: string;
  status: string; // 'active', etc.
  plan_interval?: string; // 'Mensual' | 'Anual' calculated
  periodo_inicio?: string;
  periodo_fin?: string;
  current_period_end?: string;
  created_at: string;
  // Optional: extended user data for display if joined
  user_email?: string; 
  user_name?: string;
}

export interface DashboardData {
  kpi: {
    totalUsers: number;
    premiumUsers: number;
    monthlyActiveUsers: number;
    totalViews: number;
  };
  topPages: { name: string; value: number }[];
  topUsers: { name: string; value: number }[]; // New Top Users Ranking
  activityData: { name: string; usuarios: number; vistas: number }[];
  timelineEvents: {
    id: string;
    type: string;
    date: string;
    details: string;
    meta?: string;
  }[];
}

export type PageView = 
  | 'DASHBOARD' 
  | 'USUARIOS' 
  | 'PREMIUM' 
  | 'CONFIGURACION';