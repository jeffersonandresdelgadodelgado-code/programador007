-- ============================================================
--  BOX MOTIVACION CROSSFIT  -  Esquema de base de datos (SQLite)
--  Disenado para migrar facilmente a PostgreSQL / MySQL:
--   - Tipos estandar (TEXT, INTEGER, REAL)
--   - Claves foraneas explicitas
--   - Fechas en formato ISO (TEXT) o timestamps
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
--  USUARIOS  (admin y cliente comparten tabla de credenciales)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cedula        TEXT    NOT NULL UNIQUE,         -- documento de identidad (login)
  password_hash TEXT,                            -- NULL hasta que el cliente crea su clave
  role          TEXT    NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin','cliente')),
  must_change_password INTEGER NOT NULL DEFAULT 1,-- 1 = primer ingreso pendiente
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
--  CLIENTES  (datos del perfil, ligado 1:1 con users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL UNIQUE,
  cedula        TEXT    NOT NULL UNIQUE,
  full_name     TEXT    NOT NULL,
  phone         TEXT,
  email         TEXT,
  birth_date    TEXT,                            -- ISO yyyy-mm-dd
  occupation    TEXT,                            -- profesion u ocupacion
  initial_weight REAL,                           -- peso inicial (kg)
  height        REAL,                            -- estatura (cm)
  goal          TEXT,                            -- objetivo deportivo
  join_date     TEXT    NOT NULL DEFAULT (date('now')),  -- fecha de ingreso
  photo         TEXT,                            -- ruta/URL de la fotografia
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  PAGOS / MENSUALIDADES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL,
  amount        REAL    NOT NULL,
  concept       TEXT    NOT NULL DEFAULT 'Mensualidad',
  payment_date  TEXT    NOT NULL DEFAULT (date('now')),  -- fecha de pago
  due_date      TEXT    NOT NULL,                         -- fecha de vencimiento
  method        TEXT    DEFAULT 'Efectivo',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  RUTINAS  +  EJERCICIOS  +  ASIGNACION
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routines (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  description   TEXT,
  level         TEXT    DEFAULT 'Intermedio',  -- Principiante / Intermedio / Avanzado
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercises (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_id    INTEGER NOT NULL,
  name          TEXT    NOT NULL,
  description   TEXT,
  sets          INTEGER DEFAULT 3,    -- series
  reps          TEXT    DEFAULT '12', -- repeticiones (texto: "12" o "Al fallo")
  rest_seconds  INTEGER DEFAULT 60,   -- tiempo de descanso
  media_url     TEXT,                 -- imagen o video explicativo
  position      INTEGER DEFAULT 0,
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);

-- Asignacion de rutinas a clientes (N:M)
CREATE TABLE IF NOT EXISTS routine_assignments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  routine_id    INTEGER NOT NULL,
  client_id     INTEGER NOT NULL,
  assigned_at   TEXT    NOT NULL DEFAULT (date('now')),
  UNIQUE (routine_id, client_id),
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id)  REFERENCES clients(id)  ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  SEGUIMIENTO FISICO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS measurements (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL,
  date          TEXT    NOT NULL DEFAULT (date('now')),
  weight        REAL,                 -- peso (kg)
  body_fat      REAL,                 -- % grasa corporal
  muscle_mass   REAL,                 -- masa muscular (kg)
  chest         REAL,                 -- pecho (cm)
  waist         REAL,                 -- cintura (cm)
  hip           REAL,                 -- cadera (cm)
  arm           REAL,                 -- brazo (cm)
  leg           REAL,                 -- pierna (cm)
  notes         TEXT,
  photo         TEXT,                 -- foto de progreso (data URL base64, opcional)
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  EVENTOS  +  INSCRIPCIONES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  description   TEXT,
  type          TEXT    DEFAULT 'Competencia', -- Competencia / Entrenamiento especial
  event_date    TEXT    NOT NULL,              -- fecha
  event_time    TEXT,                          -- hora
  location      TEXT,
  capacity      INTEGER DEFAULT 0,             -- 0 = sin limite
  image         TEXT,                          -- imagen del evento (data URL base64, opcional)
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      INTEGER NOT NULL,
  client_id     INTEGER NOT NULL,
  registered_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, client_id),
  FOREIGN KEY (event_id)  REFERENCES events(id)  ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  PRODUCTOS  +  VENTAS  (inventario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  category      TEXT    DEFAULT 'Accesorio',  -- Camiseta / Accesorio / Suplemento
  description   TEXT,
  price         REAL    NOT NULL DEFAULT 0,
  stock         INTEGER NOT NULL DEFAULT 0,   -- control de inventario
  image         TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER NOT NULL,
  client_id     INTEGER,                       -- opcional (venta a cliente registrado)
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    REAL    NOT NULL,
  total         REAL    NOT NULL,
  sale_date     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (client_id)  REFERENCES clients(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
--  ASISTENCIA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id     INTEGER NOT NULL,
  date          TEXT    NOT NULL DEFAULT (date('now')),
  check_in      TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (client_id, date),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  Indices utiles para reportes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payments_client    ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due        ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_measure_client      ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_sales_date          ON sales(sale_date);
