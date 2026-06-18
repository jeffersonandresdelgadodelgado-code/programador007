// ============================================================
//  BOX MOTIVACION CROSSFIT  -  Servidor API (Node + Express)
// ============================================================
import 'dotenv/config';
import 'express-async-errors'; // hace que los errores async lleguen al manejador de errores
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import './db/database.js'; // inicializa la BD y el esquema

import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import paymentRoutes from './routes/payments.js';
import routineRoutes from './routes/routines.js';
import progressRoutes from './routes/progress.js';
import eventRoutes from './routes/events.js';
import productRoutes from './routes/products.js';
import attendanceRoutes from './routes/attendance.js';
import dashboardRoutes from './routes/dashboard.js';
import wodRoutes from './routes/wods.js';
import recordRoutes from './routes/records.js';
import classRoutes from './routes/classes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- Middlewares globales ---
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '5mb' }));
// Carpeta publica para servir fotos / imagenes subidas
app.use('/uploads', express.static(path.join(__dirname, '..', 'data', 'uploads')));

// --- Rutas de la API ---
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/products', productRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wods', wodRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/classes', classRoutes);

// Salud del servicio
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'box-motivacion' }));

// Manejador de errores centralizado
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n  Box Motivacion API escuchando en http://localhost:${PORT}\n`);
});
