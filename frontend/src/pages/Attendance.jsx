// ============================================================
//  Modulo de ASISTENCIA (admin): registrar entrada por cedula o
//  seleccionando cliente, y ver la asistencia del dia.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { Spinner, Empty } from '../components/ui';
import { IconCheck } from '../components/Icons';

export default function Attendance() {
  const [today, setToday] = useState(null);
  const [clients, setClients] = useState([]);
  const [cedula, setCedula] = useState('');
  const [clientId, setClientId] = useState('');
  const [msg, setMsg] = useState(null);

  async function load() {
    const [t, c] = await Promise.all([api.get('/attendance/today'), api.get('/clients')]);
    setToday(t.data); setClients(c.data);
  }
  useEffect(() => { load(); }, []);

  async function register(e) {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post('/attendance', { cedula: cedula || undefined, client_id: clientId || undefined });
      setMsg({ ok: true, text: 'Asistencia registrada.' });
      setCedula(''); setClientId('');
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'No se pudo registrar' });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Control de asistencia</h1>
        <p className="text-slate-500">Registro diario de entrenamientos</p>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-bold">Registrar entrada</h3>
        <form onSubmit={register} className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          <div>
            <label className="label">Por cedula</label>
            <input className="input" placeholder="Numero de cedula" value={cedula} onChange={(e) => { setCedula(e.target.value); setClientId(''); }} />
          </div>
          <div className="hidden sm:flex h-11 items-center justify-center text-slate-400">o</div>
          <div>
            <label className="label">Por cliente</label>
            <select className="select" value={clientId} onChange={(e) => { setClientId(e.target.value); setCedula(''); }}>
              <option value="">Selecciona...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <button className="btn-primary"><IconCheck className="w-5 h-5" /> Registrar</button>
        </form>
        {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-500' : 'text-red-500'}`}>{msg.text}</p>}
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-bold">Asistencia de hoy ({today?.length || 0})</h3>
        {!today ? <Spinner /> : today.length === 0 ? <Empty>Aun no hay asistencias registradas hoy.</Empty> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {today.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3 font-medium">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-500"><IconCheck className="w-4 h-4" /></span>
                  {a.full_name}
                </span>
                <span className="text-sm text-slate-500">{new Date(a.check_in).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
