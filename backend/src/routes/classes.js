// ============================================================
//  Rutas de CLASES (horario semanal) y RESERVAS.
//   - Admin: define las clases (dia de la semana, hora, cupos, coach).
//   - Cliente: ve el horario proximo y reserva / cancela su cupo.
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

const iso = (d) => d.toISOString().slice(0, 10);
const todayISO = () => iso(new Date());

// GET /api/classes  -> plantillas de clases (horario base)
router.get('/', async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM classes WHERE active = 1 ORDER BY weekday, time').all();
  res.json(rows);
});

// GET /api/classes/schedule?days=14  -> proximas sesiones reservables
router.get('/schedule', async (req, res) => {
  const days = Math.min(Number(req.query.days) || 14, 31);
  const clientId = req.user.client_id;
  const classes = await db.prepare('SELECT * FROM classes WHERE active = 1').all();

  const sessions = [];
  const base = new Date(todayISO() + 'T00:00:00');
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const date = iso(d);
    const weekday = d.getDay();
    for (const c of classes.filter((x) => x.weekday === weekday)) {
      const booked = (await db.prepare('SELECT COUNT(*) AS n FROM class_bookings WHERE class_id = ? AND session_date = ?').get(c.id, date)).n;
      const mine = clientId
        ? !!(await db.prepare('SELECT 1 AS x FROM class_bookings WHERE class_id = ? AND session_date = ? AND client_id = ?').get(c.id, date, clientId))
        : false;
      sessions.push({
        class_id: c.id, name: c.name, coach: c.coach, time: c.time, capacity: c.capacity,
        date, weekday, booked, spots_left: Math.max(c.capacity - booked, 0), is_booked: mine,
      });
    }
  }
  sessions.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(sessions);
});

// GET /api/classes/:id/bookings?date=  -> inscritos a una sesion (admin)
router.get('/:id/bookings', requireRole('admin'), async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Falta la fecha' });
  const rows = await db.prepare(`
    SELECT b.*, c.full_name, c.phone FROM class_bookings b
    JOIN clients c ON c.id = b.client_id
    WHERE b.class_id = ? AND b.session_date = ? ORDER BY b.created_at
  `).all(req.params.id, date);
  res.json(rows);
});

// POST /api/classes  -> crear clase (admin)
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.name || b.weekday == null || !b.time) return res.status(400).json({ error: 'Nombre, día y hora son obligatorios' });
  const info = await db.prepare('INSERT INTO classes (name, weekday, time, capacity, coach) VALUES (?, ?, ?, ?, ?)')
    .run(b.name, Number(b.weekday), b.time, Number(b.capacity) || 12, b.coach || null);
  res.status(201).json(await db.prepare('SELECT * FROM classes WHERE id = ?').get(info.lastInsertRowid));
});

// PUT /api/classes/:id (admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const c = await db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Clase no encontrada' });
  await db.prepare('UPDATE classes SET name=?, weekday=?, time=?, capacity=?, coach=? WHERE id=?')
    .run(b.name ?? c.name, b.weekday ?? c.weekday, b.time ?? c.time, b.capacity ?? c.capacity, b.coach ?? c.coach, c.id);
  res.json(await db.prepare('SELECT * FROM classes WHERE id = ?').get(c.id));
});

// DELETE /api/classes/:id (admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/classes/:id/book  -> { date }  el cliente reserva un cupo
router.post('/:id/book', async (req, res) => {
  const clientId = req.user.client_id || req.body.client_id;
  if (!clientId) return res.status(400).json({ error: 'Este usuario no es un cliente' });
  const { date } = req.body || {};
  if (!date) return res.status(400).json({ error: 'Falta la fecha de la clase' });
  if (date < todayISO()) return res.status(400).json({ error: 'No puedes reservar una clase pasada' });

  const c = await db.prepare('SELECT * FROM classes WHERE id = ? AND active = 1').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Clase no encontrada' });

  const booked = (await db.prepare('SELECT COUNT(*) AS n FROM class_bookings WHERE class_id = ? AND session_date = ?').get(c.id, date)).n;
  if (booked >= c.capacity) return res.status(409).json({ error: 'No hay cupos disponibles para esa clase' });

  try {
    await db.prepare('INSERT INTO class_bookings (class_id, client_id, session_date) VALUES (?, ?, ?)').run(c.id, clientId, date);
  } catch {
    return res.status(409).json({ error: 'Ya tienes reservada esa clase' });
  }
  res.status(201).json({ ok: true });
});

// DELETE /api/classes/:id/book?date=  -> el cliente cancela su reserva
router.delete('/:id/book', async (req, res) => {
  const clientId = req.user.client_id;
  const date = req.query.date || req.body?.date;
  await db.prepare('DELETE FROM class_bookings WHERE class_id = ? AND client_id = ? AND session_date = ?').run(req.params.id, clientId, date);
  res.json({ ok: true });
});

export default router;
