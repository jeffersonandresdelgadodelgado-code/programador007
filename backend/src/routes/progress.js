// ============================================================
//  Rutas de SEGUIMIENTO FISICO (peso, grasa, masa, medidas)
//  El cliente registra sus propias medidas; el admin puede ver
//  las de cualquier cliente.
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Resuelve el client_id objetivo segun el rol
function resolveClientId(req) {
  if (req.user.role === 'admin') return req.query.client_id || req.body?.client_id || null;
  return req.user.client_id;
}

// GET /api/progress  -> historial de medidas (ordenado por fecha asc para graficar)
router.get('/', async (req, res) => {
  const clientId = resolveClientId(req);
  if (!clientId) return res.status(400).json({ error: 'Falta el cliente' });
  const rows = await db.prepare('SELECT * FROM measurements WHERE client_id = ? ORDER BY date ASC, id ASC').all(clientId);
  res.json(rows);
});

// POST /api/progress  -> registrar nueva medida
router.post('/', async (req, res) => {
  const b = req.body || {};
  const clientId = resolveClientId(req);
  if (!clientId) return res.status(400).json({ error: 'Falta el cliente' });
  const info = await db.prepare(`
    INSERT INTO measurements (client_id, date, weight, body_fat, muscle_mass, chest, waist, hip, arm, leg, notes)
    VALUES (@client_id, @date, @weight, @body_fat, @muscle_mass, @chest, @waist, @hip, @arm, @leg, @notes)
  `).run({
    client_id: clientId,
    date: b.date || new Date().toISOString().slice(0, 10),
    weight: b.weight ?? null, body_fat: b.body_fat ?? null, muscle_mass: b.muscle_mass ?? null,
    chest: b.chest ?? null, waist: b.waist ?? null, hip: b.hip ?? null,
    arm: b.arm ?? null, leg: b.leg ?? null, notes: b.notes ?? null,
  });
  res.status(201).json(await db.prepare('SELECT * FROM measurements WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/progress/:id
router.delete('/:id', async (req, res) => {
  const m = await db.prepare('SELECT * FROM measurements WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Registro no encontrado' });
  if (req.user.role !== 'admin' && req.user.client_id !== m.client_id) {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  await db.prepare('DELETE FROM measurements WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
