// ============================================================
//  Cliente HTTP centralizado (axios)
//  - Agrega el token JWT en cada peticion
//  - Maneja el cierre de sesion al expirar el token
// ============================================================
import axios from 'axios';

// En desarrollo usa el proxy de Vite ('/api' -> localhost:4000).
// En produccion define VITE_API_URL con la URL publica del backend
// (ej: https://tu-backend.onrender.com/api).
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Interceptor de peticion: inyecta el token guardado
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de respuesta: si el token expira, cierra sesion
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('bm_token')) {
      localStorage.removeItem('bm_token');
      localStorage.removeItem('bm_user');
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
