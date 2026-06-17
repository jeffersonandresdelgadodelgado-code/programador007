# 🦍 BOX MOTIVACIÓN CROSSFIT — Sistema de gestión (PWA)

Aplicación **web progresiva (PWA)** e instalable en móvil para la administración completa de un
gimnasio / box de CrossFit. Funciona **localmente** con base de datos SQLite y está preparada para
migrar a un servidor en línea (PostgreSQL / MySQL).

- **Frontend:** React + Vite + Tailwind CSS + PWA (instalable, modo oscuro, responsive).
- **Backend:** Node.js + Express + JWT.
- **Base de datos:** SQLite (archivo local `backend/data/box.db`).

---

## 📂 Estructura del proyecto

```
BOX-MOTIVATION/
├── logo.png                 # Logo del gimnasio
├── README.md                # Este manual
├── backend/                 # API REST (Node + Express + SQLite)
│   ├── .env.example         # Variables de entorno de ejemplo
│   ├── package.json
│   └── src/
│       ├── server.js        # Arranque del servidor
│       ├── db/
│       │   ├── schema.sql    # 🗄️ Script completo de la base de datos
│       │   ├── database.js   # Conexión SQLite
│       │   └── seed.js       # Datos iniciales (admin + ejemplos)
│       ├── middleware/auth.js
│       └── routes/           # Un archivo por módulo
└── frontend/                # PWA (React + Vite + Tailwind)
    ├── vite.config.js        # Config Vite + PWA + proxy al backend
    ├── public/               # logo e iconos PWA
    └── src/
        ├── api/              # Cliente HTTP (axios)
        ├── context/          # Autenticación y tema (claro/oscuro)
        ├── components/       # Layout, iconos y UI reutilizable
        └── pages/            # Pantallas (admin) y pages/client (cliente)
```

---

## 🛠️ Requisitos previos

- **Node.js 18 o superior** (recomendado 20+). Descárgalo en <https://nodejs.org>.
- Verifica la instalación:
  ```bash
  node -v
  npm -v
  ```

---

## 🚀 Instalación paso a paso

### 1) Backend (API + base de datos)

```bash
cd backend
npm install            # instala dependencias
copy .env.example .env  # Windows  (en Mac/Linux: cp .env.example .env)
npm run seed           # crea la base de datos con datos de ejemplo
npm start              # inicia la API en http://localhost:4000
```

> 💡 `npm run seed` crea el usuario administrador y 3 clientes de ejemplo.
> Vuelve a ejecutarlo si quieres **reiniciar** la base de datos (borra y recarga).

### 2) Frontend (PWA)

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev            # inicia la app en http://localhost:5173
```

Abre el navegador en **<http://localhost:5173>**.

---

## 🔑 Usuarios de prueba

| Rol           | Cédula  | Contraseña                         |
|---------------|---------|------------------------------------|
| Administrador | `admin` | `admin123`                         |
| Cliente       | `1001`  | *(primer ingreso: la crea él)*     |
| Cliente       | `1002`  | *(primer ingreso: la crea él)*     |
| Cliente       | `1003`  | *(primer ingreso: la crea él)*     |

**Primer ingreso del cliente:** escribe solo la **cédula**, deja la contraseña vacía y pulsa
*Ingresar*; el sistema le pedirá **crear su contraseña**.

---

## 📱 Instalar como app en el celular (PWA)

1. Publica el frontend o ponlo en la **misma red Wi-Fi** que el teléfono.
   - Para desarrollo: `npm run dev -- --host` y entra desde el móvil a `http://IP-DEL-PC:5173`.
   - Para producción: `npm run build` genera la carpeta `frontend/dist` lista para subir a un hosting.
2. En **Android (Chrome)**: menú ⋮ → **“Agregar a pantalla de inicio” / “Instalar aplicación”**.
3. El icono del gorila quedará como una app más, funciona a pantalla completa y con caché offline.

> La PWA requiere **HTTPS** (o `localhost`) para instalarse en producción.

---

## 👥 Roles y funcionalidades

### Administrador
- **Dashboard:** clientes activos, mensualidades vencidas, ingresos del mes, asistencia, próximos eventos y productos más vendidos.
- **Clientes:** crear, editar, eliminar y buscar. Cada cliente recibe automáticamente su usuario de acceso.
- **Pagos:** registrar pagos, ver historial y **alertas de vencimiento**.
- **Rutinas:** crear rutinas con ejercicios (series, repeticiones, descanso, media) y **asignarlas** a clientes.
- **Eventos:** crear competencias y entrenamientos especiales con cupos.
- **Productos:** inventario de camisetas, accesorios y suplementos; **registro de ventas** con descuento de stock.
- **Asistencia:** registro diario por cédula o cliente.

### Cliente
- Primer ingreso con cédula y **creación de contraseña**.
- Ver perfil y **cambiar contraseña**.
- Estado de mensualidad, fecha de vencimiento e historial de pagos.
- Consultar **rutinas asignadas** con detalle de cada ejercicio.
- Registrar **peso y medidas** y ver **gráficas de progreso**.
- Ver e **inscribirse a eventos**.
- Consultar la **tienda** de productos.
- **Registrar su propia asistencia** desde el inicio.

---

## 🗄️ Base de datos

El esquema completo está en [`backend/src/db/schema.sql`](backend/src/db/schema.sql) e incluye las
tablas: `users`, `clients`, `payments`, `routines`, `exercises`, `routine_assignments`,
`measurements`, `events`, `event_registrations`, `products`, `sales` y `attendance`.

- Se crea automáticamente la primera vez que arranca el backend.
- **En local** vive en `backend/data/box.db` (motor libSQL, compatible con SQLite). **Haz copias de seguridad** de ese archivo.
- **En la nube** usa **Turso** (base SQLite gestionada). El mismo código funciona en ambos sitios; solo cambian las variables de entorno.

---

## ☁️ Subir gratis a internet (Turso + Render + Vercel)

La app ya está lista para desplegarse con datos **persistentes y gratis**.

### 1) Base de datos en Turso (gratis y persistente)

```bash
# Instala el CLI (una sola vez)  -> https://docs.turso.tech
turso auth signup           # crea tu cuenta
turso db create box-motivacion
turso db show box-motivacion --url        # -> copia la URL (libsql://...)
turso db tokens create box-motivacion     # -> copia el token
```

### 2) Backend en Render (gratis)

1. Sube el proyecto a GitHub.
2. En <https://render.com> crea un **Web Service** apuntando a la carpeta `backend`.
   - Build: `npm install` · Start: `npm start`
3. En **Environment** define las variables:
   - `TURSO_DATABASE_URL` = la URL de Turso
   - `TURSO_AUTH_TOKEN` = el token de Turso
   - `JWT_SECRET` = una clave larga y secreta
   - `CORS_ORIGIN` = la URL de tu frontend (ej. `https://box-motivacion.vercel.app`)
4. La primera vez, carga los datos iniciales:
   `turso db shell box-motivacion < backend/src/db/schema.sql` y luego el admin, **o**
   ejecuta `npm run seed` localmente con las variables de Turso en tu `.env`.

### 3) Frontend (PWA) en Vercel o Netlify (gratis)

1. Importa el repo y selecciona la carpeta `frontend`.
   - Build: `npm run build` · Output: `dist`
2. Define la variable de entorno:
   - `VITE_API_URL` = `https://TU-BACKEND.onrender.com/api`
3. Despliega. Te dará una URL con **HTTPS** lista para **instalar la PWA** en el celular.

> 💡 ¿Prefieres PostgreSQL/MySQL? El esquema usa SQL estándar; basta con cambiar
> `backend/src/db/database.js` por un cliente `pg`/`mysql2` y ajustar pocas consultas.

---

## 🧰 Comandos útiles

| Acción                          | Carpeta    | Comando            |
|---------------------------------|------------|--------------------|
| Instalar dependencias           | backend / frontend | `npm install` |
| Reiniciar base de datos         | backend    | `npm run seed`     |
| Iniciar API                     | backend    | `npm start`        |
| Iniciar API (recarga en cambios)| backend    | `npm run dev`      |
| Iniciar PWA (desarrollo)        | frontend   | `npm run dev`      |
| Compilar PWA (producción)       | frontend   | `npm run build`    |

---

## 🔐 Seguridad

- Contraseñas cifradas con **bcrypt**.
- Sesiones con **JWT** (cambia `JWT_SECRET` en `.env` para producción).
- Autorización por rol (admin / cliente) en cada endpoint.

---

¡Listo! Tu sistema **Box Motivación CrossFit** está funcionando. 💪🦍
