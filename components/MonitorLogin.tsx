import React, { useState } from 'react';
import { monitorLogin } from '../services/chatMonitor';
export function MonitorLogin({ onSuccess }: { onSuccess: () => void }) {
  const [chapa, setChapa] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <main className="min-h-screen text-slate-800 bg-slate-100 flex items-center justify-center p-5"><form className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md space-y-5" onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await monitorLogin(chapa, password); setPassword(''); onSuccess(); } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  }}><div><h1 className="text-2xl font-bold text-port-900">Panel Admin</h1><p className="text-sm text-slate-500 mt-2">Puedes entrar desde tu sesión del Portal o usar la misma chapa y contraseña con la que accedes allí. El Panel anterior no tenía una clave propia.</p></div>
    <a href="https://portal-estiba-vlc.vercel.app/panel-admin-access.html" className="block text-center bg-port-900 text-white rounded-lg p-3 font-semibold">Entrar desde PortalEstibaVLC</a>
    <p className="text-sm text-slate-500 text-center">Si ya has iniciado sesión en el Portal, no necesitas escribir la contraseña otra vez.</p>
    <label className="block text-sm">Chapa<input autoComplete="username" required value={chapa} onChange={e => setChapa(e.target.value)} className="block w-full border rounded-lg p-3 mt-1" /></label>
    <label className="block text-sm">Contraseña<input autoComplete="current-password" required type="password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full border rounded-lg p-3 mt-1" /></label>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    <button disabled={busy} className="w-full bg-port-900 text-white rounded-lg p-3 font-semibold">{busy ? 'Accediendo…' : 'Entrar'}</button>
  </form></main>;
}
