// ============================================================
//  Contexto de autenticacion: guarda el usuario y el token,
//  expone login / logout y el rol actual.
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('bm_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Guarda sesion en localStorage
  function persist(token, user) {
    localStorage.setItem('bm_token', token);
    localStorage.setItem('bm_user', JSON.stringify(user));
    setUser(user);
  }

  // Inicia sesion. Devuelve { needsPassword } si es primer ingreso.
  async function login(cedula, password) {
    const { data } = await api.post('/auth/login', { cedula, password });
    if (data.needsPassword) return { needsPassword: true, cedula: data.cedula };
    persist(data.token, data.user);
    return { user: data.user };
  }

  // Primer ingreso: crea la contrasena
  async function setPassword(cedula, password) {
    const { data } = await api.post('/auth/set-password', { cedula, password });
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('bm_token');
    localStorage.removeItem('bm_user');
    setUser(null);
  }

  const value = { user, login, setPassword, logout, isAdmin: user?.role === 'admin' };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
