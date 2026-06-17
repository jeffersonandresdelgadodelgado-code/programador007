// ============================================================
//  Modulo de PRODUCTOS (admin): inventario, creacion/edicion,
//  y registro de ventas (descuenta stock).
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { Modal, Spinner, Empty, money } from '../components/ui';
import { IconPlus, IconEdit, IconTrash, IconBox } from '../components/Icons';

export default function Products() {
  const [list, setList] = useState(null);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [sellFor, setSellFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const empty = { name: '', category: 'Camiseta', description: '', price: 0, stock: 0 };
  const [form, setForm] = useState(empty);
  const [sale, setSale] = useState({ quantity: 1, client_id: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [p, c] = await Promise.all([api.get('/products'), api.get('/clients')]);
    setList(p.data); setClients(c.data);
  }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function openNew() { setForm(empty); setEditing(null); setOpen(true); }
  function openEdit(p) { setForm({ ...empty, ...p }); setEditing(p.id); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
      if (editing) await api.put(`/products/${editing}`, payload);
      else await api.post('/products', payload);
      setOpen(false); await load();
    } finally { setSaving(false); }
  }
  async function remove(p) {
    if (!confirm(`Eliminar "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}`); await load();
  }
  async function doSell(e) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/products/${sellFor.id}/sell`, { quantity: Number(sale.quantity), client_id: sale.client_id || null });
      setSellFor(null); setSale({ quantity: 1, client_id: '' }); await load();
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo registrar la venta');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Productos e inventario</h1>
          <p className="text-slate-500">Camisetas, accesorios y suplementos</p>
        </div>
        <button className="btn-primary" onClick={openNew}><IconPlus className="w-5 h-5" /> Nuevo producto</button>
      </div>

      {!list ? <Spinner /> : list.length === 0 ? <Empty>No hay productos.</Empty> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand"><IconBox className="w-6 h-6" /></div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-brand hover:bg-brand/10"><IconEdit className="w-4 h-4" /></button>
                  <button onClick={() => remove(p)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="mt-3 font-bold">{p.name}</h3>
              <span className="badge-warn">{p.category}</span>
              {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-extrabold text-brand">{money(p.price)}</span>
                <span className={`badge ${p.stock > 0 ? 'badge-ok' : 'badge-bad'}`}>Stock: {p.stock}</span>
              </div>
              <button className="btn-ghost mt-3 w-full" disabled={p.stock <= 0} onClick={() => setSellFor(p)}>Registrar venta</button>
            </div>
          ))}
        </div>
      )}

      {/* Crear / editar producto */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Nombre *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Categoria</label>
              <select className="select" value={form.category} onChange={set('category')}>
                <option>Camiseta</option><option>Accesorio</option><option>Suplemento</option>
              </select>
            </div>
            <div><label className="label">Precio</label><input type="number" className="input" value={form.price} onChange={set('price')} /></div>
          </div>
          <div><label className="label">Stock</label><input type="number" className="input" value={form.stock} onChange={set('stock')} /></div>
          <div><label className="label">Descripcion</label><textarea className="input" rows="2" value={form.description} onChange={set('description')} /></div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* Registrar venta */}
      <Modal open={!!sellFor} onClose={() => setSellFor(null)} title={`Vender: ${sellFor?.name}`}>
        <form onSubmit={doSell} className="space-y-4">
          <p className="text-sm text-slate-500">Precio unitario: <b>{money(sellFor?.price)}</b> · Stock: {sellFor?.stock}</p>
          <div><label className="label">Cantidad</label><input type="number" min="1" max={sellFor?.stock} className="input" value={sale.quantity} onChange={(e) => setSale((s) => ({ ...s, quantity: e.target.value }))} /></div>
          <div>
            <label className="label">Cliente (opcional)</label>
            <select className="select" value={sale.client_id} onChange={(e) => setSale((s) => ({ ...s, client_id: e.target.value }))}>
              <option value="">Venta general</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <p className="text-right text-lg font-bold">Total: {money((sellFor?.price || 0) * Number(sale.quantity || 0))}</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setSellFor(null)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Registrando...' : 'Registrar venta'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
