// ============================================================
//  Perfil del CLIENTE: ver datos personales y cambiar contrasena.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Spinner, fdate, PasswordInput } from '../../components/ui';
import { IconUser } from '../../components/Icons';

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 dark:border-slate-700 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-right">{value || '-'}</span>
    </div>
  );
}

export default function ClientProfile() {
  const { user } = useAuth();
  const [c, setC] = useState(null);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (user?.client_id) api.get(`/clients/${user.client_id}`).then((r) => setC(r.data));
  }, [user]);

  async function changePwd(e) {
    e.preventDefault(); setMsg(null);
    if (pwd.newPassword !== pwd.confirm) return setMsg({ ok: false, text: 'Las contrasenas no coinciden' });
    try {
      await api.post('/auth/change-password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setMsg({ ok: true, text: 'Contrasena actualizada.' });
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'No se pudo actualizar' });
    }
  }

  if (!c) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Mi perfil</h1>

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand/15 text-brand"><IconUser className="w-8 h-8" /></div>
          <div>
            <h2 className="text-xl font-bold">{c.full_name}</h2>
            <p className="text-slate-500">Cedula: {c.cedula}</p>
          </div>
        </div>
        <div className="mt-5 grid sm:grid-cols-2 sm:gap-x-8">
          <Row label="Telefono" value={c.phone} />
          <Row label="Correo" value={c.email} />
          <Row label="Fecha de nacimiento" value={fdate(c.birth_date)} />
          <Row label="Ocupacion" value={c.occupation} />
          <Row label="Peso inicial" value={c.initial_weight ? `${c.initial_weight} kg` : null} />
          <Row label="Estatura" value={c.height ? `${c.height} cm` : null} />
          <Row label="Fecha de ingreso" value={fdate(c.join_date)} />
          <Row label="Objetivo" value={c.goal} />
        </div>
      </div>

      <div className="card p-6 max-w-md">
        <h3 className="mb-4 font-bold">Cambiar contrasena</h3>
        <form onSubmit={changePwd} className="space-y-3">
          <div><label className="label">Contrasena actual</label><PasswordInput value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} /></div>
          <div><label className="label">Nueva contrasena</label><PasswordInput value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} required /></div>
          <div><label className="label">Confirmar</label><PasswordInput value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} required /></div>
          {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-500' : 'text-red-500'}`}>{msg.text}</p>}
          <button className="btn-primary w-full">Actualizar contrasena</button>
        </form>
      </div>
    </div>
  );
}
