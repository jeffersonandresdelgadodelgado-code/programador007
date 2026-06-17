// ============================================================
//  Datos iniciales (seed)
//  - Crea el usuario ADMINISTRADOR
//  - Crea clientes, pagos, rutinas, productos y eventos de ejemplo
//  Ejecutar con:  npm run seed
// ============================================================
import 'dotenv/config'; // carga las variables del .env (incluida la conexion a Turso)
import bcrypt from 'bcryptjs';
import db from './database.js';

console.log('Sembrando datos iniciales...');

await db.tx(async (tx) => {
  // Limpia tablas (orden por dependencias)
  for (const t of ['event_registrations','events','routine_assignments','exercises','routines',
                    'measurements','attendance','sales','products','payments','clients','users']) {
    await tx.prepare(`DELETE FROM ${t}`).run();
  }

  const iso = (d) => d.toISOString().slice(0, 10);
  const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  const today = new Date();

  // ---- ADMINISTRADOR ----
  const adminHash = bcrypt.hashSync('admin123', 10);
  await tx.prepare(`INSERT INTO users (cedula, password_hash, role, must_change_password)
              VALUES ('admin', ?, 'admin', 0)`).run(adminHash);

  // ---- CLIENTES de ejemplo ----
  const clientes = [
    { cedula: '1001', full_name: 'Carlos Ramirez', phone: '3001112233', email: 'carlos@example.com', birth_date: '1995-04-12', occupation: 'Ingeniero', initial_weight: 82, height: 178, goal: 'Ganar masa muscular' },
    { cedula: '1002', full_name: 'Laura Gomez',    phone: '3002223344', email: 'laura@example.com',  birth_date: '1998-09-30', occupation: 'Disenadora', initial_weight: 64, height: 165, goal: 'Bajar de peso' },
    { cedula: '1003', full_name: 'Andres Torres',  phone: '3003334455', email: 'andres@example.com', birth_date: '1990-01-22', occupation: 'Comerciante', initial_weight: 90, height: 182, goal: 'Resistencia' },
  ];

  const clientIds = [];
  for (const c of clientes) {
    const u = await tx.prepare("INSERT INTO users (cedula, role) VALUES (?, 'cliente')").run(c.cedula);
    const info = await tx.prepare(`INSERT INTO clients (user_id, cedula, full_name, phone, email, birth_date, occupation, initial_weight, height, goal, join_date)
                                   VALUES (@user_id, @cedula, @full_name, @phone, @email, @birth_date, @occupation, @initial_weight, @height, @goal, @join_date)`)
      .run({ ...c, user_id: u.lastInsertRowid, join_date: iso(today) });
    clientIds.push(info.lastInsertRowid);
  }

  // ---- PAGOS ----  (uno vigente, uno vencido)
  await tx.prepare(`INSERT INTO payments (client_id, amount, concept, payment_date, due_date) VALUES (?, ?, 'Mensualidad', ?, ?)`)
    .run(clientIds[0], 80000, iso(today), iso(addMonths(today, 1)));      // vigente
  await tx.prepare(`INSERT INTO payments (client_id, amount, concept, payment_date, due_date) VALUES (?, ?, 'Mensualidad', ?, ?)`)
    .run(clientIds[1], 80000, iso(addMonths(today, -2)), iso(addMonths(today, -1))); // vencido
  await tx.prepare(`INSERT INTO payments (client_id, amount, concept, payment_date, due_date) VALUES (?, ?, 'Mensualidad', ?, ?)`)
    .run(clientIds[2], 80000, iso(today), iso(addMonths(today, 1)));      // vigente

  // ---- MEDIDAS (seguimiento) para graficas ----
  for (let i = 3; i >= 0; i--) {
    await tx.prepare(`INSERT INTO measurements (client_id, date, weight, body_fat, muscle_mass, waist) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(clientIds[0], iso(addMonths(today, -i)), 82 - i, 20 - i * 0.5, 35 + i * 0.4, 90 - i);
  }

  // ---- RUTINA con ejercicios ----
  const r = await tx.prepare("INSERT INTO routines (name, description, level) VALUES ('WOD Fuerza Total', 'Rutina full body de fuerza', 'Intermedio')").run();
  const ejercicios = [
    ['Sentadilla con barra', 'Espalda recta, baja controlado', 5, '5', 90, 0],
    ['Press banca', 'Codos a 45 grados', 4, '8', 90, 1],
    ['Peso muerto', 'Activa el core', 4, '6', 120, 2],
    ['Burpees', 'A ritmo constante', 3, '15', 60, 3],
  ];
  for (const e of ejercicios) {
    await tx.prepare(`INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, position) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(r.lastInsertRowid, ...e);
  }
  await tx.prepare('INSERT INTO routine_assignments (routine_id, client_id) VALUES (?, ?)').run(r.lastInsertRowid, clientIds[0]);

  // ---- PRODUCTOS ----
  const productos = [
    ['Camiseta Box Motivacion', 'Camiseta', 'Algodon deportivo, logo del gorila', 45000, 30],
    ['Shaker 600ml', 'Accesorio', 'Vaso mezclador', 25000, 50],
    ['Proteina Whey 2lb', 'Suplemento', 'Sabor chocolate', 180000, 15],
    ['Guantes de levantamiento', 'Accesorio', 'Talla M/L', 35000, 20],
  ];
  for (const p of productos) {
    await tx.prepare(`INSERT INTO products (name, category, description, price, stock) VALUES (?, ?, ?, ?, ?)`).run(...p);
  }

  // ---- EVENTOS ----
  await tx.prepare(`INSERT INTO events (title, description, type, event_date, event_time, location, capacity)
              VALUES ('Competencia Open Box', 'Reta tus marcas personales', 'Competencia', ?, '08:00', 'Sede principal', 40)`)
    .run(iso(addMonths(today, 1)));
  await tx.prepare(`INSERT INTO events (title, description, type, event_date, event_time, location, capacity)
              VALUES ('Entrenamiento de movilidad', 'Clase especial de movilidad', 'Entrenamiento especial', ?, '18:00', 'Sala 2', 20)`)
    .run(iso(today));

  // ---- ASISTENCIA de hoy ----
  await tx.prepare('INSERT INTO attendance (client_id, date) VALUES (?, ?)').run(clientIds[0], iso(today));
});

console.log('\n  Datos iniciales creados.');
console.log('  --------------------------------------');
console.log('  ADMIN ->  cedula: admin   clave: admin123');
console.log('  CLIENTES (primer ingreso, crean su clave):');
console.log('     1001  Carlos Ramirez');
console.log('     1002  Laura Gomez');
console.log('     1003  Andres Torres');
console.log('  --------------------------------------\n');
process.exit(0);
