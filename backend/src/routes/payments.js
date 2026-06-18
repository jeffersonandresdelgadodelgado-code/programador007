// ============================================================
//  Rutas de PAGOS / MENSUALIDADES
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

const today = () => new Date().toISOString().slice(0, 10);

// Calcula el estado de la mensualidad de un cliente
async function statusFor(clientId) {
  const last = await db.prepare('SELECT MAX(due_date) AS due FROM payments WHERE client_id = ?').get(clientId);
  if (!last.due) return { status: 'Sin pagos', due_date: null };
  return { status: last.due >= today() ? 'Activo' : 'Vencido', due_date: last.due };
}

// GET /api/payments  -> historial (admin: todos / con ?client_id=)
router.get('/', requireRole('admin'), async (req, res) => {
  const { client_id } = req.query;
  const rows = client_id
    ? await db.prepare(`SELECT p.*, c.full_name FROM payments p JOIN clients c ON c.id = p.client_id
                  WHERE p.client_id = ? ORDER BY p.payment_date DESC`).all(client_id)
    : await db.prepare(`SELECT p.*, c.full_name FROM payments p JOIN clients c ON c.id = p.client_id
                  ORDER BY p.payment_date DESC`).all();
  res.json(rows);
});

// GET /api/payments/me  -> historial y estado del cliente autenticado
router.get('/me', async (req, res) => {
  const clientId = req.user.client_id;
  if (!clientId) return res.status(400).json({ error: 'Este usuario no es un cliente' });
  const history = await db.prepare('SELECT * FROM payments WHERE client_id = ? ORDER BY payment_date DESC').all(clientId);
  res.json({ ...(await statusFor(clientId)), history });
});

// GET /api/payments/alerts  -> clientes vencidos, por vencer (<=5 dias) o sin pagos (admin)
router.get('/alerts', requireRole('admin'), async (_req, res) => {
  // LEFT JOIN: incluye tambien a clientes que nunca han pagado (due_date null)
  const rows = await db.prepare(`
    SELECT c.id, c.full_name, c.phone, MAX(p.due_date) AS due_date
    FROM clients c LEFT JOIN payments p ON p.client_id = c.id
    GROUP BY c.id
  `).all();
  const t = today();
  const limit = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
  const alerts = rows
    .map((r) => ({
      ...r,
      status: !r.due_date ? 'Sin pagos' : (r.due_date < t ? 'Vencido' : 'Por vencer'),
    }))
    .filter((r) => !r.due_date || r.due_date < limit) // sin pagos, vencidos o que vencen pronto
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  res.json(alerts);
});

// POST /api/payments  -> registrar pago (admin)
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.client_id || !b.amount || !b.due_date) {
    return res.status(400).json({ error: 'Cliente, monto y fecha de vencimiento son obligatorios' });
  }
  const info = await db.prepare(`
    INSERT INTO payments (client_id, amount, concept, payment_date, due_date, method)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    b.client_id, b.amount, b.concept || 'Mensualidad',
    b.payment_date || today(), b.due_date, b.method || 'Efectivo'
  );
  res.status(201).json(await db.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/payments/:id (admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
