// ============================================================
//  Modulo de CLIENTES (admin): listar, buscar, crear, editar,
//  eliminar. Al crear un cliente se genera su usuario de acceso.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { Modal, Spinner, Empty, fdate } from '../components/ui';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

const empty = {
  cedula: '', full_name: '', phone: '', email: '', birth_date: '',
  occupation: '', initial_weight: '', height: '', goal: '', join_date: '',
};

export default function Clients() {
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await api.get('/clients', { params: { q } });
    setList(data);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  function openNew() { setForm(empty); setEditing(null); setError(''); setOpen(true); }
  function openEdit(c) {
    setForm({ ...empty, ...c, initial_weight: c.initial_weight ?? '', height: c.height ?? '' });
    setEditing(c.id); setError(''); setOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        initial_weight: form.initial_weight ? Number(form.initial_weight) : null,
        height: form.height ? Number(form.height) : null,
      };
      if (editing) await api.put(`/clients/${editing}`, payload);
      else await api.post('/clients', payload);
      setOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar');
    } finally { setSaving(false); }
  }

  async function remove(c) {
    if (!confirm(`Eliminar a ${c.full_name}? Se borraran tambien sus pagos y datos.`)) return;
    await api.delete(`/clients/${c.id}`);
    await load();
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Clientes</h1>
          <p className="text-slate-500">Gestiona los miembros del gimnasio</p>
        </div>
        <button className="btn-primary" onClick={openNew}><IconPlus className="w-5 h-5" /> Nuevo cliente</button>
      </div>

      <input className="input max-w-md" placeholder="Buscar por nombre o cedula..." value={q} onChange={(e) => setQ(e.target.value)} />

      {!list ? <Spinner /> : list.length === 0 ? <Empty>No hay clientes registrados.</Empty> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Cedula</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Telefono</th>
                  <th className="px-4 py-3 font-semibold hidden lg:table-cell">Ingreso</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-semibold">{c.full_name}
                      <div className="text-xs font-normal text-slate-400">{c.email || 'sin correo'}</div>
                    </td>
                    <td className="px-4 py-3">{c.cedula}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{c.phone || '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{fdate(c.join_date)}</td>
                    <td className="px-4 py-3">
                      <span className={c.status === 'Activo' ? 'badge-ok' : 'badge-bad'}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-brand hover:bg-brand/10"><IconEdit className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'} width="max-w-2xl">
        <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Cedula *</label>
            <input className="input" value={form.cedula} onChange={set('cedula')} disabled={!!editing} required />
          </div>
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input" value={form.full_name} onChange={set('full_name')} required />
          </div>
          <div><label className="label">Telefono</label><input className="input" value={form.phone || ''} onChange={set('phone')} /></div>
          <div><label className="label">Correo</label><input type="email" className="input" value={form.email || ''} onChange={set('email')} /></div>
          <div><label className="label">Fecha de nacimiento</label><input type="date" className="input" value={form.birth_date || ''} onChange={set('birth_date')} /></div>
          <div><label className="label">Profesion / ocupacion</label><input className="input" value={form.occupation || ''} onChange={set('occupation')} /></div>
          <div><label className="label">Peso inicial (kg)</label><input type="number" step="0.1" className="input" value={form.initial_weight} onChange={set('initial_weight')} /></div>
          <div><label className="label">Estatura (cm)</label><input type="number" step="0.1" className="input" value={form.height} onChange={set('height')} /></div>
          <div><label className="label">Fecha de ingreso</label><input type="date" className="input" value={form.join_date || ''} onChange={set('join_date')} /></div>
          <div className="sm:col-span-2"><label className="label">Objetivo deportivo</label><textarea className="input" rows="2" value={form.goal || ''} onChange={set('goal')} /></div>
          {error && <p className="sm:col-span-2 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-500">{error}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
