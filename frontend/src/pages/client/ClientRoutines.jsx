// ============================================================
//  Rutinas asignadas al CLIENTE, con detalle de cada ejercicio
//  (series, repeticiones, descanso e imagen/video).
// ============================================================
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner, Empty } from '../../components/ui';
import { IconDumbbell } from '../../components/Icons';

export default function ClientRoutines() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/routines/me').then((r) => setList(r.data)); }, []);

  if (!list) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Mis rutinas</h1>

      {list.length === 0 ? <Empty>Aun no tienes rutinas asignadas. Habla con tu entrenador.</Empty> : (
        <div className="space-y-5">
          {list.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand"><IconDumbbell className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold">{r.name}</h3>
                  <span className="badge-warn">{r.level}</span>
                </div>
              </div>
              {r.description && <p className="mt-2 text-sm text-slate-500">{r.description}</p>}

              <div className="mt-4 space-y-3">
                {r.exercises.map((ex) => (
                  <div key={ex.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold">{ex.name}</h4>
                      <div className="flex gap-2 text-sm">
                        <span className="badge-ok">{ex.sets} series</span>
                        <span className="badge-ok">{ex.reps} reps</span>
                        <span className="badge-warn">{ex.rest_seconds}s descanso</span>
                      </div>
                    </div>
                    {ex.description && <p className="mt-1 text-sm text-slate-500">{ex.description}</p>}
                    {ex.media_url && (
                      <a href={ex.media_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
                        Ver imagen / video explicativo
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
