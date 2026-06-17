// ============================================================
//  Pantalla de inicio de sesion.
//  Flujo:
//   1. El usuario escribe su cedula y contrasena.
//   2. Si es cliente de primer ingreso (sin clave), se le pide
//      crear una contrasena nueva.
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/ui';

export default function Login() {
  const { login, setPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('login'); // 'login' | 'create'
  const [cedula, setCedula] = useState('');
  const [password, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(cedula, password);
      if (res.needsPassword) {
        setStep('create');       // primer ingreso: crear clave
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesion');
    } finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (password.length < 4) return setError('La contrasena debe tener al menos 4 caracteres');
    if (password !== confirm) return setError('Las contrasenas no coinciden');
    setLoading(true);
    try {
      await setPassword(cedula, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la contrasena');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-brand-900 text-white">
      {/* Panel de marca */}
      <div className="relative hidden lg:flex flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/40 to-brand-900" />
        <img src="/logo.png" alt="Box Motivacion CrossFit" className="relative w-72 drop-shadow-2xl" />
        <h1 className="relative mt-6 text-3xl font-extrabold tracking-tight">BOX MOTIVACION</h1>
        <p className="relative text-brand-200 font-semibold tracking-widest">C R O S S F I T</p>
        <p className="relative mt-4 max-w-sm text-center text-slate-300">
          Tu fuerza, tu progreso, tu comunidad. Administra todo desde un solo lugar.
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <img src="/logo.png" alt="logo" className="mx-auto w-28" />
            <h1 className="mt-2 text-2xl font-extrabold">BOX MOTIVACION</h1>
          </div>

          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-bold">Iniciar sesion</h2>
              <p className="text-sm text-slate-400">Ingresa con tu numero de cedula.</p>
              <div>
                <label className="label text-slate-300">Cedula</label>
                <input className="input" value={cedula} onChange={(e) => setCedula(e.target.value)}
                       placeholder="Número de cédula" autoFocus required />
              </div>
              <div>
                <label className="label text-slate-300">Contrasena</label>
                <PasswordInput value={password} onChange={(e) => setPwd(e.target.value)} placeholder="Tu contrasena" />
                <p className="mt-1 text-xs text-slate-500">Si es tu primera vez, deja la contrasena vacia y continua.</p>
              </div>
              {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
            </form>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <h2 className="text-2xl font-bold">Crea tu contrasena</h2>
              <p className="text-sm text-slate-400">Primer ingreso para la cedula <b>{cedula}</b>.</p>
              <div>
                <label className="label text-slate-300">Nueva contrasena</label>
                <PasswordInput value={password} onChange={(e) => setPwd(e.target.value)} autoFocus required />
              </div>
              <div>
                <label className="label text-slate-300">Confirmar contrasena</label>
                <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Guardando...' : 'Crear y entrar'}</button>
              <button type="button" className="btn-ghost w-full" onClick={() => { setStep('login'); setError(''); }}>Volver</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
