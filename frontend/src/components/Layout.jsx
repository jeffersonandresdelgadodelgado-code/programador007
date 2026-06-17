// ============================================================
//  Estructura general: menu lateral + barra superior.
//  El menu cambia segun el rol (admin / cliente).
// ============================================================
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IconDashboard, IconUsers, IconMoney, IconDumbbell, IconChart, IconCalendar,
  IconBox, IconCheck, IconSun, IconMoon, IconLogout, IconMenu, IconX, IconUser,
} from './Icons';

// Definicion de los enlaces por rol
const adminLinks = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: IconUsers },
  { to: '/pagos', label: 'Pagos', icon: IconMoney },
  { to: '/rutinas', label: 'Rutinas', icon: IconDumbbell },
  { to: '/eventos', label: 'Eventos', icon: IconCalendar },
  { to: '/productos', label: 'Productos', icon: IconBox },
  { to: '/asistencia', label: 'Asistencia', icon: IconCheck },
];
const clientLinks = [
  { to: '/', label: 'Mi inicio', icon: IconDashboard, end: true },
  { to: '/perfil', label: 'Mi perfil', icon: IconUser },
  { to: '/mis-pagos', label: 'Mensualidad', icon: IconMoney },
  { to: '/mis-rutinas', label: 'Mis rutinas', icon: IconDumbbell },
  { to: '/mi-progreso', label: 'Mi progreso', icon: IconChart },
  { to: '/eventos', label: 'Eventos', icon: IconCalendar },
  { to: '/tienda', label: 'Tienda', icon: IconBox },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = isAdmin ? adminLinks : clientLinks;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/logo.png" alt="Box Motivacion" className="h-11 w-11 rounded-xl object-contain bg-white/10 p-0.5" />
        <div className="leading-tight">
          <p className="font-extrabold tracking-tight">BOX MOTIVACION</p>
          <p className="text-xs text-brand-200">CrossFit</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand text-white shadow'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <l.icon className="w-5 h-5 shrink-0" />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 pb-5">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10">
          <IconLogout className="w-5 h-5" /> Cerrar sesion
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Menu lateral fijo (escritorio) */}
      <aside className="hidden lg:flex w-64 flex-col bg-brand-900 text-white shrink-0">
        <SidebarContent />
      </aside>

      {/* Menu lateral deslizable (movil) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-brand-900 text-white">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-brand-900/80 px-4 py-3 backdrop-blur">
          <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setOpen(true)}>
            <IconMenu />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button onClick={toggle} title="Cambiar tema" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <IconSun /> : <IconMoon />}
            </button>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-brand text-white text-xs font-bold">
                {(user?.name || 'U').slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm font-medium max-w-[140px] truncate">{user?.name}</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
