// ============================================================
//  Tienda del CLIENTE: catalogo de productos disponibles.
//  (Solo consulta; las ventas las registra el administrador.)
// ============================================================
import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Spinner, Empty, money, ZoomImage } from '../../components/ui';
import { IconBox } from '../../components/Icons';

export default function ClientStore() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/products').then((r) => setList(r.data)); }, []);

  if (!list) return <Spinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Tienda</h1>
        <p className="text-slate-500">Productos disponibles en el gimnasio</p>
      </div>

      {list.length === 0 ? <Empty>No hay productos disponibles.</Empty> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((p) => (
            <div key={p.id} className="card overflow-hidden p-5">
              {p.image
                ? <ZoomImage src={p.image} alt={p.name} className="-mx-5 -mt-5 mb-4 h-40 w-[calc(100%+2.5rem)] max-w-none object-cover" />
                : <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/15 text-brand"><IconBox className="w-6 h-6" /></div>}
              <h3 className="mt-3 font-bold">{p.name}</h3>
              <span className="badge-warn">{p.category}</span>
              {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-extrabold text-brand">{money(p.price)}</span>
                <span className={`badge ${p.stock > 0 ? 'badge-ok' : 'badge-bad'}`}>
                  {p.stock > 0 ? 'Disponible' : 'Agotado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
