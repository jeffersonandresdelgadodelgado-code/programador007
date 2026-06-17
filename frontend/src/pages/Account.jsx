// ============================================================
//  Mi cuenta (administrador): cambiar la contrasena de acceso.
//  Usa el endpoint /auth/change-password (sirve para cualquier rol).
// ============================================================
import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PasswordInput } from '../components/ui';
import { IconUser } from '../components/Icons';

export default function Account() {
  const { user } = useAuth();
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  async function changePwd(e) {
    e.preventDefault();
    setMsg(null);
    if (pwd.newPassword.length < 4) return setMsg({ ok: false, text: 'La nueva contrasena debe tener al menos 4 caracteres' });
    if (pwd.newPassword !== pwd.confirm) return setMsg({ ok: false, text: 'Las contrasenas no coinciden' });
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setMsg({ ok: true, text: 'Contrasena actualizada correctamente.' });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'No se pudo actualizar' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Mi cuenta</h1>

      <div className="card p-6 max-w-md">
        <div className="mb-5 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand"><IconUser className="w-7 h-7" /></div>
          <div>
            <h2 className="text-lg font-bold">{user?.name || 'Administrador'}</h2>
            <p className="text-sm text-slate-500">Usuario: {user?.cedula}</p>
          </div>
        </div>

        <h3 className="mb-3 font-bold">Cambiar contrasena</h3>
        <form onSubmit={changePwd} className="space-y-3">
          <div>
            <label className="label">Contrasena actual</label>
            <PasswordInput value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nueva contrasena</label>
            <PasswordInput value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Confirmar nueva contrasena</label>
            <PasswordInput value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} required />
          </div>
          {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-500' : 'text-red-500'}`}>{msg.text}</p>}
          <button className="btn-primary w-full" disabled={saving}>{saving ? 'Guardando...' : 'Actualizar contrasena'}</button>
        </form>
      </div>
    </div>
  );
}
