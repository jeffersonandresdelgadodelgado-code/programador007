// ============================================================
//  Rutas de EVENTOS e INSCRIPCIONES
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Cuenta inscritos y si el cliente actual esta inscrito
async function decorate(events, clientId) {
  return Promise.all(events.map(async (e) => {
    const count = (await db.prepare('SELECT COUNT(*) AS n FROM event_registrations WHERE event_id = ?').get(e.id)).n;
    const mine = clientId
      ? !!(await db.prepare('SELECT 1 AS x FROM event_registrations WHERE event_id = ? AND client_id = ?').get(e.id, clientId))
      : false;
    return { ...e, registered: count, is_registered: mine };
  }));
}

// GET /api/events  -> proximos y pasados
router.get('/', async (req, res) => {
  const rows = await db.prepare('SELECT * FROM events ORDER BY event_date DESC').all();
  res.json(await decorate(rows, req.user.client_id));
});

// GET /api/events/:id  -> detalle con lista de inscritos (admin)
router.get('/:id', requireRole('admin'), async (req, res) => {
  const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  event.registrations = await db.prepare(`
    SELECT c.id, c.full_name, c.phone, er.registered_at
    FROM event_registrations er JOIN clients c ON c.id = er.client_id
    WHERE er.event_id = ? ORDER BY er.registered_at
  `).all(event.id);
  res.json(event);
});

// POST /api/events  -> crear evento (admin)
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.event_date) return res.status(400).json({ error: 'Titulo y fecha son obligatorios' });
  const info = await db.prepare(`
    INSERT INTO events (title, description, type, event_date, event_time, location, capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(b.title, b.description || null, b.type || 'Competencia', b.event_date, b.event_time || null, b.location || null, b.capacity || 0);
  res.status(201).json(await db.prepare('SELECT * FROM events WHERE id = ?').get(info.lastInsertRowid));
});

// PUT /api/events/:id (admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const e = await db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Evento no encontrado' });
  await db.prepare(`UPDATE events SET title=?, description=?, type=?, event_date=?, event_time=?, location=?, capacity=? WHERE id=?`)
    .run(b.title ?? e.title, b.description ?? e.description, b.type ?? e.type, b.event_date ?? e.event_date,
         b.event_time ?? e.event_time, b.location ?? e.location, b.capacity ?? e.capacity, e.id);
  res.json(await db.prepare('SELECT * FROM events WHERE id = ?').get(e.id));
});

// DELETE /api/events/:id (admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/events/:id/register  -> el cliente se inscribe
router.post('/:id/register', async (req, res) => {
  const clientId = req.user.client_id || req.body.client_id;
  if (!clientId) return res.status(400).json({ error: 'Falta el cliente' });
  const event = await db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (event.capacity > 0) {
    const count = (await db.prepare('SELECT COUNT(*) AS n FROM event_registrations WHERE event_id = ?').get(event.id)).n;
    if (count >= event.capacity) return res.status(409).json({ error: 'Cupo lleno' });
  }
  await db.prepare('INSERT OR IGNORE INTO event_registrations (event_id, client_id) VALUES (?, ?)').run(event.id, clientId);
  res.json({ ok: true });
});

// DELETE /api/events/:id/register  -> el cliente cancela su inscripcion
router.delete('/:id/register', async (req, res) => {
  const clientId = req.user.client_id || req.body.client_id;
  await db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND client_id = ?').run(req.params.id, clientId);
  res.json({ ok: true });
});

export default router;
