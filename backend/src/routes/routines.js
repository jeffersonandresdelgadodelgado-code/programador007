// ============================================================
//  Rutas de RUTINAS, EJERCICIOS y ASIGNACIONES
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Adjunta los ejercicios a una rutina
async function withExercises(routine) {
  if (!routine) return routine;
  routine.exercises = await db.prepare('SELECT * FROM exercises WHERE routine_id = ? ORDER BY position, id').all(routine.id);
  return routine;
}

// GET /api/routines  -> todas las rutinas (admin)
router.get('/', requireRole('admin'), async (_req, res) => {
  const rows = await db.prepare('SELECT * FROM routines ORDER BY created_at DESC').all();
  res.json(await Promise.all(rows.map(withExercises)));
});

// GET /api/routines/me  -> rutinas asignadas al cliente autenticado
router.get('/me', async (req, res) => {
  const clientId = req.user.client_id;
  if (!clientId) return res.status(400).json({ error: 'Este usuario no es un cliente' });
  const rows = await db.prepare(`
    SELECT r.* FROM routines r
    JOIN routine_assignments a ON a.routine_id = r.id
    WHERE a.client_id = ? ORDER BY a.assigned_at DESC
  `).all(clientId);
  res.json(await Promise.all(rows.map(withExercises)));
});

// GET /api/routines/:id  -> detalle con ejercicios y clientes asignados
router.get('/:id', requireRole('admin'), async (req, res) => {
  const routine = await withExercises(await db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id));
  if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });
  routine.assigned = await db.prepare(`
    SELECT c.id, c.full_name FROM clients c
    JOIN routine_assignments a ON a.client_id = c.id WHERE a.routine_id = ?
  `).all(routine.id);
  res.json(routine);
});

// POST /api/routines  -> crear rutina con sus ejercicios (admin)
router.post('/', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'El nombre de la rutina es obligatorio' });

  const id = await db.tx(async (tx) => {
    const info = await tx.prepare('INSERT INTO routines (name, description, level) VALUES (?, ?, ?)')
      .run(b.name, b.description || null, b.level || 'Intermedio');
    const rid = info.lastInsertRowid;
    for (const [i, e] of (b.exercises || []).entries()) {
      await tx.prepare(`INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, media_url, position)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(rid, e.name, e.description || null, e.sets || 3, e.reps || '12', e.rest_seconds || 60, e.media_url || null, i);
    }
    return rid;
  });
  res.status(201).json(await withExercises(await db.prepare('SELECT * FROM routines WHERE id = ?').get(id)));
});

// PUT /api/routines/:id  -> reemplaza datos y ejercicios (admin)
router.put('/:id', requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const routine = await db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });

  await db.tx(async (tx) => {
    await tx.prepare('UPDATE routines SET name=?, description=?, level=? WHERE id=?')
      .run(b.name ?? routine.name, b.description ?? routine.description, b.level ?? routine.level, routine.id);
    if (Array.isArray(b.exercises)) {
      await tx.prepare('DELETE FROM exercises WHERE routine_id = ?').run(routine.id);
      for (const [i, e] of b.exercises.entries()) {
        await tx.prepare(`INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, media_url, position)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(routine.id, e.name, e.description || null, e.sets || 3, e.reps || '12', e.rest_seconds || 60, e.media_url || null, i);
      }
    }
  });
  res.json(await withExercises(await db.prepare('SELECT * FROM routines WHERE id = ?').get(routine.id)));
});

// DELETE /api/routines/:id (admin)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  await db.prepare('DELETE FROM routines WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/routines/:id/assign  -> { client_id }  asigna rutina a cliente (admin)
router.post('/:id/assign', requireRole('admin'), async (req, res) => {
  const { client_id } = req.body || {};
  if (!client_id) return res.status(400).json({ error: 'client_id es obligatorio' });
  await db.prepare('INSERT OR IGNORE INTO routine_assignments (routine_id, client_id) VALUES (?, ?)')
    .run(req.params.id, client_id);
  res.json({ ok: true });
});

// DELETE /api/routines/:id/assign/:clientId  -> quita asignacion (admin)
router.delete('/:id/assign/:clientId', requireRole('admin'), async (req, res) => {
  await db.prepare('DELETE FROM routine_assignments WHERE routine_id = ? AND client_id = ?')
    .run(req.params.id, req.params.clientId);
  res.json({ ok: true });
});

export default router;
