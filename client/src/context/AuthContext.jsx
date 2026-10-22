import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wv_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wv_token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('wv_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('wv_token');
        localStorage.removeItem('wv_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (data) => {
    localStorage.setItem('wv_token', data.token);
    localStorage.setItem('wv_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    persist(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('wv_token');
    localStorage.removeItem('wv_user');
    setUser(null);
  };

  const refresh = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      localStorage.setItem('wv_user', JSON.stringify(data.user));
      return data.user;
    } catch { return null; }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}