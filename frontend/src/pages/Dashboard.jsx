// ============================================================
//  Dashboard del administrador: indicadores, ingresos por mes,
//  productos mas vendidos y proximos eventos.
// ============================================================
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import api from '../api/client';
import { Spinner, money, fdate } from '../components/ui';
import { IconUsers, IconAlert, IconMoney, IconCheck } from '../components/Icons';

// Tarjeta de indicador
function Stat({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'from-brand-500 to-brand-700',
    red: 'from-red-500 to-red-700',
    green: 'from-emerald-500 to-emerald-700',
    amber: 'from-amber-500 to-amber-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-extrabold">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data));
  }, []);

  if (!data) return <Spinner />;

  const chartData = data.ingresosPorMes.map((m) => ({ mes: m.mes.slice(5), total: m.total }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Panel principal</h1>
        <p className="text-slate-500">Resumen general del gimnasio</p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={IconUsers} label="Clientes activos" value={data.clientesActivos} tone="green" />
        <Stat icon={IconAlert} label="Mensualidad vencida" value={data.clientesVencidos} tone="red" />
        <Stat icon={IconMoney} label="Ingresos del mes" value={money(data.ingresosMes)} tone="brand" />
        <Stat icon={IconCheck} label="Asistencia hoy" value={data.asistenciaHoy} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Grafica de ingresos */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 font-bold">Ingresos por mes</h3>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">Aun no hay ingresos registrados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => money(v)} />
                <Bar dataKey="total" fill="#1CA3DE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Productos mas vendidos */}
        <div className="card p-5">
          <h3 className="mb-4 font-bold">Productos mas vendidos</h3>
          {data.masVendidos.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Sin ventas registradas.</p>
          ) : (
            <ul className="space-y-3">
              {data.masVendidos.map((p, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/15 text-brand text-xs font-bold">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-sm text-slate-500">{p.unidades} u.</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Proximos eventos */}
      <div className="card p-5">
        <h3 className="mb-4 font-bold">Proximos eventos</h3>
        {data.proximosEventos.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No hay eventos programados.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.proximosEventos.map((e) => (
              <div key={e.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <span className="badge-warn">{e.type}</span>
                <p className="mt-2 font-semibold">{e.title}</p>
                <p className="text-sm text-slate-500">{fdate(e.event_date)} {e.event_time || ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
