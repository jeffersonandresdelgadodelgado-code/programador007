// ============================================================
//  Pequenos componentes de interfaz reutilizables
// ============================================================
import { useState } from 'react';
import { IconX, IconEye, IconEyeOff, IconTrash } from './Icons';

// Reduce y comprime una imagen en el navegador antes de subirla,
// para que pese poco (max ~1000px, JPEG calidad 0.7). Devuelve un data URL base64.
export function resizeImage(file, maxSize = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Control reutilizable para subir una imagen (con vista previa y boton para quitarla).
// value = data URL (o ''); onChange recibe el nuevo data URL o '' al quitar.
export function ImageUpload({ value, onChange, hint = 'Se reduce automaticamente para que pese poco.', round = false }) {
  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { onChange(await resizeImage(file)); } catch { alert('No se pudo procesar la imagen'); }
  }
  return (
    <div>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Vista previa"
               className={round ? 'h-24 w-24 rounded-full object-cover' : 'max-h-48 w-full rounded-xl object-cover'} />
          <button type="button" onClick={() => onChange('')} title="Quitar imagen"
                  className="absolute right-2 top-2 rounded-lg bg-black/60 p-2 text-white hover:bg-red-600">
            <IconTrash className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <input type="file" accept="image/*" onChange={pick}
               className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-500" />
      )}
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

// Imagen que al tocarla se abre grande (pantalla completa, imagen completa sin recortar).
export function ZoomImage({ src, alt = '', className = '' }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <img src={src} alt={alt} onClick={() => setOpen(true)}
           className={`${className} cursor-zoom-in`} />
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
             onClick={() => setOpen(false)}>
          <img src={src} alt={alt} className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain" />
          <button onClick={() => setOpen(false)} title="Cerrar"
                  className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/30">
            <IconX />
          </button>
        </div>
      )}
    </>
  );
}

// Construye un enlace de WhatsApp (wa.me) con mensaje. Asume Colombia (57) para celulares de 10 digitos.
export function whatsappLink(phone, text) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 && digits.startsWith('3')) digits = '57' + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

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
