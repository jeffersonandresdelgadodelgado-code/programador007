// ============================================================
//  Mensualidad del CLIENTE: estado, fecha de vencimiento e
//  historial completo de pagos.
// ============================================================
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner, Empty, money, fdate } from '../../components/ui';

export default function ClientPayments() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/payments/me').then((r) => setData(r.data)); }, []);
  if (!data) return <Spinner />;

  const vigente = data.status === 'Activo';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Mi mensualidad</h1>

      <div className={`card p-6 ${vigente ? 'border-emerald-300/50' : 'border-red-300/50'}`}>
        <p className="text-sm text-slate-500">Estado actual</p>
        <p className={`text-3xl font-extrabold ${vigente ? 'text-emerald-500' : 'text-red-500'}`}>{data.status}</p>
        {data.due_date && <p className="mt-1 text-slate-500">Fecha de vencimiento: <b>{fdate(data.due_date)}</b></p>}
        {!vigente && <p className="mt-2 text-sm text-red-500">Acercate a recepcion para renovar tu mensualidad.</p>}
      </div>

      <div className="card overflow-hidden">
        <h3 className="border-b border-slate-100 dark:border-slate-700 px-5 py-4 font-bold">Historial de pagos</h3>
        {data.history.length === 0 ? <Empty>Aun no tienes pagos registrados.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Concepto</th>
                  <th className="px-5 py-3 font-semibold">Monto</th>
                  <th className="px-5 py-3 font-semibold">Pago</th>
                  <th className="px-5 py-3 font-semibold">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.history.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-medium">{p.concept}</td>
                    <td className="px-5 py-3">{money(p.amount)}</td>
                    <td className="px-5 py-3">{fdate(p.payment_date)}</td>
                    <td className="px-5 py-3">{fdate(p.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
