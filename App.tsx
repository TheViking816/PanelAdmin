import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { PremiumPage } from './pages/Premium';
import { ConfigPage } from './pages/Config';
import { PageView, UserRole } from './types';

const PAGE_STORAGE_KEY = 'panel-admin:last-page';
const PAGE_VIEWS: PageView[] = ['DASHBOARD', 'USUARIOS', 'PREMIUM', 'CONFIGURACION'];

const getInitialPage = (): PageView => {
  if (typeof window === 'undefined') return 'DASHBOARD';
  const hashPage = window.location.hash.replace('#', '');
  if (PAGE_VIEWS.includes(hashPage as PageView)) return hashPage as PageView;
  const storedPage = window.localStorage.getItem(PAGE_STORAGE_KEY);
  if (PAGE_VIEWS.includes(storedPage as PageView)) return storedPage as PageView;
  return 'DASHBOARD';
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>(getInitialPage);
  const [currentUserRole] = useState<UserRole>(UserRole.SUPER_ADMIN);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hashPage = window.location.hash.replace('#', '');
      if (PAGE_VIEWS.includes(hashPage as PageView)) {
        setCurrentPage(hashPage as PageView);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PAGE_STORAGE_KEY, currentPage);
    window.location.hash = currentPage;
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'DASHBOARD': return <Dashboard />;
      case 'USUARIOS': return <UsersPage />;
      case 'PREMIUM': return <PremiumPage />;
      case 'CONFIGURACION': return <ConfigPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      userRole={currentUserRole}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
