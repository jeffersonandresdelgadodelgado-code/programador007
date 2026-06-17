// ============================================================
//  Modulo de RUTINAS (admin): crear rutinas con sus ejercicios
//  (series, repeticiones, descanso, media) y asignarlas a
//  clientes.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { Modal, Spinner, Empty } from '../components/ui';
import { IconPlus, IconEdit, IconTrash, IconDumbbell } from '../components/Icons';

const blankExercise = () => ({ name: '', description: '', sets: 3, reps: '12', rest_seconds: 60, media_url: '' });

export default function Routines() {
  const [list, setList] = useState(null);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [assignFor, setAssignFor] = useState(null); // rutina a la que asignar
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', level: 'Intermedio', exercises: [blankExercise()] });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [r, c] = await Promise.all([api.get('/routines'), api.get('/clients')]);
    setList(r.data); setClients(c.data);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ name: '', description: '', level: 'Intermedio', exercises: [blankExercise()] });
    setEditing(null); setOpen(true);
  }
  function openEdit(r) {
    setForm({ name: r.name, description: r.description || '', level: r.level, exercises: r.exercises.length ? r.exercises : [blankExercise()] });
    setEditing(r.id); setOpen(true);
  }

  const setEx = (i, k) => (e) => setForm((f) => {
    const exercises = [...f.exercises];
    exercises[i] = { ...exercises[i], [k]: e.target.value };
    return { ...f, exercises };
  });
  const addEx = () => setForm((f) => ({ ...f, exercises: [...f.exercises, blankExercise()] }));
  const delEx = (i) => setForm((f) => ({ ...f, exercises: f.exercises.filter((_, j) => j !== i) }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, exercises: form.exercises.filter((x) => x.name.trim()) };
      if (editing) await api.put(`/routines/${editing}`, payload);
      else await api.post('/routines', payload);
      setOpen(false);
      await load();
    } finally { setSaving(false); }
  }

  async function remove(r) {
    if (!confirm(`Eliminar la rutina "${r.name}"?`)) return;
    await api.delete(`/routines/${r.id}`);
    await load();
  }

  async function assign(clientId) {
    await api.post(`/routines/${assignFor.id}/assign`, { client_id: clientId });
    setAssignFor(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Rutinas de entrenamiento</h1>
          <p className="text-slate-500">Crea y asigna rutinas personalizadas</p>
        </div>
        <button className="btn-primary" onClick={openNew}><IconPlus className="w-5 h-5" /> Nueva rutina</button>
      </div>

      {!list ? <Spinner /> : list.length === 0 ? <Empty>No hay rutinas creadas.</Empty> : (
        <div className="grid md:grid-cols-2 gap-4">
          {list.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand"><IconDumbbell className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold">{r.name}</h3>
                    <span className="badge-warn">{r.level}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-brand hover:bg-brand/10"><IconEdit className="w-4 h-4" /></button>
                  <button onClick={() => remove(r)} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                </div>
              </div>
              {r.description && <p className="mt-2 text-sm text-slate-500">{r.description}</p>}
              <ul className="mt-3 space-y-1 text-sm">
                {r.exercises.map((ex) => (
                  <li key={ex.id} className="flex justify-between border-b border-slate-100 dark:border-slate-700 py-1.5">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-slate-500">{ex.sets}x{ex.reps} · {ex.rest_seconds}s</span>
                  </li>
                ))}
              </ul>
              <button className="btn-ghost mt-4 w-full" onClick={() => setAssignFor(r)}>Asignar a cliente</button>
            </div>
          ))}
        </div>
      )}

      {/* Crear / editar rutina */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar rutina' : 'Nueva rutina'} width="max-w-3xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2"><label className="label">Nombre *</label><input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></div>
            <div>
              <label className="label">Nivel</label>
              <select className="select" value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}>
                <option>Principiante</option><option>Intermedio</option><option>Avanzado</option>
              </select>
            </div>
          </div>
          <div><label className="label">Descripcion</label><textarea className="input" rows="2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Ejercicios</p>
              <button type="button" className="btn-ghost text-sm" onClick={addEx}><IconPlus className="w-4 h-4" /> Agregar</button>
            </div>
            {form.exercises.map((ex, i) => (
              <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                <div className="flex gap-2">
                  <input className="input" placeholder="Nombre del ejercicio" value={ex.name} onChange={setEx(i, 'name')} />
                  <button type="button" onClick={() => delEx(i)} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="label text-xs">Series</label><input type="number" className="input" value={ex.sets} onChange={setEx(i, 'sets')} /></div>
                  <div><label className="label text-xs">Reps</label><input className="input" value={ex.reps} onChange={setEx(i, 'reps')} /></div>
                  <div><label className="label text-xs">Descanso (s)</label><input type="number" className="input" value={ex.rest_seconds} onChange={setEx(i, 'rest_seconds')} /></div>
                </div>
                <input className="input" placeholder="Descripcion / tecnica (opcional)" value={ex.description} onChange={setEx(i, 'description')} />
                <input className="input" placeholder="URL de imagen o video (opcional)" value={ex.media_url} onChange={setEx(i, 'media_url')} />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar rutina'}</button>
          </div>
        </form>
      </Modal>

      {/* Asignar rutina */}
      <Modal open={!!assignFor} onClose={() => setAssignFor(null)} title={`Asignar "${assignFor?.name}"`}>
        <p className="mb-3 text-sm text-slate-500">Elige el cliente que recibira esta rutina.</p>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {clients.map((c) => (
            <button key={c.id} onClick={() => assign(c.id)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700">
              <span className="font-medium">{c.full_name}</span>
              <span className="text-sm text-slate-400">{c.cedula}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
