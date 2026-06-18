// ============================================================
//  CLASES (admin): define el horario semanal (clases recurrentes)
//  y consulta los inscritos de cada sesion proxima.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { Modal, Spinner, Empty } from '../components/ui';
import { IconPlus, IconEdit, IconTrash, IconUsers, IconCalendar } from '../components/Icons';

const DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const dayLabel = (date) => {
  const d = new Date(date + 'T00:00:00');
  const mes = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
  return `${DOW[d.getDay()]} ${d.getDate()} ${mes}`;
};

export default function Classes() {
  const [classes, setClasses] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const empty = { name: '', weekday: 1, time: '06:00', capacity: 12, coach: '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [bookingsFor, setBookingsFor] = useState(null); // sesion seleccionada
  const [bookings, setBookings] = useState(null);

  async function load() {
    const [c, s] = await Promise.all([
      api.get('/classes'),
      api.get('/classes/schedule', { params: { days: 7 } }),
    ]);
    setClasses(c.data); setSchedule(s.data);
  }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function openNew() { setForm(empty); setEditing(null); setOpen(true); }
  function openEdit(c) { setForm({ ...empty, ...c }); setEditing(c.id); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, weekday: Number(form.weekday), capacity: Number(form.capacity) };
      if (editing) await api.put(`/classes/${editing}`, payload);
      else await api.post('/classes', payload);
      setOpen(false); await load();
    } finally { setSaving(false); }
  }
  async function remove(c) {
    if (!confirm(`Eliminar la clase "${c.name}" (${DOW[c.weekday]} ${c.time})?`)) return;
    await api.delete(`/classes/${c.id}`); await load();
  }

  async function openBookings(s) {
    setBookingsFor(s); setBookings(null);
    const { data } = await api.get(`/classes/${s.class_id}/bookings`, { params: { date: s.date } });
    setBookings(data);
  }

  if (!classes) return <Spinner />;

  // agrupa plantillas por dia de la semana
  const byDay = {};
  for (const c of classes) (byDay[c.weekday] ||= []).push(c);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Clases y horarios</h1>
          <p className="text-slate-500">Define el horario semanal y revisa los inscritos</p>
        </div>
        <button className="btn-primary" onClick={openNew}><IconPlus className="w-5 h-5" /> Nueva clase</button>
      </div>

      {/* Horario semanal */}
      <div className="card p-5">
        <h2 className="mb-3 font-bold">Horario semanal</h2>
        {classes.length === 0 ? <Empty>Aún no has creado clases.</Empty> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 0].filter((wd) => byDay[wd]).map((wd) => (
              <div key={wd}>
                <h3 className="mb-1 font-semibold text-brand">{DOW[wd]}</h3>
                <ul className="space-y-1">
                  {byDay[wd].sort((a, b) => a.time.localeCompare(b.time)).map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm">
                      <span><b>{c.time}</b> · {c.name}{c.coach ? ` · ${c.coach}` : ''} <span className="text-slate-400">({c.capacity})</span></span>
                      <span className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="rounded p-1 text-brand hover:bg-brand/10"><IconEdit className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} className="rounded p-1 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proximas sesiones con inscritos */}
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><IconCalendar className="w-5 h-5 text-brand" /> Próximas sesiones (7 días)</h2>
        {schedule.length === 0 ? <Empty>No hay sesiones próximas.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-slate-500">
                <tr><th className="px-3 py-2 font-semibold">Día</th><th className="px-3 py-2 font-semibold">Hora</th><th className="px-3 py-2 font-semibold">Clase</th><th className="px-3 py-2 font-semibold">Reservados</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {schedule.map((s) => (
                  <tr key={s.class_id + s.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2 capitalize">{dayLabel(s.date)}</td>
                    <td className="px-3 py-2 font-semibold">{s.time}</td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2"><span className={s.booked > 0 ? 'badge-ok' : 'badge'}>{s.booked}/{s.capacity}</span></td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => openBookings(s)} className="btn-ghost text-xs" disabled={s.booked === 0}><IconUsers className="w-4 h-4" /> Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Crear / editar clase */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar clase' : 'Nueva clase'}>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={set('name')} placeholder="Ej: CrossFit" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Día de la semana</label>
              <select className="select" value={form.weekday} onChange={set('weekday')}>
                {[1, 2, 3, 4, 5, 6, 0].map((wd) => <option key={wd} value={wd}>{DOW[wd]}</option>)}
              </select>
            </div>
            <div><label className="label">Hora</label><input type="time" className="input" value={form.time} onChange={set('time')} required /></div>
            <div><label className="label">Cupos</label><input type="number" className="input" value={form.capacity} onChange={set('capacity')} /></div>
            <div><label className="label">Coach (opcional)</label><input className="input" value={form.coach || ''} onChange={set('coach')} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* Inscritos de una sesion */}
      <Modal open={!!bookingsFor} onClose={() => setBookingsFor(null)} title={`Inscritos · ${bookingsFor ? dayLabel(bookingsFor.date) : ''} ${bookingsFor?.time || ''}`}>
        {!bookings ? <Spinner /> : bookings.length === 0 ? <Empty>Nadie reservó esta sesión.</Empty> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span className="font-medium">{b.full_name}</span>
                <span className="text-sm text-slate-500">{b.phone || ''}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
