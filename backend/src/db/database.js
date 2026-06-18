// ============================================================
//  Conexion a la base de datos usando @libsql/client (Turso).
//
//  - En LOCAL: si no hay variables de Turso, usa un archivo
//    SQLite local (data/box.db) -> mismo comportamiento de antes.
//  - En PRODUCCION (Turso): define TURSO_DATABASE_URL y
//    TURSO_AUTH_TOKEN en el .env y los datos viven en la nube.
//
//  Capa de compatibilidad: expone db.prepare(sql).get/all/run
//  (asincronos) y db.tx(fn) para transacciones, de modo que las
//  rutas conserven un estilo parecido al de better-sqlite3.
// ============================================================
import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carpeta local para el archivo SQLite (solo si no se usa Turso)
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// URL de conexion: Turso (remoto) o archivo local como respaldo
const url = process.env.TURSO_DATABASE_URL || `file:${path.join(dataDir, 'box.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN; // solo necesario en Turso

export const client = createClient({ url, authToken });

// --- Inicializa el esquema (idempotente: usa IF NOT EXISTS) ---
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
await client.executeMultiple(schema);

// --- Migraciones suaves para tablas que ya existian ---
// Agrega columnas nuevas si faltan (ignora el error si ya estan).
const migrations = [
  'ALTER TABLE events ADD COLUMN image TEXT',
  'ALTER TABLE measurements ADD COLUMN photo TEXT',
];
for (const sql of migrations) {
  try { await client.execute(sql); } catch { /* la columna ya existe */ }
}

// ------------------------------------------------------------
//  Helpers internos
// ------------------------------------------------------------
// libsql acepta argumentos posicionales (?) como array, o con
// nombre (@name) como objeto. Detectamos cual se uso.
function toArgs(args) {
  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    return args[0]; // parametros con nombre: { user_id: 1, ... }
  }
  return args; // parametros posicionales: [a, b, c]
}

// Convierte las filas de libsql en objetos planos { columna: valor }
// (asi se serializan bien con res.json y se pueden desestructurar).
function toPlain(result) {
  return result.rows.map((row) => {
    const obj = {};
    for (const col of result.columns) obj[col] = row[col];
    return obj;
  });
}

// Crea un "statement" preparado con metodos asincronos sobre un
// ejecutor dado (el cliente o una transaccion).
function makePrepare(executor) {
  return (sql) => ({
    async all(...args) {
      const res = await executor.execute({ sql, args: toArgs(args) });
      return toPlain(res);
    },
    async get(...args) {
      const res = await executor.execute({ sql, args: toArgs(args) });
      return toPlain(res)[0]; // primera fila o undefined
    },
    async run(...args) {
      const res = await executor.execute({ sql, args: toArgs(args) });
      return {
        lastInsertRowid: res.lastInsertRowid != null ? Number(res.lastInsertRowid) : undefined,
        changes: res.rowsAffected,
      };
    },
  });
}

// ------------------------------------------------------------
//  API publica (similar a better-sqlite3 pero asincrona)
// ------------------------------------------------------------
const db = {
  // db.prepare(sql).get(...) / .all(...) / .run(...)
  prepare: makePrepare(client),

  // db.tx(async (t) => { await t.prepare(...).run(...); ... })
  // Ejecuta varias operaciones de forma atomica.
  async tx(fn) {
    const t = await client.transaction('write');
    try {
      const tdb = { prepare: makePrepare(t) };
      const result = await fn(tdb);
      await t.commit();
      return result;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};

export default db;
