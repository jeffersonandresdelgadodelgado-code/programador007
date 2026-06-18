// ============================================================
//  Rutas de RECORDS PERSONALES (PR) del atleta.
//   - El cliente registra y consulta sus marcas.
//   - El admin puede ver las de cualquier cliente (?client_id=).
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

function resolveClientId(req) {
  if (req.user.role === 'admin') return req.query.client_id || req.body?.client_id || null;
  return req.user.client_id;
}

// GET /api/records  -> marcas del cliente (agrupables por ejercicio en el front)
router.get('/', async (req, res) => {
  const clientId = resolveClientId(req);
  if (!clientId) return res.status(400).json({ error: 'Falta el cliente' });
  const rows = await db.prepare('SELECT * FROM records WHERE client_id = ? ORDER BY exercise, date DESC').all(clientId);
  res.json(rows);
});

// POST /api/records  -> registrar una marca
router.post('/', async (req, res) => {
  const b = req.body || {};
  const clientId = resolveClientId(req);
  if (!clientId) return res.status(400).json({ error: 'Falta el cliente' });
  if (!b.exercise || b.value == null || b.value === '') {
    return res.status(400).json({ error: 'Ejercicio y valor son obligatorios' });
  }
  const info = await db.prepare(`
    INSERT INTO records (client_id, exercise, value, unit, date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(clientId, b.exercise.trim(), Number(b.value), b.unit || 'kg', b.date || new Date().toISOString().slice(0, 10), b.notes || null);
  res.status(201).json(await db.prepare('SELECT * FROM records WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/records/:id
router.delete('/:id', async (req, res) => {
  const r = await db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Registro no encontrado' });
  if (req.user.role !== 'admin' && req.user.client_id !== r.client_id) {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  await db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
