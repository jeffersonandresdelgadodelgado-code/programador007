// ============================================================
//  Modulo de EVENTOS (compartido).
//   - Admin: crear / editar / eliminar eventos.
//   - Cliente: inscribirse o cancelar su inscripcion.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, Spinner, Empty, fdate } from '../components/ui';
import { IconPlus, IconEdit, IconTrash, IconCalendar } from '../components/Icons';

// Reduce y comprime una imagen en el navegador antes de subirla,
// para que pese poco (max ~1000px, JPEG calidad 0.7). Devuelve un data URL base64.
function resizeImage(file, maxSize = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Events() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const empty = { title: '', description: '', type: 'Competencia', event_date: '', event_time: '', location: '', capacity: 0, image: '' };
  const [form, setForm] = useState(empty);

  // Selecciona una imagen, la reduce y la guarda en el formulario
  async function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setForm((f) => ({ ...f, image: dataUrl }));
    } catch {
      alert('No se pudo procesar la imagen');
    }
  }

  async function load() { setList((await api.get('/events')).data); }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  function openNew() { setForm(empty); setEditing(null); setOpen(true); }
  function openEdit(ev) { setForm({ ...empty, ...ev }); setEditing(ev.id); setOpen(true); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity) || 0, image: form.image || null };
      if (editing) await api.put(`/events/${editing}`, payload);
      else await api.post('/events', payload);
      setOpen(false); await load();
    } finally { setSaving(false); }
  }
  async function remove(ev) {
    if (!confirm(`Eliminar el evento "${ev.title}"?`)) return;
    await api.delete(`/events/${ev.id}`); await load();
  }
  async function toggleReg(ev) {
    if (ev.is_registered) await api.delete(`/events/${ev.id}/register`);
    else await api.post(`/events/${ev.id}/register`);
    await load();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Eventos</h1>
          <p className="text-slate-500">Competencias y entrenamientos especiales</p>
        </div>
        {isAdmin && <button className="btn-primary" onClick={openNew}><IconPlus className="w-5 h-5" /> Nuevo evento</button>}
      </div>

      {!list ? <Spinner /> : list.length === 0 ? <Empty>No hay eventos programados.</Empty> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((ev) => {
            const past = ev.event_date < today;
            return (
              <div key={ev.id} className={`card overflow-hidden p-5 ${past ? 'opacity-60' : ''}`}>
                {ev.image && (
                  <img src={ev.image} alt={ev.title} className="-mx-5 -mt-5 mb-4 h-40 w-[calc(100%+2.5rem)] max-w-none object-cover" />
                )}
                <div className="flex items-start justify-between">
                  <span className="badge-warn">{ev.type}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(ev)} className="rounded-lg p-1.5 text-brand hover:bg-brand/10"><IconEdit className="w-4 h-4" /></button>
                      <button onClick={() => remove(ev)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-bold">{ev.title}</h3>
                {ev.description && <p className="mt-1 text-sm text-slate-500">{ev.description}</p>}
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <IconCalendar className="w-4 h-4" /> {fdate(ev.event_date)} {ev.event_time && `· ${ev.event_time}`}
                </div>
                {ev.location && <p className="text-sm text-slate-500">{ev.location}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {ev.registered} inscrito(s){ev.capacity ? ` / ${ev.capacity} cupos` : ''}
                </p>
                {!isAdmin && !past && (
                  <button onClick={() => toggleReg(ev)} className={`mt-4 w-full ${ev.is_registered ? 'btn-ghost' : 'btn-primary'}`}>
                    {ev.is_registered ? 'Cancelar inscripcion' : 'Inscribirme'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Editar evento' : 'Nuevo evento'}>
        <form onSubmit={save} className="space-y-4">
          <div><label className="label">Titulo *</label><input className="input" value={form.title} onChange={set('title')} required /></div>
          <div><label className="label">Descripcion</label><textarea className="input" rows="2" value={form.description} onChange={set('description')} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={form.type} onChange={set('type')}>
                <option>Competencia</option><option>Entrenamiento especial</option>
              </select>
            </div>
            <div><label className="label">Cupos (0 = sin limite)</label><input type="number" className="input" value={form.capacity} onChange={set('capacity')} /></div>
            <div><label className="label">Fecha *</label><input type="date" className="input" value={form.event_date} onChange={set('event_date')} required /></div>
            <div><label className="label">Hora</label><input type="time" className="input" value={form.event_time || ''} onChange={set('event_time')} /></div>
          </div>
          <div><label className="label">Lugar</label><input className="input" value={form.location || ''} onChange={set('location')} /></div>
          <div>
            <label className="label">Imagen del evento (opcional)</label>
            {form.image ? (
              <div className="relative">
                <img src={form.image} alt="Vista previa" className="max-h-48 w-full rounded-xl object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))}
                        title="Quitar imagen"
                        className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white hover:bg-red-600">
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={onPickImage}
                     className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-500" />
            )}
            <p className="mt-1 text-xs text-slate-400">Se reduce automaticamente para que pese poco. Puedes quitarla cuando quieras.</p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
