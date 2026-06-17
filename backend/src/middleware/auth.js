// ============================================================
//  Middleware de autenticacion y autorizacion con JWT
// ============================================================
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'box_motivacion_crossfit_secret_cambia_esto';

// Genera un token firmado a partir del payload del usuario
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: process.env.JWT_EXPIRES || '8h' });
}

// Verifica que la peticion traiga un token valido en el header Authorization
export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
  try {
    req.user = jwt.verify(token, SECRET); // { id, cedula, role, client_id }
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

// Restringe el acceso a un rol especifico (p.ej. solo admin)
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'No tienes permisos para esta accion' });
    }
    next();
  };
}
