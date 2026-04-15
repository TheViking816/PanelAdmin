import React, { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { UserProfile } from '../types';
import { fetchDerivedNewChapas, fetchUsers } from '../services/supabaseClient';

const SortableHeader: React.FC<{
  label: string;
  sortKey: keyof UserProfile;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: keyof UserProfile) => void;
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

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [newChapas, setNewChapas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile; direction: 'asc' | 'desc' }>({
    key: 'updated_at',
    direction: 'desc'
  });

  const loadUsers = async () => {
    setLoading(true);
    const [usersData, newChapasData] = await Promise.all([
      fetchUsers(),
      fetchDerivedNewChapas()
    ]);
    setUsers(usersData);
    setNewChapas(newChapasData);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();

    const handleFocus = () => {
      loadUsers();
    };

    const intervalId = window.setInterval(loadUsers, 60000);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSort = (key: keyof UserProfile) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedUsers = React.useMemo(() => {
    const result = users.filter((u) =>
      (u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.chapa || '').includes(searchTerm)
    );

    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchTerm, sortConfig]);

  const newUsersRegistrationSummary = React.useMemo(() => {
    const total = newChapas.length;
    const newChapasSet = new Set(newChapas);
    const registered = new Set(
      users
        .filter((user) => user.registro_estado === 'REGISTRADO' && newChapasSet.has(String(user.chapa || '').trim()))
        .map((user) => String(user.chapa || '').trim())
    ).size;
    const premium = new Set(
      users
        .filter((user) => user.premium && newChapasSet.has(String(user.chapa || '').trim()))
        .map((user) => String(user.chapa || '').trim())
    ).size;

    return { registered, premium, total };
  }, [newChapas, users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-port-900 dark:text-white">Base de Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gestion de usuarios, altas completadas y estado premium.</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadUsers}>
          Recargar
        </Button>
      </div>

      <Card className="min-w-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o chapa..."
                className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-port-500 focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="self-start md:self-auto rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-right dark:border-emerald-900/60 dark:bg-emerald-950/40">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Nuevos registrados
              </div>
              <div className="flex items-baseline gap-3 text-lg font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                <span>
                  {newUsersRegistrationSummary.registered}/{newUsersRegistrationSummary.total}
                </span>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Premium {newUsersRegistrationSummary.premium}/{newUsersRegistrationSummary.total}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="min-w-[1180px] w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <SortableHeader label="Usuario" sortKey="nombre" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider w-48">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Chapa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Estado</th>
                <SortableHeader label="Registro App" sortKey="registro_estado" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Premium</th>
                <SortableHeader label="Alta Base" sortKey="created_at" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Ultima Actualizacion" sortKey="updated_at" currentSort={sortConfig} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-port-100 dark:bg-port-900/50 flex items-center justify-center text-port-700 dark:text-port-300 font-bold text-xs mr-3">
                          {(user.nombre || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{user.nombre || 'Sin nombre'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      <span className="block max-w-[180px] truncate">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-400">
                      {user.chapa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={user.estado === 'ACTIVO' ? 'green' : 'gray'}>{user.estado || 'N/A'}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={user.registro_estado === 'REGISTRADO' ? 'blue' : 'yellow'}>
                        {user.registro_estado || 'PENDIENTE'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.premium ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          PREMIUM
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">Free</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {user.updated_at ? (
                        <span className="text-slate-600 dark:text-slate-300">{new Date(user.updated_at).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filteredAndSortedUsers.length} usuarios cargados
          </span>
        </div>
      </Card>
    </div>
  );
};
