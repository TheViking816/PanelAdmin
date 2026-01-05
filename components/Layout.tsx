import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Star, Settings, Menu, X, LogOut, Wifi, Activity
} from 'lucide-react';
import { PageView, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  userRole: UserRole;
}

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  isCollapsed?: boolean;
}> = ({ icon, label, isActive, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-lg transition-colors mb-1 touch-manipulation ${
      isActive 
        ? 'bg-port-800 text-white shadow-md' 
        : 'text-slate-400 hover:bg-port-800/50 hover:text-white'
    }`}
    title={label}
  >
    <span className="flex-shrink-0">{icon}</span>
    {!isCollapsed && <span className="ml-3 font-medium text-sm">{label}</span>}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'DASHBOARD', label: 'Activity Analytics', icon: <Activity size={20} /> },
    { id: 'USUARIOS', label: 'Usuarios', icon: <Users size={20} /> },
    { id: 'PREMIUM', label: 'Suscripciones', icon: <Star size={20} /> },
    { id: 'CONFIGURACION', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Sidebar Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-port-900 text-white transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-port-800">
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">Portal Estiba</span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-port-800 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={currentPage === item.id}
                onClick={() => onNavigate(item.id as PageView)}
                isCollapsed={!isSidebarOpen}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Menu - Enhanced for Touch */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm md:hidden transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-port-900 p-4 shadow-2xl transform transition-transform" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6 border-b border-port-800 pb-4">
                <span className="font-bold text-white text-lg">Portal Analytics</span>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2 rounded hover:bg-port-800"><X size={24} /></button>
             </div>
             <nav className="space-y-2">
                {menuItems.map((item) => (
                  <SidebarItem 
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={currentPage === item.id}
                    onClick={() => { onNavigate(item.id as PageView); setMobileMenuOpen(false); }}
                  />
                ))}
             </nav>
             <div className="absolute bottom-4 left-4 right-4">
                <button className="w-full flex items-center justify-center p-3 bg-port-800 rounded-lg text-slate-300 hover:text-white">
                  <LogOut size={20} className="mr-2"/> Cerrar Sesión
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 z-10 transition-colors">
          <div className="flex items-center">
            <button className="md:hidden mr-4 p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-lg active:bg-slate-100 dark:active:bg-slate-700" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white capitalize truncate">
              {currentPage === 'DASHBOARD' ? 'Activity Overview' : currentPage.toLowerCase()}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center text-green-600 dark:text-green-400 text-xs font-medium bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <Wifi size={12} className="mr-1" />
              Connected
            </div>
            <button className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-1" title="Cerrar Sesión">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <div className="max-w-7xl mx-auto pb-10 md:pb-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};