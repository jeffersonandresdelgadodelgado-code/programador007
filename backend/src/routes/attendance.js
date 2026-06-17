// ============================================================
//  Rutas de ASISTENCIA
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

const today = () => new Date().toISOString().slice(0, 10);

// GET /api/attendance/today  -> asistencia del dia (admin)
router.get('/today', requireRole('admin'), async (_req, res) => {
  const rows = await db.prepare(`
    SELECT a.*, c.full_name FROM attendance a JOIN clients c ON c.id = a.client_id
    WHERE a.date = ? ORDER BY a.check_in DESC
  `).all(today());
  res.json(rows);
});

// GET /api/attendance/client/:id  -> historial y total de un cliente
router.get('/client/:id', async (req, res) => {
  const clientId = Number(req.params.id);
  if (req.user.role !== 'admin' && req.user.client_id !== clientId) {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  const history = await db.prepare('SELECT * FROM attendance WHERE client_id = ? ORDER BY date DESC').all(clientId);
  res.json({ total: history.length, history });
});

// POST /api/attendance  -> registrar entrada (admin marca por cedula/cliente)
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  let clientId = b.client_id;
  if (!clientId && b.cedula) {
    const c = await db.prepare('SELECT id FROM clients WHERE cedula = ?').get(String(b.cedula).trim());
    if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
    clientId = c.id;
  }
  if (!clientId) return res.status(400).json({ error: 'Indica el cliente o la cedula' });
  try {
    await db.prepare('INSERT INTO attendance (client_id, date) VALUES (?, ?)').run(clientId, b.date || today());
  } catch {
    return res.status(409).json({ error: 'La asistencia de hoy ya fue registrada' });
  }
  res.status(201).json({ ok: true });
});

// POST /api/attendance/self  -> el cliente registra su propia asistencia
router.post('/self', async (req, res) => {
  const clientId = req.user.client_id;
  if (!clientId) return res.status(400).json({ error: 'Este usuario no es un cliente' });
  try {
    await db.prepare('INSERT INTO attendance (client_id, date) VALUES (?, ?)').run(clientId, today());
  } catch {
    return res.status(409).json({ error: 'Ya registraste tu asistencia de hoy' });
  }
  res.status(201).json({ ok: true });
});

export default router;
