// ============================================================
//  Rutas de PRODUCTOS, INVENTARIO y VENTAS
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// GET /api/products  -> catalogo (clientes y admin)
router.get('/', async (_req, res) => {
  res.json(await db.prepare('SELECT * FROM products ORDER BY category, name').all());
});

// POST /api/products  -> crear producto (admin)
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const info = await db.prepare(`INSERT INTO products (name, category, description, price, stock, image)
                           VALUES (?, ?, ?, ?, ?, ?)`)
    .run(b.name, b.category || 'Accesorio', b.description || null, b.price || 0, b.stock || 0, b.image || null);
  res.status(201).json(await db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid));
});

// PUT /api/products/:id (admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const p = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  await db.prepare('UPDATE products SET name=?, category=?, description=?, price=?, stock=?, image=? WHERE id=?')
    .run(b.name ?? p.name, b.category ?? p.category, b.description ?? p.description,
         b.price ?? p.price, b.stock ?? p.stock, b.image ?? p.image, p.id);
  res.json(await db.prepare('SELECT * FROM products WHERE id = ?').get(p.id));
});

// DELETE /api/products/:id (admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/products/:id/sell  -> registrar venta y descontar stock (admin)
router.post('/:id/sell', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const qty = Number(b.quantity) || 1;
  const p = await db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  if (p.stock < qty) return res.status(400).json({ error: 'Stock insuficiente' });

  await db.tx(async (tx) => {
    const total = p.price * qty;
    await tx.prepare(`INSERT INTO sales (product_id, client_id, quantity, unit_price, total)
                VALUES (?, ?, ?, ?, ?)`).run(p.id, b.client_id || null, qty, p.price, total);
    await tx.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, p.id);
  });
  res.json(await db.prepare('SELECT * FROM products WHERE id = ?').get(p.id));
});

// GET /api/products/sales/history  -> historial de ventas (admin)
router.get('/sales/history', requireRole('admin'), async (_req, res) => {
  res.json(await db.prepare(`
    SELECT s.*, p.name AS product_name, c.full_name AS client_name
    FROM sales s JOIN products p ON p.id = s.product_id
    LEFT JOIN clients c ON c.id = s.client_id
    ORDER BY s.sale_date DESC
  `).all());
});

export default router;
