// ============================================================
//  Records personales (PR) del CLIENTE.
//  Registra sus marcas por ejercicio y ve su mejor resultado.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Modal, Spinner, Empty, fdate } from '../../components/ui';
import { IconPlus, IconTrash, IconTrophy } from '../../components/Icons';

const UNITS = ['kg', 'lb', 'reps', 'seg'];

export default function ClientRecords() {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const empty = { exercise: '', value: '', unit: 'kg', date: new Date().toISOString().slice(0, 10), notes: '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() { setList((await api.get('/records')).data); }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/records', { ...form, value: Number(form.value) });
      setOpen(false); setForm(empty); await load();
    } finally { setSaving(false); }
  }
  async function remove(r) {
    if (!confirm(`Eliminar la marca de ${r.exercise}?`)) return;
    await api.delete(`/records/${r.id}`); await load();
  }

  if (!list) return <Spinner />;

  // Agrupa por ejercicio y calcula el mejor (mayor valor; para 'seg' el menor)
  const groups = {};
  for (const r of list) (groups[r.exercise] ||= []).push(r);
  const exercises = Object.entries(groups).map(([exercise, items]) => {
    const sorted = [...items].sort((a, b) => a.date < b.date ? 1 : -1); // mas reciente primero
    const best = items.reduce((m, r) => {
      if (!m) return r;
      if (r.unit === 'seg') return r.value < m.value ? r : m; // menor tiempo es mejor
      return r.value > m.value ? r : m;                        // mayor peso/reps es mejor
    }, null);
    return { exercise, items: sorted, best };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Mis records (PR)</h1>
          <p className="text-slate-500">Registra tus marcas y mira tu progreso</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><IconPlus className="w-5 h-5" /> Nueva marca</button>
      </div>

      {exercises.length === 0 ? <Empty>Aún no tienes marcas. ¡Registra tu primer PR! 🏋️</Empty> : (
        <div className="grid md:grid-cols-2 gap-4">
          {exercises.map((g) => (
            <div key={g.exercise} className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{g.exercise}</h3>
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-sm font-extrabold text-amber-600 dark:text-amber-300">
                  <IconTrophy className="w-4 h-4" /> {g.best.value} {g.best.unit}
                </span>
              </div>
              <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {g.items.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2">
                    <span className="text-slate-500">{fdate(r.date)}</span>
                    <span className="flex items-center gap-3">
                      <b>{r.value} {r.unit}</b>
                      <button onClick={() => remove(r)} className="rounded-lg p-1 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva marca (PR)">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Ejercicio *</label>
            <input className="input" list="ejercicios" value={form.exercise} onChange={set('exercise')} placeholder="Ej: Back Squat" required />
            <datalist id="ejercicios">
              {['Back Squat','Front Squat','Deadlift','Press banca','Clean','Snatch','Clean & Jerk','Strict Press','Push Press','Pull-up','Fran','Murph','Grace','Cindy'].map((x) => <option key={x} value={x} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Valor *</label><input type="number" step="0.1" className="input" value={form.value} onChange={set('value')} required /></div>
            <div>
              <label className="label">Unidad</label>
              <select className="select" value={form.unit} onChange={set('unit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
            </div>
          </div>
          <div><label className="label">Fecha</label><input type="date" className="input" value={form.date} onChange={set('date')} /></div>
          <div><label className="label">Notas (opcional)</label><input className="input" value={form.notes} onChange={set('notes')} /></div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
