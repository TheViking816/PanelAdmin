import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { PremiumPage } from './pages/Premium';
import { ConfigPage } from './pages/Config';
import { PageView, UserRole } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageView>('DASHBOARD');
  const [currentUserRole] = useState<UserRole>(UserRole.SUPER_ADMIN); 

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