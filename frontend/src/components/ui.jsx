// ============================================================
//  Pequenos componentes de interfaz reutilizables
// ============================================================
import { useState } from 'react';
import { IconX, IconEye, IconEyeOff } from './Icons';

// Campo de contrasena con boton para mostrar/ocultar el texto.
// light=true -> fondo blanco con letra oscura y en negrita (para el login oscuro).
export function PasswordInput({ value, onChange, placeholder, autoFocus, required, light }) {
  const [show, setShow] = useState(false);
  const extra = light ? ' !bg-white !text-slate-900 font-semibold placeholder:text-slate-400' : '';
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={`input pr-11${extra}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        title={show ? 'Ocultar' : 'Mostrar'}
        className={`absolute right-3 top-1/2 -translate-y-1/2 hover:text-brand ${light ? 'text-slate-500' : 'text-slate-400'}`}
      >
        {show ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
      </button>
    </div>
  );
}

// Ventana modal centrada
export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative card w-full ${width} max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-2xl`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700">
            <IconX />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Indicador de carga
export function Spinner({ label = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      {label}
    </div>
  );
}

// Mensaje cuando no hay datos
export function Empty({ children = 'Sin registros todavia.' }) {
  return <div className="py-10 text-center text-sm text-slate-500">{children}</div>;
}

// Formatea numeros como moneda (COP)
export const money = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

// Formatea fecha ISO a dd/mm/aaaa
export const fdate = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('es-CO') : '-');
