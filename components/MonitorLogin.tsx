import React from 'react';
export function MonitorLogin({ onSuccess }: { onSuccess: () => void }) {
  void onSuccess;
  return <main className="min-h-screen text-slate-800 bg-slate-100 flex items-center justify-center p-5"><section className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-5">
    <div><h1 className="text-2xl font-bold text-port-900">Panel Admin</h1><p className="text-sm text-slate-500 mt-2">Acceso exclusivo del administrador 816 de PortalEstibaVLC.</p></div>
    <a href="https://portal-estiba-vlc.vercel.app/panel-admin-access.html" className="block text-center bg-port-900 text-white rounded-lg p-3 font-semibold">Entrar como administrador desde PortalEstibaVLC</a>
    <p className="text-sm text-slate-500 text-center">Inicia sesión en PortalEstibaVLC con la chapa 816 y utiliza este acceso. Ninguna otra chapa está autorizada.</p>
  </section></main>;
}
