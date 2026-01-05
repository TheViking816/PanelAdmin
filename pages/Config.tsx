import React, { useState, useEffect } from 'react';
import { Card } from '../components/UI';
import { Moon, Sun } from 'lucide-react';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
      {description && <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-port-500 focus:ring-offset-2 ${
        checked ? 'bg-port-600' : 'bg-slate-200 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export const ConfigPage: React.FC = () => {
  // Appearance State
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize Dark Mode from HTML class or LocalStorage
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = (val: boolean) => {
    setDarkMode(val);
    if (val) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración del Sistema</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Personaliza la apariencia del panel de administración.</p>
      </div>

      {/* Apariencia y UX - Única sección conservada */}
      <Card title="Apariencia & Preferencias">
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
           <div className={`p-3 rounded-full ${darkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-amber-100 text-amber-600'}`}>
              {darkMode ? <Moon size={24} /> : <Sun size={24} />}
           </div>
           <div>
             <h4 className="font-semibold text-slate-900 dark:text-white">Tema Visual</h4>
             <p className="text-xs text-slate-500 dark:text-slate-400">Alternar entre modo claro y oscuro para el panel.</p>
           </div>
        </div>
        <Toggle 
          label="Modo Oscuro" 
          description="Reduce la fatiga visual en entornos de poca luz."
          checked={darkMode} 
          onChange={toggleDarkMode} 
        />
      </Card>
    </div>
  );
};