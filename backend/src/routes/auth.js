// ============================================================
//  Rutas de autenticacion
//   - login por cedula + contrasena
//   - primer ingreso del cliente (crear contrasena con la cedula)
//   - cambio de contrasena
// ============================================================
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { signToken, authRequired } from '../middleware/auth.js';

const router = Router();

// Construye el payload del token a partir del usuario
async function tokenPayloadFor(user) {
  const client = await db.prepare('SELECT id, full_name FROM clients WHERE user_id = ?').get(user.id);
  return {
    id: user.id,
    cedula: user.cedula,
    role: user.role,
    client_id: client ? client.id : null,
    name: client ? client.full_name : 'Administrador',
  };
}

// POST /api/auth/login  -> { cedula, password }
// Si el cliente nunca ha creado clave, responde needsPassword = true
router.post('/login', async (req, res) => {
  const { cedula, password } = req.body || {};
  if (!cedula) return res.status(400).json({ error: 'La cedula es obligatoria' });

  const user = await db.prepare('SELECT * FROM users WHERE cedula = ? AND active = 1').get(String(cedula).trim());
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado. Verifica tu cedula.' });

  // Primer ingreso: el cliente aun no tiene contrasena
  if (!user.password_hash) {
    return res.json({ needsPassword: true, cedula: user.cedula });
  }

  if (!password) return res.status(400).json({ error: 'Ingresa tu contrasena' });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Contrasena incorrecta' });
  }

  const payload = await tokenPayloadFor(user);
  res.json({ token: signToken(payload), user: { ...payload, must_change_password: !!user.must_change_password } });
});

// POST /api/auth/set-password -> { cedula, password }
// Primer ingreso: crea la contrasena para una cedula existente sin clave
router.post('/set-password', async (req, res) => {
  const { cedula, password } = req.body || {};
  if (!cedula || !password) return res.status(400).json({ error: 'Cedula y contrasena son obligatorias' });
  if (password.length < 4) return res.status(400).json({ error: 'La contrasena debe tener al menos 4 caracteres' });

  const user = await db.prepare('SELECT * FROM users WHERE cedula = ? AND active = 1').get(String(cedula).trim());
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (user.password_hash) return res.status(400).json({ error: 'Este usuario ya tiene una contrasena. Inicia sesion normalmente.' });

  const hash = bcrypt.hashSync(password, 10);
  await db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, user.id);

  const payload = await tokenPayloadFor(user);
  res.json({ token: signToken(payload), user: { ...payload, must_change_password: false } });
});

// POST /api/auth/change-password -> { currentPassword, newPassword }  (autenticado)
router.post('/change-password', authRequired, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'La nueva contrasena debe tener al menos 4 caracteres' });

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.password_hash && !bcrypt.compareSync(currentPassword || '', user.password_hash)) {
    return res.status(401).json({ error: 'La contrasena actual es incorrecta' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(hash, user.id);
  res.json({ ok: true });
});

// GET /api/auth/me  -> datos del usuario autenticado
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

export default router;
