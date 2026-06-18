// ============================================================
//  Inicio del CLIENTE: saludo, estado de mensualidad, accesos
//  rapidos y boton para registrar asistencia.
// ============================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { money, fdate } from '../../components/ui';
import { IconMoney, IconDumbbell, IconChart, IconCalendar, IconCheck, IconFlame, IconClock } from '../../components/Icons';

export default function ClientHome() {
  const { user } = useAuth();
  const [pago, setPago] = useState(null);
  const [rutinas, setRutinas] = useState(0);
  const [msg, setMsg] = useState(null);

  async function load() {
    const [p, r] = await Promise.all([api.get('/payments/me'), api.get('/routines/me')]);
    setPago(p.data); setRutinas(r.data.length);
  }
  useEffect(() => { load(); }, []);

  async function marcarAsistencia() {
    setMsg(null);
    try {
      await api.post('/attendance/self');
      setMsg({ ok: true, text: 'Asistencia registrada. A entrenar!' });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'No se pudo registrar' });
    }
  }

  const vigente = pago?.status === 'Activo';

  const accesos = [
    { to: '/wods', label: 'WOD de hoy', icon: IconFlame },
    { to: '/reservar', label: 'Reservar clase', icon: IconClock },
    { to: '/mis-rutinas', label: 'Mis rutinas', icon: IconDumbbell },
    { to: '/mi-progreso', label: 'Mi progreso', icon: IconChart },
    { to: '/mis-pagos', label: 'Mensualidad', icon: IconMoney },
    { to: '/eventos', label: 'Eventos', icon: IconCalendar },
  ];

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
        <p className="text-brand-100">Hola,</p>
        <h1 className="text-3xl font-extrabold">{user?.name} 💪</h1>
        <p className="mt-1 text-brand-100">Listo para entrenar hoy?</p>
        <button onClick={marcarAsistencia} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 font-semibold backdrop-blur hover:bg-white/25">
          <IconCheck className="w-5 h-5" /> Registrar mi asistencia
        </button>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-200' : 'text-red-200'}`}>{msg.text}</p>}
      </div>

      {/* Estado de mensualidad */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Estado de mensualidad</p>
            <p className="mt-1 text-2xl font-extrabold">
              <span className={vigente ? 'text-emerald-500' : 'text-red-500'}>{pago?.status || '...'}</span>
            </p>
            {pago?.due_date && <p className="text-sm text-slate-500">Vence el {fdate(pago.due_date)}</p>}
          </div>
          <div className={`grid h-14 w-14 place-items-center rounded-2xl ${vigente ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
            <IconMoney className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Accesos rapidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {accesos.map((a) => (
          <Link key={a.to} to={a.to} className="card flex flex-col items-center gap-3 p-6 text-center hover:border-brand transition">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand"><a.icon className="w-6 h-6" /></div>
            <span className="font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm text-slate-500">Tienes <b className="text-brand">{rutinas}</b> rutina(s) asignada(s).</p>
      </div>
    </div>
  );
}
