// ============================================================
//  Enrutador principal y proteccion de rutas por rol.
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Paginas comunes / admin
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import Routines from './pages/Routines';
import Events from './pages/Events';
import Products from './pages/Products';
import Attendance from './pages/Attendance';
import Account from './pages/Account';
import Wods from './pages/Wods';
import ClientRecords from './pages/client/ClientRecords';

// Paginas del cliente
import ClientHome from './pages/client/ClientHome';
import ClientProfile from './pages/client/ClientProfile';
import ClientPayments from './pages/client/ClientPayments';
import ClientRoutines from './pages/client/ClientRoutines';
import ClientProgress from './pages/client/ClientProgress';
import ClientStore from './pages/client/ClientStore';

// Envuelve una pagina exigiendo sesion (y opcionalmente un rol)
function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Inicio: dashboard admin o inicio del cliente */}
      <Route path="/" element={<Protected>{isAdmin ? <Dashboard /> : <ClientHome />}</Protected>} />

      {/* ---- Rutas de administrador ---- */}
      <Route path="/clientes" element={<Protected role="admin"><Clients /></Protected>} />
      <Route path="/pagos" element={<Protected role="admin"><Payments /></Protected>} />
      <Route path="/rutinas" element={<Protected role="admin"><Routines /></Protected>} />
      <Route path="/productos" element={<Protected role="admin"><Products /></Protected>} />
      <Route path="/asistencia" element={<Protected role="admin"><Attendance /></Protected>} />
      <Route path="/cuenta" element={<Protected role="admin"><Account /></Protected>} />

      {/* ---- Rutas del cliente ---- */}
      <Route path="/perfil" element={<Protected role="cliente"><ClientProfile /></Protected>} />
      <Route path="/mis-pagos" element={<Protected role="cliente"><ClientPayments /></Protected>} />
      <Route path="/mis-rutinas" element={<Protected role="cliente"><ClientRoutines /></Protected>} />
      <Route path="/mi-progreso" element={<Protected role="cliente"><ClientProgress /></Protected>} />
      <Route path="/tienda" element={<Protected role="cliente"><ClientStore /></Protected>} />

      {/* ---- Cliente: records ---- */}
      <Route path="/mis-records" element={<Protected role="cliente"><ClientRecords /></Protected>} />

      {/* ---- Compartidas ---- */}
      <Route path="/eventos" element={<Protected><Events /></Protected>} />
      <Route path="/wods" element={<Protected><Wods /></Protected>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
