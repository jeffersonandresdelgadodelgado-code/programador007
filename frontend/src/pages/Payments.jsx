// ============================================================
//  Modulo de PAGOS (admin): registrar pagos, ver historial y
//  alertas de mensualidades vencidas o por vencer.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { Modal, Spinner, Empty, money, fdate, whatsappLink } from '../components/ui';
import { IconPlus, IconAlert, IconTrash, IconChat } from '../components/Icons';

// Mensaje de recordatorio de pago listo para enviar por WhatsApp
function reminderText(a) {
  if (!a.due_date) {
    return `Hola ${a.full_name}, te recordamos que tienes tu mensualidad pendiente en Box Motivacion CrossFit. Te esperamos para activarla. 💪🦍`;
  }
  const verbo = a.status === 'Vencido' ? 'vencio' : 'vence';
  return `Hola ${a.full_name}, te recordamos que tu mensualidad en Box Motivacion CrossFit ${verbo} el ${fdate(a.due_date)}. Te esperamos para renovarla. 💪🦍`;
}

// Suma meses a una fecha ISO y devuelve ISO
function addMonth(iso, n = 1) {
  const d = new Date((iso || new Date().toISOString().slice(0, 10)) + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export default function Payments() {
  const [history, setHistory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ client_id: '', amount: 80000, payment_date: today, due_date: addMonth(today), method: 'Efectivo' });

  async function load() {
    const [h, a, c] = await Promise.all([
      api.get('/payments'),
      api.get('/payments/alerts'),
      api.get('/clients'),
    ]);
    setHistory(h.data); setAlerts(a.data); setClients(c.data);
  }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/payments', { ...form, amount: Number(form.amount) });
      setOpen(false);
      await load();
    } finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm('Eliminar este pago?')) return;
    await api.delete(`/payments/${id}`);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Pagos y mensualidades</h1>
          <p className="text-slate-500">Registro de pagos e historial</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><IconPlus className="w-5 h-5" /> Registrar pago</button>
      </div>

      {/* Alertas de vencimiento */}
      {alerts.length > 0 && (
        <div className="card border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 p-4">
          <div className="mb-2 flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
            <IconAlert className="w-5 h-5" /> Alertas de vencimiento ({alerts.length})
          </div>
          <div className="space-y-2">
            {alerts.map((a) => {
              const link = whatsappLink(a.phone, reminderText(a));
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-slate-800 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.full_name}</p>
                    <p className="text-xs text-slate-500">
                      <span className={a.status === 'Vencido' || a.status === 'Sin pagos' ? 'text-red-500 font-semibold' : 'text-amber-500 font-semibold'}>{a.status}</span>
                      {a.due_date ? ` · vence ${fdate(a.due_date)}` : ' · sin pagos registrados'}
                    </p>
                  </div>
                  {link ? (
                    <a href={link} target="_blank" rel="noreferrer"
                       className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600">
                      <IconChat className="w-4 h-4" /> WhatsApp
                    </a>
                  ) : <span className="shrink-0 text-xs text-slate-400">sin telefono</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!history ? <Spinner /> : history.length === 0 ? <Empty>No hay pagos registrados.</Empty> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold">Monto</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Pago</th>
                  <th className="px-4 py-3 font-semibold">Vence</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {history.map((p) => {
                  const vigente = p.due_date >= today;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-semibold">{p.full_name}</td>
                      <td className="px-4 py-3">{p.concept}</td>
                      <td className="px-4 py-3 font-semibold">{money(p.amount)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{fdate(p.payment_date)}</td>
                      <td className="px-4 py-3">
                        <span className={vigente ? 'badge-ok' : 'badge-bad'}>{fdate(p.due_date)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => remove(p.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar pago">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="select" value={form.client_id} onChange={set('client_id')} required>
              <option value="">Selecciona un cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.cedula})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Monto *</label><input type="number" className="input" value={form.amount} onChange={set('amount')} required /></div>
            <div>
              <label className="label">Metodo</label>
              <select className="select" value={form.method} onChange={set('method')}>
                <option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option>
              </select>
            </div>
            <div><label className="label">Fecha de pago</label><input type="date" className="input" value={form.payment_date} onChange={set('payment_date')} required /></div>
            <div><label className="label">Fecha de vencimiento *</label><input type="date" className="input" value={form.due_date} onChange={set('due_date')} required /></div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Registrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
