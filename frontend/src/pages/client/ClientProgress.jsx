// ============================================================
//  Seguimiento fisico del CLIENTE: registrar peso, % grasa,
//  masa muscular y medidas; ver graficas de evolucion.
// ============================================================
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import api from '../../api/client';
import { Modal, Spinner, Empty, fdate, ImageUpload, ZoomImage } from '../../components/ui';
import { IconPlus, IconChart } from '../../components/Icons';

const empty = { date: new Date().toISOString().slice(0, 10), weight: '', body_fat: '', muscle_mass: '', waist: '', chest: '', hip: '', arm: '', leg: '', notes: '', photo: '' };

export default function ClientProgress() {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() { setList((await api.get('/progress')).data); }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      // convierte cadenas vacias en null y numeros donde aplica
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) =>
        [k, v === '' ? null : (k === 'date' || k === 'notes' || k === 'photo' ? v : Number(v))]));
      await api.post('/progress', payload);
      setOpen(false); setForm(empty); await load();
    } finally { setSaving(false); }
  }

  if (!list) return <Spinner />;

  const chart = list.map((m) => ({ fecha: fdate(m.date).slice(0, 5), Peso: m.weight, Grasa: m.body_fat, Musculo: m.muscle_mass }));
  const last = list[list.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Mi progreso</h1>
          <p className="text-slate-500">Registra y visualiza tu evolucion</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><IconPlus className="w-5 h-5" /> Nueva medida</button>
      </div>

      {list.length === 0 ? <Empty>Aun no has registrado medidas. Agrega la primera!</Empty> : (
        <>
          {/* Indicadores actuales */}
          <div className="grid grid-cols-3 gap-4">
            {[['Peso', last.weight, 'kg'], ['Grasa', last.body_fat, '%'], ['Musculo', last.muscle_mass, 'kg']].map(([l, v, u]) => (
              <div key={l} className="card p-4 text-center">
                <p className="text-sm text-slate-500">{l}</p>
                <p className="text-2xl font-extrabold text-brand">{v ?? '-'}<span className="text-sm text-slate-400"> {u}</span></p>
              </div>
            ))}
          </div>

          {/* Grafica de evolucion */}
          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><IconChart className="w-5 h-5 text-brand" /> Evolucion</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Peso" stroke="#1CA3DE" strokeWidth={2} />
                <Line type="monotone" dataKey="Grasa" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Musculo" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Historial */}
          <div className="card overflow-hidden">
            <h3 className="border-b border-slate-100 dark:border-slate-700 px-5 py-4 font-bold">Historial</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Peso</th>
                    <th className="px-4 py-3 font-semibold">% Grasa</th>
                    <th className="px-4 py-3 font-semibold">Musculo</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Cintura</th>
                    <th className="px-4 py-3 font-semibold">Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {[...list].reverse().map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3">{fdate(m.date)}</td>
                      <td className="px-4 py-3">{m.weight ?? '-'}</td>
                      <td className="px-4 py-3">{m.body_fat ?? '-'}</td>
                      <td className="px-4 py-3">{m.muscle_mass ?? '-'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{m.waist ?? '-'}</td>
                      <td className="px-4 py-3">
                        {m.photo
                          ? <ZoomImage src={m.photo} alt="Foto de progreso" className="h-10 w-10 rounded-lg object-cover" />
                          : <span className="text-slate-400">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar medida">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Fecha</label><input type="date" className="input" value={form.date} onChange={set('date')} required /></div>
          <div><label className="label">Peso (kg)</label><input type="number" step="0.1" className="input" value={form.weight} onChange={set('weight')} /></div>
          <div><label className="label">% Grasa</label><input type="number" step="0.1" className="input" value={form.body_fat} onChange={set('body_fat')} /></div>
          <div><label className="label">Masa muscular (kg)</label><input type="number" step="0.1" className="input" value={form.muscle_mass} onChange={set('muscle_mass')} /></div>
          <div><label className="label">Cintura (cm)</label><input type="number" step="0.1" className="input" value={form.waist} onChange={set('waist')} /></div>
          <div><label className="label">Pecho (cm)</label><input type="number" step="0.1" className="input" value={form.chest} onChange={set('chest')} /></div>
          <div><label className="label">Cadera (cm)</label><input type="number" step="0.1" className="input" value={form.hip} onChange={set('hip')} /></div>
          <div><label className="label">Brazo (cm)</label><input type="number" step="0.1" className="input" value={form.arm} onChange={set('arm')} /></div>
          <div><label className="label">Pierna (cm)</label><input type="number" step="0.1" className="input" value={form.leg} onChange={set('leg')} /></div>
          <div className="col-span-2"><label className="label">Foto de progreso (opcional)</label><ImageUpload value={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
