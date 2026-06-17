// ============================================================
//  Rutas de CLIENTES (modulo de clientes)
//  Solo el administrador crea / edita / elimina.
//  Cada cliente lleva un registro en 'users' para poder ingresar.
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Lista de clientes con su estado de mensualidad (Activo / Vencido)
router.get('/', requireRole('admin'), async (req, res) => {
  const search = `%${(req.query.q || '').trim()}%`;
  const rows = await db.prepare(`
    SELECT c.*,
           (SELECT MAX(due_date) FROM payments p WHERE p.client_id = c.id) AS last_due_date
    FROM clients c
    WHERE c.full_name LIKE ? OR c.cedula LIKE ?
    ORDER BY c.full_name
  `).all(search, search);

  const today = new Date().toISOString().slice(0, 10);
  const data = rows.map((c) => ({
    ...c,
    status: c.last_due_date && c.last_due_date >= today ? 'Activo' : 'Vencido',
  }));
  res.json(data);
});

// Detalle de un cliente
router.get('/:id', async (req, res) => {
  const client = await db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  // un cliente solo puede ver su propio perfil
  if (req.user.role !== 'admin' && req.user.client_id !== client.id) {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  res.json(client);
});

// Crear cliente  (admin)  -> tambien crea su usuario de acceso
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.cedula || !b.full_name) return res.status(400).json({ error: 'Cedula y nombre completo son obligatorios' });

  const exists = await db.prepare('SELECT id FROM users WHERE cedula = ?').get(String(b.cedula).trim());
  if (exists) return res.status(409).json({ error: 'Ya existe un usuario con esa cedula' });

  const id = await db.tx(async (tx) => {
    const u = await tx.prepare("INSERT INTO users (cedula, role) VALUES (?, 'cliente')").run(String(b.cedula).trim());
    const info = await tx.prepare(`
      INSERT INTO clients (user_id, cedula, full_name, phone, email, birth_date, occupation,
                           initial_weight, height, goal, join_date, photo)
      VALUES (@user_id, @cedula, @full_name, @phone, @email, @birth_date, @occupation,
              @initial_weight, @height, @goal, @join_date, @photo)
    `).run({
      user_id: u.lastInsertRowid,
      cedula: String(b.cedula).trim(),
      full_name: b.full_name,
      phone: b.phone || null,
      email: b.email || null,
      birth_date: b.birth_date || null,
      occupation: b.occupation || null,
      initial_weight: b.initial_weight || null,
      height: b.height || null,
      goal: b.goal || null,
      join_date: b.join_date || new Date().toISOString().slice(0, 10),
      photo: b.photo || null,
    });
    return info.lastInsertRowid;
  });

  res.status(201).json(await db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
});

// Editar cliente  (admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const client = await db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  await db.prepare(`
    UPDATE clients SET full_name=@full_name, phone=@phone, email=@email, birth_date=@birth_date,
      occupation=@occupation, initial_weight=@initial_weight, height=@height, goal=@goal,
      join_date=@join_date, photo=@photo
    WHERE id=@id
  `).run({
    id: client.id,
    full_name: b.full_name ?? client.full_name,
    phone: b.phone ?? client.phone,
    email: b.email ?? client.email,
    birth_date: b.birth_date ?? client.birth_date,
    occupation: b.occupation ?? client.occupation,
    initial_weight: b.initial_weight ?? client.initial_weight,
    height: b.height ?? client.height,
    goal: b.goal ?? client.goal,
    join_date: b.join_date ?? client.join_date,
    photo: b.photo ?? client.photo,
  });
  res.json(await db.prepare('SELECT * FROM clients WHERE id = ?').get(client.id));
});

// Eliminar cliente  (admin)  -> elimina tambien su usuario (cascade)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const client = await db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  await db.prepare('DELETE FROM users WHERE id = ?').run(client.user_id); // cascade borra el cliente
  res.json({ ok: true });
});

export default router;
