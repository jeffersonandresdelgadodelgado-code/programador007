// ============================================================
//  Modulo de WODs (compartido).
//   - Admin: crear / editar / eliminar el WOD del dia.
//   - Cliente: registrar su resultado y ver el ranking (leaderboard).
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal, Spinner, Empty, fdate } from '../components/ui';
import { IconPlus, IconEdit, IconTrash, IconFlame, IconTrophy } from '../components/Icons';

const TYPES = ['For Time', 'AMRAP', 'EMOM', 'Fuerza', 'Otro'];
// Como se mide el resultado (define el orden del ranking)
const SCORES = [
  { v: 'time', label: 'Tiempo (menor gana)', hint: 'mm:ss · ej. 12:30' },
  { v: 'reps', label: 'Repeticiones (mayor gana)', hint: 'ej. 150' },
  { v: 'weight', label: 'Peso (mayor gana)', hint: 'ej. 100' },
  { v: 'rounds', label: 'Rounds (mayor gana)', hint: 'ej. 8' },
];
const scoreHint = (t) => SCORES.find((s) => s.v === t)?.hint || '';

export default function Wods() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  // --- modales ---
  const emptyWod = { wod_date: today, title: '', type: 'For Time', score_type: 'time', description: '' };
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyWod);
  const [resultFor, setResultFor] = useState(null);
  const [result, setResult] = useState({ score: '', rx: true, notes: '' });
  const [board, setBoard] = useState(null); // { wod, results }
  const [saving, setSaving] = useState(false);

  async function load() { setList((await api.get('/wods')).data); }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ----- Admin: crear / editar WOD -----
  function openNew() { setForm(emptyWod); setEditing(null); setEditOpen(true); }
  function openEdit(w) { setForm({ ...emptyWod, ...w }); setEditing(w.id); setEditOpen(true); }
  async function saveWod(e) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/wods/${editing}`, form);
      else await api.post('/wods', form);
      setEditOpen(false); await load();
    } finally { setSaving(false); }
  }
  async function removeWod(w) {
    if (!confirm(`Eliminar el WOD "${w.title}"?`)) return;
    await api.delete(`/wods/${w.id}`); await load();
  }

  // ----- Cliente: registrar resultado -----
  function openResult(w) {
    setResult(w.my_result ? { score: w.my_result.score, rx: !!w.my_result.rx, notes: w.my_result.notes || '' } : { score: '', rx: true, notes: '' });
    setResultFor(w);
  }
  async function saveResult(e) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post(`/wods/${resultFor.id}/result`, result);
      setResultFor(null); await load();
    } finally { setSaving(false); }
  }

  // ----- Leaderboard -----
  async function openBoard(w) {
    setBoard({ loading: true });
    const { data } = await api.get(`/wods/${w.id}/leaderboard`);
    setBoard(data);
  }

  if (!list) return <Spinner />;

  const todayWod = list.find((w) => w.wod_date === today);
  const rest = list.filter((w) => w.wod_date !== today);

  // Tarjeta de un WOD
  const Card = ({ w, highlight }) => (
    <div className={`card p-5 ${highlight ? 'border-brand ring-1 ring-brand/40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {highlight && <span className="badge bg-brand text-white mb-1">WOD de hoy</span>}
          <h3 className="text-lg font-bold flex items-center gap-2"><IconFlame className="w-5 h-5 text-brand" /> {w.title}</h3>
          <p className="text-sm text-slate-500">{fdate(w.wod_date)} · <span className="badge-warn">{w.type}</span></p>
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <button onClick={() => openEdit(w)} className="rounded-lg p-1.5 text-brand hover:bg-brand/10"><IconEdit className="w-4 h-4" /></button>
            <button onClick={() => removeWod(w)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"><IconTrash className="w-4 h-4" /></button>
          </div>
        )}
      </div>
      {w.description && <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-600 dark:text-slate-300">{w.description}</pre>}
      <p className="mt-3 text-xs text-slate-400">{w.results_count} atleta(s) registrados</p>

      {/* Resultado propio del cliente */}
      {!isAdmin && w.my_result && (
        <p className="mt-1 text-sm font-semibold text-emerald-500">Tu resultado: {w.my_result.score} {w.my_result.rx ? '(RX)' : '(Esc)'}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={() => openBoard(w)} className="btn-ghost flex-1"><IconTrophy className="w-5 h-5" /> Ranking</button>
        {!isAdmin && (
          <button onClick={() => openResult(w)} className="btn-primary flex-1">
            {w.my_result ? 'Editar mi resultado' : 'Registrar resultado'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">WOD del día</h1>
          <p className="text-slate-500">{isAdmin ? 'Publica el entrenamiento y revisa el ranking' : 'Registra tu resultado y compite en el ranking'}</p>
        </div>
        {isAdmin && <button className="btn-primary" onClick={openNew}><IconPlus className="w-5 h-5" /> Nuevo WOD</button>}
      </div>

      {list.length === 0 ? <Empty>{isAdmin ? 'Aún no has publicado ningún WOD.' : 'El box aún no ha publicado WODs.'}</Empty> : (
        <>
          {todayWod && <Card w={todayWod} highlight />}
          {rest.length > 0 && (
            <>
              <h2 className="pt-2 font-bold text-slate-500">Anteriores</h2>
              <div className="grid md:grid-cols-2 gap-4">{rest.map((w) => <Card key={w.id} w={w} />)}</div>
            </>
          )}
        </>
      )}

      {/* Crear / editar WOD (admin) */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Editar WOD' : 'Nuevo WOD'}>
        <form onSubmit={saveWod} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Fecha *</label><input type="date" className="input" value={form.wod_date} onChange={set('wod_date')} required /></div>
            <div><label className="label">Nombre *</label><input className="input" value={form.title} onChange={set('title')} placeholder="Ej: Fran" required /></div>
            <div>
              <label className="label">Tipo</label>
              <select className="select" value={form.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            </div>
            <div>
              <label className="label">Se mide por</label>
              <select className="select" value={form.score_type} onChange={set('score_type')}>
                {SCORES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descripción del WOD</label>
            <textarea className="input font-mono text-sm" rows="5" value={form.description} onChange={set('description')}
                      placeholder={'21-15-9 reps:\nThrusters (43kg)\nPull-ups'} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      {/* Registrar resultado (cliente) */}
      <Modal open={!!resultFor} onClose={() => setResultFor(null)} title={`Mi resultado · ${resultFor?.title || ''}`}>
        <form onSubmit={saveResult} className="space-y-4">
          <div>
            <label className="label">Resultado *</label>
            <input className="input" value={result.score} onChange={(e) => setResult((r) => ({ ...r, score: e.target.value }))}
                   placeholder={scoreHint(resultFor?.score_type)} required />
            <p className="mt-1 text-xs text-slate-400">Formato: {scoreHint(resultFor?.score_type)}</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-5 w-5 accent-brand" checked={result.rx} onChange={(e) => setResult((r) => ({ ...r, rx: e.target.checked }))} />
            <span className="font-medium">Lo hice <b>RX</b> (sin escalar)</span>
          </label>
          <div><label className="label">Notas (opcional)</label><input className="input" value={result.notes} onChange={(e) => setResult((r) => ({ ...r, notes: e.target.value }))} /></div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setResultFor(null)}>Cancelar</button>
            <button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar resultado'}</button>
          </div>
        </form>
      </Modal>

      {/* Leaderboard */}
      <Modal open={!!board} onClose={() => setBoard(null)} title="Ranking del WOD">
        {!board || board.loading ? <Spinner /> : board.results.length === 0 ? <Empty>Nadie ha registrado resultado todavía.</Empty> : (
          <div>
            <p className="mb-3 text-sm text-slate-500">{board.wod.title} · {fdate(board.wod.wod_date)}</p>
            <ol className="space-y-2">
              {board.results.map((r) => {
                const medal = r.position === 1 ? 'bg-amber-400 text-white' : r.position === 2 ? 'bg-slate-300 text-slate-800' : r.position === 3 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500';
                return (
                  <li key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <span className="flex items-center gap-3">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${medal}`}>{r.position}</span>
                      <span className="font-semibold">{r.full_name}</span>
                      <span className={r.rx ? 'badge-ok' : 'badge-warn'}>{r.rx ? 'RX' : 'Esc'}</span>
                    </span>
                    <span className="font-extrabold text-brand">{r.score}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </Modal>
    </div>
  );
}
