// ============================================================
//  RESERVA DE CLASES (cliente): ve el horario proximo y aparta
//  o cancela su cupo. Muestra cupos disponibles en tiempo real.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner, Empty } from '../../components/ui';
import { IconCalendar, IconCheck } from '../../components/Icons';

const DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// "2026-06-18" -> "Jueves 18 jun"
function dayLabel(date) {
  const d = new Date(date + 'T00:00:00');
  const mes = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
  return `${DOW[d.getDay()]} ${d.getDate()} ${mes}`;
}

export default function ClientClasses() {
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  async function load() { setList((await api.get('/classes/schedule', { params: { days: 14 } })).data); }
  useEffect(() => { load(); }, []);

  async function toggle(s) {
    setMsg(null);
    try {
      if (s.is_booked) await api.delete(`/classes/${s.class_id}/book`, { params: { date: s.date } });
      else await api.post(`/classes/${s.class_id}/book`, { date: s.date });
      await load();
    } catch (err) {
      setMsg({ id: s.class_id + s.date, text: err.response?.data?.error || 'No se pudo' });
    }
  }

  if (!list) return <Spinner />;

  // Agrupa por fecha
  const byDate = {};
  for (const s of list) (byDate[s.date] ||= []).push(s);
  const dates = Object.keys(byDate).sort();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Reservar clases</h1>
        <p className="text-slate-500">Aparta tu cupo en las próximas clases</p>
      </div>

      {dates.length === 0 ? <Empty>El box aún no ha publicado el horario de clases.</Empty> : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <h2 className="mb-2 flex items-center gap-2 font-bold capitalize">
                <IconCalendar className="w-5 h-5 text-brand" /> {dayLabel(date)}
                {date === today && <span className="badge bg-brand text-white">Hoy</span>}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byDate[date].map((s) => {
                  const full = s.spots_left <= 0 && !s.is_booked;
                  return (
                    <div key={s.class_id + s.date} className={`card p-4 ${s.is_booked ? 'border-emerald-400 ring-1 ring-emerald-400/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-extrabold">{s.time}</span>
                        <span className={s.spots_left > 0 ? 'badge-ok' : 'badge-bad'}>
                          {s.spots_left > 0 ? `${s.spots_left} cupos` : 'Lleno'}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold">{s.name}</p>
                      {s.coach && <p className="text-sm text-slate-500">{s.coach}</p>}
                      <p className="text-xs text-slate-400">{s.booked}/{s.capacity} reservados</p>
                      <button onClick={() => toggle(s)} disabled={full}
                              className={`mt-3 w-full ${s.is_booked ? 'btn-ghost' : full ? 'btn-ghost opacity-60' : 'btn-primary'}`}>
                        {s.is_booked ? <><IconCheck className="w-4 h-4" /> Reservado · Cancelar</> : full ? 'Sin cupo' : 'Reservar'}
                      </button>
                      {msg && msg.id === s.class_id + s.date && <p className="mt-1 text-xs text-red-500">{msg.text}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
