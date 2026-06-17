// ============================================================
//  Rutas del DASHBOARD (estadisticas y reportes para el admin)
// ============================================================
import { Router } from 'express';
import db from '../db/database.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

// GET /api/dashboard  -> resumen general
router.get('/', async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7); // yyyy-mm

  // Clientes activos: con una mensualidad vigente
  const activos = (await db.prepare(`
    SELECT COUNT(*) AS n FROM (
      SELECT client_id, MAX(due_date) AS due FROM payments GROUP BY client_id
    ) WHERE due >= ?
  `).get(today)).n;

  const totalClientes = (await db.prepare('SELECT COUNT(*) AS n FROM clients').get()).n;
  const vencidos = totalClientes - activos;

  // Ingresos del mes (pagos + ventas)
  const ingresosPagos = (await db.prepare(`SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE substr(payment_date,1,7) = ?`).get(month)).t;
  const ingresosVentas = (await db.prepare(`SELECT COALESCE(SUM(total),0) AS t FROM sales WHERE substr(sale_date,1,7) = ?`).get(month)).t;

  // Asistencia de hoy
  const asistenciaHoy = (await db.prepare('SELECT COUNT(*) AS n FROM attendance WHERE date = ?').get(today)).n;

  // Proximos eventos
  const proximosEventos = await db.prepare('SELECT * FROM events WHERE event_date >= ? ORDER BY event_date ASC LIMIT 5').all(today);

  // Productos mas vendidos
  const masVendidos = await db.prepare(`
    SELECT p.name, SUM(s.quantity) AS unidades, SUM(s.total) AS ingresos
    FROM sales s JOIN products p ON p.id = s.product_id
    GROUP BY p.id ORDER BY unidades DESC LIMIT 5
  `).all();

  // Ingresos por mes (ultimos 6 meses) para grafica
  const ingresosPorMes = (await db.prepare(`
    SELECT substr(payment_date,1,7) AS mes, SUM(amount) AS total
    FROM payments GROUP BY mes ORDER BY mes DESC LIMIT 6
  `).all()).reverse();

  res.json({
    clientesActivos: activos,
    clientesVencidos: vencidos < 0 ? 0 : vencidos,
    totalClientes,
    ingresosMes: ingresosPagos + ingresosVentas,
    ingresosPagos,
    ingresosVentas,
    asistenciaHoy,
    proximosEventos,
    masVendidos,
    ingresosPorMes,
  });
});

export default router;
