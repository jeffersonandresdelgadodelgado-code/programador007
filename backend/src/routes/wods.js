// ============================================================
//  Rutas de WODs (Workout of the Day) y sus RESULTADOS.
//   - Admin: crea / edita / elimina WODs.
//   - Cliente: ve el WOD, registra su resultado y ve el ranking.
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Convierte un score en numero comparable segun el tipo del WOD.
// time -> segundos (mm:ss o h:mm:ss o numero); resto -> numero.
function scoreValue(score, type) {
  const s = String(score || '').trim();
  if (type === 'time') {
    if (s.includes(':')) {
      const parts = s.split(':').map((n) => parseInt(n, 10) || 0);
      return parts.reduce((acc, n) => acc * 60 + n, 0); // soporta mm:ss y h:mm:ss
    }
    return parseFloat(s) || 0;
  }
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

// Comparador de resultados para el leaderboard.
// RX siempre por encima de escalado; luego por score (time asc, resto desc).
function makeComparator(type) {
  const lowerIsBetter = type === 'time';
  return (a, b) => {
    if (a.rx !== b.rx) return b.rx - a.rx; // RX (1) antes que escalado (0)
    const va = scoreValue(a.score, type);
    const vb = scoreValue(b.score, type);
    return lowerIsBetter ? va - vb : vb - va;
  };
}

const today = () => new Date().toISOString().slice(0, 10);

// GET /api/wods  -> lista de WODs (con mi resultado y cuantos registraron)
router.get('/', async (req, res) => {
  const rows = await db.prepare('SELECT * FROM wods ORDER BY wod_date DESC, id DESC').all();
  const clientId = req.user.client_id;
  const data = await Promise.all(rows.map(async (w) => {
    const count = (await db.prepare('SELECT COUNT(*) AS n FROM wod_results WHERE wod_id = ?').get(w.id)).n;
    let my_result = null;
    if (clientId) {
      my_result = await db.prepare('SELECT * FROM wod_results WHERE wod_id = ? AND client_id = ?').get(w.id, clientId);
    }
    return { ...w, results_count: count, my_result: my_result || null };
  }));
  res.json(data);
});

// GET /api/wods/today  -> el WOD de hoy (o null)
router.get('/today', async (req, res) => {
  const w = await db.prepare('SELECT * FROM wods WHERE wod_date = ? ORDER BY id DESC LIMIT 1').get(today());
  if (!w) return res.json(null);
  if (req.user.client_id) {
    w.my_result = await db.prepare('SELECT * FROM wod_results WHERE wod_id = ? AND client_id = ?').get(w.id, req.user.client_id) || null;
  }
  res.json(w);
});

// GET /api/wods/:id/leaderboard  -> ranking de resultados
router.get('/:id/leaderboard', async (req, res) => {
  const w = await db.prepare('SELECT * FROM wods WHERE id = ?').get(req.params.id);
  if (!w) return res.status(404).json({ error: 'WOD no encontrado' });
  const rows = await db.prepare(`
    SELECT r.*, c.full_name FROM wod_results r
    JOIN clients c ON c.id = r.client_id WHERE r.wod_id = ?
  `).all(w.id);
  rows.sort(makeComparator(w.score_type));
  res.json({ wod: w, results: rows.map((r, i) => ({ ...r, position: i + 1 })) });
});

// POST /api/wods  -> crear WOD (admin)
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.wod_date) return res.status(400).json({ error: 'Titulo y fecha son obligatorios' });
  const info = await db.prepare(`
    INSERT INTO wods (wod_date, title, type, description, score_type) VALUES (?, ?, ?, ?, ?)
  `).run(b.wod_date, b.title, b.type || 'For Time', b.description || null, b.score_type || 'time');
  res.status(201).json(await db.prepare('SELECT * FROM wods WHERE id = ?').get(info.lastInsertRowid));
});

// PUT /api/wods/:id (admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const w = await db.prepare('SELECT * FROM wods WHERE id = ?').get(req.params.id);
  if (!w) return res.status(404).json({ error: 'WOD no encontrado' });
  await db.prepare('UPDATE wods SET wod_date=?, title=?, type=?, description=?, score_type=? WHERE id=?')
    .run(b.wod_date ?? w.wod_date, b.title ?? w.title, b.type ?? w.type, b.description ?? w.description, b.score_type ?? w.score_type, w.id);
  res.json(await db.prepare('SELECT * FROM wods WHERE id = ?').get(w.id));
});

// DELETE /api/wods/:id (admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await db.prepare('DELETE FROM wods WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/wods/:id/result  -> el cliente registra/actualiza su resultado
router.post('/:id/result', async (req, res) => {
  const clientId = req.user.client_id || req.body.client_id;
  if (!clientId) return res.status(400).json({ error: 'Este usuario no es un cliente' });
  const b = req.body || {};
  if (!b.score) return res.status(400).json({ error: 'Indica tu resultado' });
  const w = await db.prepare('SELECT id FROM wods WHERE id = ?').get(req.params.id);
  if (!w) return res.status(404).json({ error: 'WOD no encontrado' });

  // upsert: si ya tiene resultado, lo actualiza
  const existing = await db.prepare('SELECT id FROM wod_results WHERE wod_id = ? AND client_id = ?').get(w.id, clientId);
  if (existing) {
    await db.prepare('UPDATE wod_results SET score=?, rx=?, notes=? WHERE id=?')
      .run(b.score, b.rx ? 1 : 0, b.notes || null, existing.id);
  } else {
    await db.prepare('INSERT INTO wod_results (wod_id, client_id, score, rx, notes) VALUES (?, ?, ?, ?, ?)')
      .run(w.id, clientId, b.score, b.rx ? 1 : 0, b.notes || null);
  }
  res.json({ ok: true });
});

// DELETE /api/wods/:id/result  -> el cliente borra su resultado
router.delete('/:id/result', async (req, res) => {
  const clientId = req.user.client_id;
  await db.prepare('DELETE FROM wod_results WHERE wod_id = ? AND client_id = ?').run(req.params.id, clientId);
  res.json({ ok: true });
});

export default router;
