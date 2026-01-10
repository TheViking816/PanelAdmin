import { createClient } from '@supabase/supabase-js';
import { UserProfile, PremiumSubscription } from '../types';

const SUPABASE_URL = 'https://icszzxkdxatfytpmoviq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljc3p6eGtkeGF0Znl0cG1vdmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2Mzk2NjUsImV4cCI6MjA3ODIxNTY2NX0.hmQWNB3sCyBh39gdNgQLjjlIvliwJje-OYf0kkPObVA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch users from 'usuarios' table and cross-reference with 'usuarios_premium'
 */
export const fetchUsers = async (): Promise<UserProfile[]> => {
  try {
    // 1. Fetch Basic User Data
    const { data: usersData, error: usersError } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (usersError) {
      console.warn("Error fetching 'usuarios':", usersError);
      return [];
    }

    // 2. Fetch Premium Data to check status (All active premiums)
    // REMOVED user_id from selection as it does not exist in the table
    const { data: premiumData } = await supabase
      .from('usuarios_premium')
      .select('chapa, estado')
      .eq('estado', 'active'); 

    // Create sets for fast lookup (Check ONLY Chapa)
    const premiumChapas = new Set<string>();
    
    (premiumData || []).forEach((p: any) => {
      if (p.chapa) premiumChapas.add(String(p.chapa));
    });

    // 3. Map and Merge
    return (usersData || []).map((u: any) => {
      const userId = String(u.id);
      const userChapa = u.chapa ? String(u.chapa) : '';
      
      // Determine premium status: Check Chapa match
      const isPremium = userChapa && premiumChapas.has(userChapa);

      return {
        id: userId,
        chapa: userChapa || 'N/A',
        nombre: u.nombre || u.full_name || 'Sin Nombre',
        email: u.email || 'No Email',
        rol: u.rol || 'USER',
        estado: u.estado || 'ACTIVO',
        premium: !!isPremium, // Boolean enforcement
        last_seen: u.ultimo_acceso || u.last_sign_in_at || u.created_at,
        created_at: u.created_at,
        updated_at: u.updated_at || u.created_at
      };
    });

  } catch (e) {
    console.error("Exception fetching users:", e);
    return [];
  }
};

/**
 * Fetch only ACTIVE subscriptions.
 * Join Logic: Matches by CHAPA only (as user_id column doesn't exist in premium table).
 */
export const fetchActiveSubscriptions = async (): Promise<PremiumSubscription[]> => {
  try {
    // 1. Fetch active premiums (Removed user_id from select)
    const { data: premiumData, error } = await supabase
      .from('usuarios_premium')
      .select('id, chapa, estado, periodo_inicio, periodo_fin, created_at')
      .eq('estado', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn("Error fetching premium users:", error);
      return [];
    }

    // 2. Fetch users to map names/emails. 
    const { data: usersData } = await supabase
      .from('usuarios')
      .select('id, nombre, email, chapa')
      .limit(2000); 

    // Map by Chapa
    const userMapByChapa = new Map();
    (usersData || []).forEach((u: any) => {
      if (u.chapa) userMapByChapa.set(String(u.chapa), u);
    });

    return (premiumData || []).map((p: any) => {
      // Find user by Chapa
      const user = userMapByChapa.get(String(p.chapa));
      
      // Calculate Plan
      let calculatedPlan = 'Mensual';
      if (p.periodo_inicio && p.periodo_fin) {
        const start = new Date(p.periodo_inicio);
        const end = new Date(p.periodo_fin);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 45) calculatedPlan = 'Anual';
      }

      return {
        id: String(p.id),
        // If user found, use their ID, otherwise undefined
        user_id: user?.id, 
        chapa: p.chapa || user?.chapa || '?',
        status: p.estado,
        plan_interval: calculatedPlan,
        periodo_inicio: p.periodo_inicio,
        periodo_fin: p.periodo_fin,
        created_at: p.created_at,
        user_email: user?.email || 'Desconocido',
        user_name: user?.nombre || 'Usuario'
      };
    });

  } catch (e) {
    console.error("Error fetching subscriptions:", e);
    return [];
  }
};

/**
 * Fetches analytics data.
 * Accepts a timeFilter ('1d', '3d', '7d', '30d', 'all')
 */
export const fetchDashboardData = async (timeFilter: string = '30d') => {
  try {
    // --- 1. Page Events (Filtered by Time) ---
    let thresholdDate: string | null = null;
    if (timeFilter !== 'all') {
      const now = new Date();
      let subtractDays = 30;
      if (timeFilter === '1d') subtractDays = 1;
      if (timeFilter === '3d') subtractDays = 3;
      if (timeFilter === '7d') subtractDays = 7;

      thresholdDate = new Date(now.setDate(now.getDate() - subtractDays)).toISOString();
    }

    const fetchEventsInRange = async (since: string | null) => {
      const pageSize = 1000;
      let from = 0;
      const allEvents: any[] = [];

      while (true) {
        let eventsQuery = supabase
          .from('page_events')
          .select('*')
          .order('ts', { ascending: false })
          .range(from, from + pageSize - 1);

        if (since) {
          eventsQuery = eventsQuery.gte('ts', since);
        }

        const { data, error } = await eventsQuery;
        if (error) {
          console.warn("Error reading 'page_events':", error);
          break;
        }

        if (!data || data.length === 0) break;
        allEvents.push(...data);

        if (data.length < pageSize) break;
        from += pageSize;

      }

      return allEvents;
    };

    const events = await fetchEventsInRange(thresholdDate);

    const baseCountQuery = supabase
      .from('page_events')
      .select('id', { count: 'exact', head: true });

    if (thresholdDate) {
      baseCountQuery.gte('ts', thresholdDate);
    }

    const { count: totalViewsCount } = await baseCountQuery;

    const homeCountQuery = supabase
      .from('page_events')
      .select('id', { count: 'exact', head: true })
      .in('page', ['/', '/home', '']);

    if (thresholdDate) {
      homeCountQuery.gte('ts', thresholdDate);
    }

    const { count: homeViewsCount } = await homeCountQuery;

    const fetchUniqueUsersCount = async (since: string | null) => {
      const uniqueUsers = new Set<string>();
      const pageSize = 1000;
      let from = 0;

      while (true) {
        let uniqueQuery = supabase
          .from('page_events')
          .select('chapa, ts')
          .order('ts', { ascending: false })
          .range(from, from + pageSize - 1);

        if (since) {
          uniqueQuery = uniqueQuery.gte('ts', since);
        }

        const { data, error } = await uniqueQuery;
        if (error) {
          console.warn("Error fetching unique users:", error);
          break;
        }

        if (!data || data.length === 0) break;

        for (const row of data) {
          const chapa = row.chapa ? String(row.chapa) : '';
          if (chapa && chapa !== 'anon') uniqueUsers.add(chapa);
        }

        if (data.length < pageSize) break;
        from += pageSize;
      }

      return uniqueUsers.size;
    };

    // Map events for safe usage
    const safeEvents = (events || [])
      .map((e: any) => {
        const timestamp = e.ts || e.created_at || e.inserted_at;
        if (!timestamp) return null;
        return {
          path: e.page || '/',
          user_id: e.chapa ? String(e.chapa) : 'anon',
          created_at: timestamp
        };
      })
      .filter(Boolean) as { path: string; user_id: string; created_at: string }[];

    // --- 2. Premium Count (Total DB) + Active Chapa Set ---
    const { data: premiumRows, count: totalActivePremiumCount } = await supabase
      .from('usuarios_premium')
      .select('chapa', { count: 'exact' })
      .eq('estado', 'active');
    const premiumChapas = new Set<string>();
    (premiumRows || []).forEach((p: any) => {
      if (p.chapa) premiumChapas.add(String(p.chapa));
    });

    // --- Calculations based on Filtered Events ---

    // Unique Users in the time range (not limited by the events page size)
    const uniqueUsersCount = await fetchUniqueUsersCount(thresholdDate);

    // Rank Pages (in the time range)
    const pageCounts: Record<string, number> = {};
    const userActivityCounts: Record<string, number> = {}; // For Top Users

    safeEvents.forEach(v => {
      // 1. Pages
      let path = v.path;
      if (path && path.includes('?')) path = path.split('?')[0];
      if (path === '/home' || path === '') path = '/';
      if (path) pageCounts[path] = (pageCounts[path] || 0) + 1;

      // 2. Users Activity
      if (v.user_id && v.user_id !== 'anon') {
         userActivityCounts[v.user_id] = (userActivityCounts[v.user_id] || 0) + 1;
      }
    });

    if (typeof homeViewsCount === 'number') {
      pageCounts['/'] = homeViewsCount;
    }

    // Convert Pages Map to Array
    const allPages = Object.entries(pageCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Convert Users Map to Array (Top 10)
    const topUsers = Object.entries(userActivityCounts)
      .map(([name, value]) => ({ name, value, isPremium: premiumChapas.has(String(name)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // --- Activity Chart Data ---
    const dailyMap: Record<string, { dateStr: string, sortKey: number, users: Set<string>, views: number }> = {};
    safeEvents.forEach(v => {
      const d = new Date(v.created_at);
      if (isNaN(d.getTime())) return;

      const bucketDate = timeFilter === '1d'
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours())
        : new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const sortKey = bucketDate.getTime();
      const key = String(sortKey);
      const dateStr = timeFilter === '1d'
        ? bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `${bucketDate.getDate().toString().padStart(2, '0')}/${(bucketDate.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!dailyMap[key]) {
        dailyMap[key] = { dateStr, sortKey, users: new Set(), views: 0 };
      }
      dailyMap[key].views++;
      if (v.user_id !== 'anon') dailyMap[key].users.add(v.user_id);
    });

    const activityData = Object.values(dailyMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(d => ({
        name: d.dateStr,
        usuarios: d.users.size,
        vistas: d.views
      }));

    // --- Peak Hourly Unique Users (Filtered Range) ---
    const hourlyMap: Record<string, Set<string>> = {};
    const hourlyViewsMap: Record<string, number> = {};
    safeEvents.forEach(v => {
      const d = new Date(v.created_at);
      if (isNaN(d.getTime())) return;
      const bucket = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
      const key = String(bucket.getTime());
      hourlyViewsMap[key] = (hourlyViewsMap[key] || 0) + 1;
      if (!v.user_id || v.user_id === 'anon') return;
      if (!hourlyMap[key]) hourlyMap[key] = new Set();
      hourlyMap[key].add(v.user_id);
    });
    const peakHourlyUniqueUsers = Object.values(hourlyMap).reduce((max, set) => {
      return Math.max(max, set.size);
    }, 0);
    const peakHourlyViews = Object.values(hourlyViewsMap).reduce((max, value) => {
      return Math.max(max, value);
    }, 0);

    const nowMs = Date.now();
    const earliestEventMs = safeEvents.reduce((min, event) => {
      const ts = new Date(event.created_at).getTime();
      if (Number.isNaN(ts)) return min;
      return Math.min(min, ts);
    }, Number.POSITIVE_INFINITY);
    const periodStartMs = thresholdDate
      ? new Date(thresholdDate).getTime()
      : Number.isFinite(earliestEventMs) ? earliestEventMs : nowMs;
    const hoursInRange = Math.max(1, Math.ceil((nowMs - periodStartMs) / (1000 * 60 * 60)));
    const totalHourlyUniqueUsers = Object.values(hourlyMap).reduce((sum, set) => sum + set.size, 0);
    const averageHourlyUsers = Number((totalHourlyUniqueUsers / hoursInRange).toFixed(1));

    const last24Threshold = Date.now() - 24 * 60 * 60 * 1000;
    const last24Events = (events || []).filter((e: any) => {
      const tsValue = new Date(e.ts || e.created_at || '').getTime();
      return !Number.isNaN(tsValue) && tsValue >= last24Threshold;
    });

    // --- Timeline Events (Last 24h) ---
    const timelineEvents = last24Events.map((e: any) => ({
      id: e.id ? String(e.id) : Math.random().toString(),
      type: 'page_view',
      date: e.ts,
      details: e.chapa ? `${e.chapa}` : 'Anonimo',
      meta: e.page || '/',
      isPremium: e.chapa ? premiumChapas.has(String(e.chapa)) : false
    }));

    return {
      kpi: {
        peakHourlyUniqueUsers,
        peakHourlyViews,
        averageHourlyUsers,
        premiumUsers: totalActivePremiumCount || 0,
        monthlyActiveUsers: uniqueUsersCount, // This is now "Unique Users in Range"
        totalViews: totalViewsCount || safeEvents.length
      },
      topPages: allPages,
      topUsers, // New Data
      activityData,
      timelineEvents
    };

  } catch (error) {
    console.error("Critical error in fetchDashboardData:", error);
    return null;
  }
};

